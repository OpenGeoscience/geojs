var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var lineFeature = require('../lineFeature');

var MAX_MITER_LIMIT = 100;

/* Flags are passed to the vertex shader in a float.  Since a 32-bit float has
 * 24 bits of mantissa, including the sign bit, a maximum of 23 bits of flags
 * can be passed in a float without loss or complication. */
/* vertex flags specify which direction a vertex needs to be offset */
var flagsVertex = {  // uses 2 bits
  corner: 0,
  near: 1,
  far: 3
};
var flagsLineCap = {  // uses 3 bits with flagsLineJoin
  butt: 0,
  square: 1,
  round: 2
};
var flagsLineJoin = {  // uses 3 bits with flagsLineCap
  passthrough: 3,
  miter: 4,
  bevel: 5,
  round: 6,
  'miter-clip': 7
};
var flagsNearLineShift = 2, flagsFarLineShift = 5;
var flagsNearOffsetShift = 8;  // uses 11 bits
/* Fixed flags */
var flagsDebug = {  // uses 1 bit
  normal: 0,
  debug: 1
};

/**
 * Create a new instance of lineFeature.
 *
 * @class
 * @alias geo.webgl.lineFeature
 * @extends geo.lineFeature
 * @param {geo.lineFeature.spec} arg
 * @returns {geo.webgl.lineFeature}
 */
var webgl_lineFeature = function (arg) {
  'use strict';
  if (!(this instanceof webgl_lineFeature)) {
    return new webgl_lineFeature(arg);
  }
  arg = arg || {};
  lineFeature.call(this, arg);

  var vgl = require('vgl');
  var transform = require('../transform');
  var util = require('../util');
  var object = require('./object');
  var fragmentShader = require('./lineFeature.frag');
  var fragmentShaderDebug = require('./lineFeatureDebug.frag');
  var vertexShader = require('./lineFeature.vert');

  object.call(this);

  /**
   * @private
   */
  var m_this = this,
      s_exit = this._exit,
      m_actor,
      m_mapper,
      m_material,
      m_pixelWidthUnif,
      m_aspectUniform,
      m_miterLimitUniform,
      m_antialiasingUniform,
      m_flagsUniform,
      m_dynamicDraw = arg.dynamicDraw === undefined ? false : arg.dynamicDraw,
      m_geometry,
      m_origin,
      m_modelViewUniform,
      s_init = this._init,
      s_update = this._update;

  /**
   * Create the vertex shader for lines.
   *
   * @returns {vgl.shader}
   */
  function createVertexShader() {
    var shader = new vgl.shader(vgl.GL.VERTEX_SHADER);
    shader.setShaderSource(vertexShader);
    return shader;
  }

  /**
   * Create the fragment shader for lines.
   *
   * @param {boolean} [allowDebug] If truthy, include code that can render
   *    in debug mode.  This is mildly less efficient, even if debugging is
   *    not turned on.
   * @returns {vgl.shader}
   */
  function createFragmentShader(allowDebug) {
    var shader = new vgl.shader(vgl.GL.FRAGMENT_SHADER);
    shader.setShaderSource(allowDebug ? fragmentShaderDebug : fragmentShader);
    return shader;
  }

  /**
   * Create and style the data needed to render the lines.
   *
   * @param {boolean} onlyStyle if true, use the existing geoemtry and just
   *    recalculate the style.
   */
  function createGLLines(onlyStyle) {
    var data = m_this.data(),
        d, i, j, k, v, v2, lidx,
        numSegments = 0, len,
        lineItemList, lineItem, lineItemData,
        vert = [{}, {}], v1 = vert[1],
        pos, posIdx3, firstpos, firstPosIdx3,
        strokeWidthFunc = m_this.style.get('strokeWidth'), strokeWidthVal,
        strokeColorFunc = m_this.style.get('strokeColor'), strokeColorVal,
        strokeOpacityFunc = m_this.style.get('strokeOpacity'), strokeOpacityVal,
        lineCapFunc = m_this.style.get('lineCap'), lineCapVal,
        lineJoinFunc = m_this.style.get('lineJoin'), lineJoinVal,
        strokeOffsetFunc = m_this.style.get('strokeOffset'), strokeOffsetVal,
        miterLimit = m_this.style.get('miterLimit')(data),
        antialiasing = m_this.style.get('antialiasing')(data) || 0,
        order = m_this.featureVertices(),
        orderLen = order.length,
        posBuf, prevBuf, nextBuf, farBuf, flagsBuf, indicesBuf,
        fixedFlags = (flagsDebug[m_this.style.get('debug')(data) ? 'debug' : 'normal'] || 0),
        strokeWidthBuf, strokeColorBuf, strokeOpacityBuf,
        dest, dest3,
        geom = m_mapper.geometryData(),
        closedFunc = m_this.style.get('closed'), closedVal, closed = [],
        updateFlags = true;

    closedVal = util.isFunction(m_this.style('closed')) ? undefined : (closedFunc() || false);
    lineCapVal = util.isFunction(m_this.style('lineCap')) ? undefined : (lineCapFunc() || 'butt');
    lineJoinVal = util.isFunction(m_this.style('lineJoin')) ? undefined : (lineJoinFunc() || 'miter');
    strokeColorVal = util.isFunction(m_this.style('strokeColor')) ? undefined : strokeColorFunc();
    strokeOffsetVal = util.isFunction(m_this.style('strokeOffset')) ? undefined : (strokeOffsetFunc() || 0);
    strokeOpacityVal = util.isFunction(m_this.style('strokeOpacity')) ? undefined : strokeOpacityFunc();
    strokeWidthVal = util.isFunction(m_this.style('strokeWidth')) ? undefined : strokeWidthFunc();

    if (miterLimit !== undefined) {
      /* We impose a limit no matter what, since otherwise the growth is
       * unbounded.  Values less than 1 make no sense, since we are using the
       * SVG definition of miter length. */
      m_miterLimitUniform.set(Math.max(1, Math.min(MAX_MITER_LIMIT, miterLimit)));
    }
    m_flagsUniform.set(fixedFlags);
    m_antialiasingUniform.set(antialiasing);

    if (!onlyStyle) {
      var position = [],
          posFunc = m_this.position();
      lineItemList = new Array(data.length);
      for (i = 0; i < data.length; i += 1) {
        d = data[i];
        lineItem = m_this.line()(d, i);
        lineItemList[i] = lineItem;
        if (lineItem.length < 2) {
          continue;
        }
        numSegments += lineItem.length - 1;
        for (j = 0; j < lineItem.length; j += 1) {
          pos = posFunc(lineItem[j], j, d, i);
          position.push(pos.x);
          position.push(pos.y);
          position.push(pos.z || 0.0);
          if (!j) {
            firstpos = pos;
          }
        }
        if (lineItem.length > 2 && (closedVal === undefined ? closedFunc(d, i) : closedVal)) {
          /* line is closed */
          if (pos.x !== firstpos.x || pos.y !== firstpos.y ||
              pos.z !== firstpos.z) {
            numSegments += 1;
            closed[i] = 2;  /* first and last points are distinct */
          } else {
            closed[i] = 1;  /* first point is repeated as last point */
          }
        }
      }

      position = transform.transformCoordinates(
        m_this.gcs(), m_this.layer().map().gcs(), position, 3);
      m_origin = new Float32Array(m_this.style.get('origin')(position));
      if (m_origin[0] || m_origin[1] || m_origin[2]) {
        for (i = 0; i < position.length; i += 3) {
          position[i] -= m_origin[0];
          position[i + 1] -= m_origin[1];
          position[i + 2] -= m_origin[2];
        }
      }
      m_modelViewUniform.setOrigin(m_origin);

      len = numSegments * orderLen;
      posBuf = util.getGeomBuffer(geom, 'pos', len * 3);
      prevBuf = util.getGeomBuffer(geom, 'prev', len * 3);
      nextBuf = util.getGeomBuffer(geom, 'next', len * 3);
      farBuf = util.getGeomBuffer(geom, 'far', len * 3);

      indicesBuf = geom.primitive(0).indices();
      if (!(indicesBuf instanceof Uint16Array) || indicesBuf.length !== len) {
        indicesBuf = new Uint16Array(len);
        geom.primitive(0).setIndices(indicesBuf);
      }
      // save some information to be reused when we update only style
      m_geometry = {
        numSegments: numSegments,
        closed: closed,
        lineItemList: lineItemList,
        lineCapVal: lineCapVal,
        lineJoinVal: lineJoinVal,
        strokeOffsetVal: strokeOffsetVal
      };
    } else {
      numSegments = m_geometry.numSegments;
      closed = m_geometry.closed;
      lineItemList = m_geometry.lineItemList;
      len = numSegments * orderLen;
      updateFlags = (
        (lineCapVal !== m_geometry.lineCapVal || lineCapVal === undefined) ||
        (lineJoinVal !== m_geometry.lineJoinVal || lineJoinVal === undefined) ||
        (strokeOffsetVal !== m_geometry.strokeOffsetVal || strokeOffsetVal === undefined)
      );
    }

    flagsBuf = util.getGeomBuffer(geom, 'flags', len);
    strokeWidthBuf = util.getGeomBuffer(geom, 'strokeWidth', len);
    strokeColorBuf = util.getGeomBuffer(geom, 'strokeColor', len * 3);
    strokeOpacityBuf = util.getGeomBuffer(geom, 'strokeOpacity', len);

    for (i = posIdx3 = dest = dest3 = 0; i < data.length; i += 1) {
      lineItem = lineItemList[i];
      if (lineItem.length < 2) {
        continue;
      }
      d = data[i];
      firstPosIdx3 = posIdx3;
      for (j = 0; j < lineItem.length + (closed[i] === 2 ? 1 : 0); j += 1, posIdx3 += 3) {
        lidx = j;
        if (j === lineItem.length) {
          lidx = 0;
          posIdx3 -= 3;
        }
        lineItemData = lineItem[lidx];
        /* swap entries in vert so that vert[0] is the first vertex, and
         * vert[1] will be reused for the second vertex */
        if (j) {
          v1 = vert[0];
          vert[0] = vert[1];
          vert[1] = v1;
        }
        if (!onlyStyle) {
          v1.pos = j === lidx ? posIdx3 : firstPosIdx3;
          v1.prev = lidx ? posIdx3 - 3 : (closed[i] ?
            firstPosIdx3 + (lineItem.length - 3 + closed[i]) * 3 : posIdx3);
          v1.next = j + 1 < lineItem.length ? posIdx3 + 3 : (closed[i] ?
            (j !== lidx ? firstPosIdx3 + 3 : firstPosIdx3 + 6 - closed[i] * 3) :
            posIdx3);
        }
        v1.strokeWidth = strokeWidthVal === undefined ? strokeWidthFunc(lineItemData, lidx, d, i) : strokeWidthVal;
        v1.strokeColor = strokeColorVal === undefined ? strokeColorFunc(lineItemData, lidx, d, i) : strokeColorVal;
        v1.strokeOpacity = strokeOpacityVal === undefined ? strokeOpacityFunc(lineItemData, lidx, d, i) : strokeOpacityVal;
        if (updateFlags) {
          v1.strokeOffset = (strokeOffsetVal === undefined ? strokeOffsetFunc(lineItemData, lidx, d, i) : strokeOffsetVal) || 0;
          if (v1.strokeOffset) {
            /* we use 11 bits to store the offset, and we want to store values
             * from -1 to 1, so multiply our values by 1023, and use some bit
             * manipulation to ensure that it is packed properly */
            v1.posStrokeOffset = Math.round(2048 + 1023 * Math.min(1, Math.max(-1, v1.strokeOffset))) & 0x7FF;
            v1.negStrokeOffset = Math.round(2048 - 1023 * Math.min(1, Math.max(-1, v1.strokeOffset))) & 0x7FF;
          } else {
            v1.posStrokeOffset = v1.negStrokeOffset = 0;
          }
          if (!closed[i] && (!j || j === lineItem.length - 1)) {
            v1.flags = flagsLineCap[lineCapVal === undefined ? lineCapFunc(lineItemData, lidx, d, i) : lineCapVal] || flagsLineCap.butt;
          } else {
            v1.flags = flagsLineJoin[lineJoinVal === undefined ? lineJoinFunc(lineItemData, lidx, d, i) : lineJoinVal] || flagsLineJoin.miter;
          }
        }

        if (j) {
          /* zero out the z position.  This can be changed if we handle it in
           * the shader. */
          for (k = 0; k < orderLen; k += 1, dest += 1, dest3 += 3) {
            v = vert[order[k][0]];
            v2 = vert[1 - order[k][0]];
            if (!onlyStyle) {
              posBuf[dest3] = position[v.pos];
              posBuf[dest3 + 1] = position[v.pos + 1];
              posBuf[dest3 + 2] = 0; // position[v.pos + 2];
            }
            if (!order[k][0]) {
              if (!onlyStyle) {
                prevBuf[dest3] = position[v.prev];
                prevBuf[dest3 + 1] = position[v.prev + 1];
                prevBuf[dest3 + 2] = 0; // position[v.prev + 2];
                nextBuf[dest3] = position[v.next];
                nextBuf[dest3 + 1] = position[v.next + 1];
                nextBuf[dest3 + 2] = 0; // position[v.next + 2];
                farBuf[dest3] = position[v2.next];
                farBuf[dest3 + 1] = position[v2.next + 1];
                farBuf[dest3 + 2] = 0; // position[v2.next + 2];
              }
              if (updateFlags) {
                flagsBuf[dest] = (flagsVertex[order[k][1]] |
                  (v.flags << flagsNearLineShift) |
                  (v2.flags << flagsFarLineShift) |
                  (v.negStrokeOffset << flagsNearOffsetShift));
              }
            } else {
              if (!onlyStyle) {
                prevBuf[dest3] = position[v.next];
                prevBuf[dest3 + 1] = position[v.next + 1];
                prevBuf[dest3 + 2] = 0; // position[v.next + 2];
                nextBuf[dest3] = position[v.prev];
                nextBuf[dest3 + 1] = position[v.prev + 1];
                nextBuf[dest3 + 2] = 0; // position[v.prev + 2];
                farBuf[dest3] = position[v2.prev];
                farBuf[dest3 + 1] = position[v2.prev + 1];
                farBuf[dest3 + 2] = 0; // position[v2.prev + 2];
              }
              if (updateFlags) {
                flagsBuf[dest] = (flagsVertex[order[k][1]] |
                  (v.flags << flagsNearLineShift) |
                  (v2.flags << flagsFarLineShift) |
                  (v.posStrokeOffset << flagsNearOffsetShift));
              }
            }
            strokeWidthBuf[dest] = v.strokeWidth;
            strokeColorBuf[dest3] = v.strokeColor.r;
            strokeColorBuf[dest3 + 1] = v.strokeColor.g;
            strokeColorBuf[dest3 + 2] = v.strokeColor.b;
            strokeOpacityBuf[dest] = v.strokeOpacity;
          }
        }
      }
    }

    m_mapper.modified();
    if (!onlyStyle) {
      geom.boundsDirty(true);
      m_mapper.boundsDirtyTimestamp().modified();
    }
  }

  /**
   * Return the arrangement of vertices used for each line segment.  Each line
   * is rendered by two triangles.  This reports how the vertices of those
   * triangles are arranged.  Each entry is a triple: the line-end number, the
   * vertex use, and the side of the line that the vertex is on.
   *
   * @returns {array[]}
   */
  this.featureVertices = function () {
    return [
      [0, 'corner', -1], [0, 'near', 1], [1, 'far', -1],
      [1, 'corner', 1], [1, 'near', -1], [0, 'far', 1]];
  };

  /**
   * Return the number of vertices used for each line segment.
   *
   * @returns {number}
   */
  this.verticesPerFeature = function () {
    return m_this.featureVertices().length;
  };

  /**
   * Initialize.
   *
   * @param {geo.lineFeature.spec} arg The feature specification.
   * @returns {this}
   */
  this._init = function (arg) {
    var prog = vgl.shaderProgram(),
        vs = createVertexShader(),
        fs = createFragmentShader(((arg || {}).style || {}).debug !== undefined),
        // Vertex attributes
        posAttr = vgl.vertexAttribute('pos'),
        prvAttr = vgl.vertexAttribute('prev'),
        nxtAttr = vgl.vertexAttribute('next'),
        farAttr = vgl.vertexAttribute('far'),
        flagsAttr = vgl.vertexAttribute('flags'),
        strkWidthAttr = vgl.vertexAttribute('strokeWidth'),
        strkColorAttr = vgl.vertexAttribute('strokeColor'),
        strkOpacityAttr = vgl.vertexAttribute('strokeOpacity'),
        // Shader uniforms
        prjUnif = new vgl.projectionUniform('projectionMatrix'),
        geom = vgl.geometryData(),
        // Sources
        posData = vgl.sourceDataP3fv({name: 'pos'}),
        prvPosData = vgl.sourceDataAnyfv(
          3, vgl.vertexAttributeKeysIndexed.Four, {name: 'prev'}),
        nxtPosData = vgl.sourceDataAnyfv(
          3, vgl.vertexAttributeKeysIndexed.Five, {name: 'next'}),
        farPosData = vgl.sourceDataAnyfv(
          3, vgl.vertexAttributeKeysIndexed.Six, {name: 'far'}),
        flagsData = vgl.sourceDataAnyfv(
          1, vgl.vertexAttributeKeysIndexed.Seven, {name: 'flags'}),
        strkWidthData = vgl.sourceDataAnyfv(
          1, vgl.vertexAttributeKeysIndexed.One, {name: 'strokeWidth'}),
        strkColorData = vgl.sourceDataAnyfv(
          3, vgl.vertexAttributeKeysIndexed.Two, {name: 'strokeColor'}),
        strkOpacityData = vgl.sourceDataAnyfv(
          1, vgl.vertexAttributeKeysIndexed.Three, {name: 'strokeOpacity'}),
        // Primitive indices
        triangles = vgl.triangles();
    m_modelViewUniform = new vgl.modelViewOriginUniform('modelViewMatrix');

    m_pixelWidthUnif = new vgl.floatUniform(
      'pixelWidth', 1.0 / m_this.renderer().width());
    m_aspectUniform = new vgl.floatUniform(
      'aspect', m_this.renderer().width() / m_this.renderer().height());
    m_miterLimitUniform = new vgl.floatUniform('miterLimit', 10);
    m_antialiasingUniform = new vgl.floatUniform('antialiasing', 0);
    m_flagsUniform = new vgl.floatUniform('fixedFlags', 0);

    s_init.call(m_this, arg);
    m_material = vgl.material();
    m_mapper = vgl.mapper({dynamicDraw: m_dynamicDraw});

    prog.addVertexAttribute(posAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(strkWidthAttr, vgl.vertexAttributeKeysIndexed.One);
    prog.addVertexAttribute(strkColorAttr, vgl.vertexAttributeKeysIndexed.Two);
    prog.addVertexAttribute(strkOpacityAttr, vgl.vertexAttributeKeysIndexed.Three);
    prog.addVertexAttribute(prvAttr, vgl.vertexAttributeKeysIndexed.Four);
    prog.addVertexAttribute(nxtAttr, vgl.vertexAttributeKeysIndexed.Five);
    prog.addVertexAttribute(farAttr, vgl.vertexAttributeKeysIndexed.Six);
    prog.addVertexAttribute(flagsAttr, vgl.vertexAttributeKeysIndexed.Seven);

    prog.addUniform(m_modelViewUniform);
    prog.addUniform(prjUnif);
    prog.addUniform(m_pixelWidthUnif);
    prog.addUniform(m_aspectUniform);
    prog.addUniform(m_miterLimitUniform);
    prog.addUniform(m_antialiasingUniform);
    prog.addUniform(m_flagsUniform);

    prog.addShader(fs);
    prog.addShader(vs);

    m_material.addAttribute(prog);
    m_material.addAttribute(vgl.blend());

    m_actor = vgl.actor();
    m_actor.setMaterial(m_material);
    m_actor.setMapper(m_mapper);

    geom.addSource(posData);
    geom.addSource(prvPosData);
    geom.addSource(nxtPosData);
    geom.addSource(farPosData);
    geom.addSource(strkWidthData);
    geom.addSource(strkColorData);
    geom.addSource(strkOpacityData);
    geom.addSource(flagsData);
    geom.addPrimitive(triangles);
    /* We don't need vgl to compute bounds, so make the geo.computeBounds just
     * set them to 0. */
    geom.computeBounds = function () {
      geom.setBounds(0, 0, 0, 0, 0, 0);
    };
    m_mapper.setGeometryData(geom);
    return m_this;
  };

  /**
   * List vgl actors.
   *
   * @returns {vgl.actor[]} The list of actors.
   */
  this.actors = function () {
    return m_actor ? [m_actor] : [];
  };

  /**
   * Build.  Create the necessary elements to render lines.
   *
   * There are several optimizations to do less work when possible.  If only
   * styles have changed, the geometry is not re-transformed.  If styles use
   * static values (rather than functions), they are only calculated once.  If
   * styles have not changed that would affect flags (lineCap, lineJoin, and
   * strokeOffset), the vertex flags are not recomputed -- this helps, as it is
   * a slow step due to most javascript interpreters not optimizing bit
   * operations.
   *
   * @returns {this}
   */
  this._build = function () {
    createGLLines(m_this.dataTime().timestamp() < m_this.buildTime().timestamp() && m_geometry);

    if (!m_this.renderer().contextRenderer().hasActor(m_actor)) {
      m_this.renderer().contextRenderer().addActor(m_actor);
    }
    m_this.buildTime().modified();
    return m_this;
  };

  /**
   * Update.  Rebuild if necessary.
   *
   * @returns {this}
   */
  this._update = function () {
    s_update.call(m_this);

    if (m_this.dataTime().timestamp() >= m_this.buildTime().timestamp() ||
        m_this.updateTime().timestamp() <= m_this.timestamp()) {
      m_this._build();
    }

    m_pixelWidthUnif.set(1.0 / m_this.renderer().width());
    m_aspectUniform.set(m_this.renderer().width() /
                        m_this.renderer().height());
    m_actor.setVisible(m_this.visible());
    m_actor.material().setBinNumber(m_this.bin());
    m_this.updateTime().modified();
    return m_this;
  };

  /**
   * Destroy.  Free used resources.
   */
  this._exit = function () {
    m_this.renderer().contextRenderer().removeActor(m_actor);
    m_actor = null;
    s_exit();
  };

  this._init(arg);
  return this;
};

inherit(webgl_lineFeature, lineFeature);

var capabilities = {};
capabilities[lineFeature.capabilities.basic] = true;
capabilities[lineFeature.capabilities.multicolor] = true;

// Now register it
registerFeature('webgl', 'line', webgl_lineFeature, capabilities);

module.exports = webgl_lineFeature;
