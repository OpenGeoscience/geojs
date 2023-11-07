var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var lineFeature = require('../lineFeature');

var MAX_MITER_LIMIT = 100;

/* Flags are passed to the vertex shader in a float.  Since a 32-bit float has
 * 24 bits of mantissa, including the sign bit, a maximum of 23 bits of flags
 * can be passed in a float without loss or complication.
 *   The flags*Shift values are the bit offsets within the flag value.  The
 * flags*Mult values are the bit-offset values converted to a multiplier (2
 * raised to the offset value).  The overall flags value is composed of:
 *  bits 0-1: vertex (corner, near, far) used by the shader to know where in
 *            the geometry the vertex is used.
 *       2-4: near cap/join style
 *       5-7: far cap/join style
 *       8-18: stroke offset as a signed value in the range [-1023,1023] which
 *             maps to a floating-point stroke offset of [-1,1].
 */
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
var flagsNearLineShift = 2, flagsNearLineMult = 1 << flagsNearLineShift;
var flagsFarLineShift = 5, flagsFarLineMult = 1 << flagsFarLineShift;
var flagsNearOffsetShift = 8,  // uses 11 bits
    flagsNearOffsetMult = 1 << flagsNearOffsetShift;
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

  var vgl = require('../vgl');
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
   * @param {boolean} onlyStyle if true, use the existing geometry and just
   *    recalculate the style.
   */
  function createGLLines(onlyStyle) {
    var data = m_this.data(),
        d, i, j, k, v1, v2, lidx, maxj,
        numSegments = 0, len,
        lineItemList, lineItem, lineItemData,
        vert = [{
          strokeOffset: 0, posStrokeOffset: 0, negStrokeOffset: 0
        }, {
          strokeOffset: 0, posStrokeOffset: 0, negStrokeOffset: 0
        }],
        v = vert[1],
        target_gcs = m_this.gcs(),
        map_gcs = m_this.layer().map().gcs(),
        pos, posIdx3, firstpos, firstPosIdx3,
        lineFunc = m_this.line(),
        strokeWidthFunc = m_this.style.get('strokeWidth'), strokeWidthVal,
        strokeColorFunc = m_this.style.get('strokeColor'), strokeColorVal,
        strokeOpacityFunc = m_this.style.get('strokeOpacity'), strokeOpacityVal,
        lineCapFunc = m_this.style.get('lineCap'), lineCapVal,
        lineJoinFunc = m_this.style.get('lineJoin'), lineJoinVal,
        strokeOffsetFunc = m_this.style.get('strokeOffset'), strokeOffsetVal,
        miterLimit = m_this.style.get('miterLimit')(data),
        antialiasing = m_this.style.get('antialiasing')(data) || 0,
        uniformFunc = m_this.style.get('uniformLine'), uniformVal, uniform,
        order = m_this.featureVertices(), orderk0, prevkey, nextkey, offkey,
        orderLen = order.length,
        // webgl buffers; see _init for details
        posBuf, prevBuf, nextBuf, farBuf, flagsBuf,
        fixedFlags = (flagsDebug[m_this.style.get('debug')(data) ? 'debug' : 'normal'] || 0),
        strokeWidthBuf, strokeColorBuf, strokeOpacityBuf,
        dest, dest3,
        geom = m_mapper.geometryData(),
        closedFunc = m_this.style.get('closed'), closedVal, closed,
        updateFlags = true;

    closedVal = util.isFunction(m_this.style('closed')) ? undefined : (closedFunc() || false);
    lineCapVal = util.isFunction(m_this.style('lineCap')) ? undefined : flagsLineCap[lineCapFunc() || 'butt'];
    lineJoinVal = util.isFunction(m_this.style('lineJoin')) ? undefined : flagsLineJoin[lineJoinFunc() || 'miter'];
    strokeColorVal = util.isFunction(m_this.style('strokeColor')) ? undefined : strokeColorFunc();
    strokeOffsetVal = util.isFunction(m_this.style('strokeOffset')) ? undefined : (strokeOffsetFunc() || 0);
    strokeOpacityVal = util.isFunction(m_this.style('strokeOpacity')) ? undefined : strokeOpacityFunc();
    strokeWidthVal = util.isFunction(m_this.style('strokeWidth')) ? undefined : strokeWidthFunc();
    uniformVal = util.isFunction(m_this.style('uniformLine')) ? undefined : uniformFunc();

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
      posFunc = posFunc === util.identityFunction ? null : posFunc;
      lineItemList = new Array(data.length);
      closed = new Array(data.length);
      for (i = 0; i < data.length; i += 1) {
        d = data[i];
        lineItem = lineFunc(d, i);
        lineItemList[i] = lineItem;
        if (lineItem.length < 2) {
          continue;
        }
        numSegments += lineItem.length - 1;
        for (j = 0; j < lineItem.length; j += 1) {
          pos = posFunc ? posFunc(lineItem[j], j, d, i) : lineItem[j];
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
        } else {
          closed[i] = 0;
        }
      }

      position = transform.transformCoordinates(target_gcs, map_gcs, position, 3);
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

      if (geom.primitive(0).numberOfIndices() !== len) {
        geom.primitive(0).numberOfIndices = function () { return len; };
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
      uniform = uniformVal === undefined ? uniformFunc(lineItem, i) : uniformVal;
      d = data[i];
      closedVal = closed[i];
      firstPosIdx3 = posIdx3;
      maxj = lineItem.length + (closedVal === 2 ? 1 : 0);
      let skipped = 0;
      for (j = 0; j < maxj; j += 1, posIdx3 += 3) {
        lidx = j;
        if (j === lineItem.length) {
          lidx = 0;
          posIdx3 -= 3;
        }
        lineItemData = lineItem[lidx];
        /* swap entries in vert so that vert[0] is the first vertex, and
         * vert[1] will be reused for the second vertex */
        if (j) {
          v = vert[0];
          vert[0] = vert[1];
          vert[1] = v;
        }
        if (!onlyStyle) {
          v.pos = j === lidx ? posIdx3 : firstPosIdx3;
          v.prev = lidx ? posIdx3 - 3 : (closedVal ?
            firstPosIdx3 + (lineItem.length - 3 + closedVal) * 3 : posIdx3);
          v.next = j + 1 < lineItem.length ? posIdx3 + 3 : (closedVal ?
            (j !== lidx ? firstPosIdx3 + 3 : firstPosIdx3 + 6 - closedVal * 3) :
            posIdx3);
        }
        if (uniform && j > 0) {
          if (j === 1) {
            v.strokeWidth = vert[0].strokeWidth;
            v.strokeColor = vert[0].strokeColor;
            v.strokeOpacity = vert[0].strokeOpacity;
          }
        } else {
          v.strokeWidth = strokeWidthVal === undefined ? strokeWidthFunc(lineItemData, lidx, d, i) : strokeWidthVal;
          v.strokeColor = strokeColorVal === undefined ? strokeColorFunc(lineItemData, lidx, d, i) : strokeColorVal;
          v.strokeOpacity = strokeOpacityVal === undefined ? strokeOpacityFunc(lineItemData, lidx, d, i) : strokeOpacityVal;
        }
        if (updateFlags) {
          if (strokeOffsetVal !== 0) {
            if (uniform && j > 0) {
              if (j === 1) {
                v.strokeOffset = vert[0].strokeOffset;
              }
            } else {
              v.strokeOffset = (strokeOffsetVal === undefined ? strokeOffsetFunc(lineItemData, lidx, d, i) : strokeOffsetVal) || 0;
            }
            if (v.strokeOffset) {
              /* we use 11 bits to store the offset, and we want to store values
               * from -1 to 1, so multiply our values by 1023, and use some bit
               * manipulation to ensure that it is packed properly */
              v.posStrokeOffset = Math.round(2048 + 1023 * Math.min(1, Math.max(-1, v.strokeOffset))) & 0x7FF;
              v.negStrokeOffset = Math.round(2048 - 1023 * Math.min(1, Math.max(-1, v.strokeOffset))) & 0x7FF;
            } else {
              v.posStrokeOffset = v.negStrokeOffset = 0;
            }
          }
          if (!closedVal && (!j || j === lineItem.length - 1)) {
            v.flags = lineCapVal === undefined ? flagsLineCap[lineCapFunc(lineItemData, lidx, d, i)] || flagsLineCap.butt : lineCapVal;
          } else {
            v.flags = lineJoinVal === undefined ? flagsLineJoin[lineJoinFunc(lineItemData, lidx, d, i)] || flagsLineJoin.miter : lineJoinVal;
          }
        }

        if (j) {
          if (uniform === 'drop' && j > 1 && position[vert[0].pos] === position[vert[1].pos] && position[vert[0].pos + 1] === position[vert[1].pos + 1]) {
            skipped += 1;
            continue;
          }
          /* zero out the z position.  This can be changed if we handle it in
           * the shader. */
          for (k = 0; k < orderLen; k += 1, dest += 1, dest3 += 3) {
            if (uniform === 'drop' && vert[0].strokeOpacity <= 0 && vert[1].strokeOpacity <= 0) {
              strokeOpacityBuf[dest] = -1;
              continue;
            }
            orderk0 = order[k][0];
            v1 = vert[orderk0];
            v2 = vert[1 - orderk0];
            if (!onlyStyle) {
              posBuf[dest3] = position[v1.pos];
              posBuf[dest3 + 1] = position[v1.pos + 1];
              posBuf[dest3 + 2] = 0; // position[v1.pos + 2];
              prevkey = !orderk0 ? 'prev' : 'next';
              nextkey = !orderk0 ? 'next' : 'prev';
              prevBuf[dest3] = position[v1[prevkey]];
              prevBuf[dest3 + 1] = position[v1[prevkey] + 1];
              prevBuf[dest3 + 2] = 0; // position[v1[prevkey] + 2];
              nextBuf[dest3] = position[v1[nextkey]];
              nextBuf[dest3 + 1] = position[v1[nextkey] + 1];
              nextBuf[dest3 + 2] = 0; // position[v1[nextkey] + 2];
              farBuf[dest3] = position[v2[nextkey]];
              farBuf[dest3 + 1] = position[v2[nextkey] + 1];
              farBuf[dest3 + 2] = 0; // position[v2[nextkey] + 2];
            }
            if (updateFlags) {
              offkey = !orderk0 ? 'negStrokeOffset' : 'posStrokeOffset';
              flagsBuf[dest] = (order[k][3] +
                v1.flags * flagsNearLineMult +
                v2.flags * flagsFarLineMult +
                v1[offkey] * flagsNearOffsetMult);
            }
            strokeWidthBuf[dest] = v1.strokeWidth;
            strokeColorBuf[dest3] = v1.strokeColor.r;
            strokeColorBuf[dest3 + 1] = v1.strokeColor.g;
            strokeColorBuf[dest3 + 2] = v1.strokeColor.b;
            if ((v1.strokeOpacity <= 0 && v2.strokeOpacity <= 0) || (v1.strokeWidth <= 0 && v2.strokeWidth <= 0)) {
              strokeOpacityBuf[dest] = -1;
            } else {
              strokeOpacityBuf[dest] = v1.strokeOpacity;
            }
          }
        }
      }
      if (skipped) {
        for (k = 0; k < skipped * orderLen; k += 1, dest += 1, dest3 += 3) {
          strokeOpacityBuf[dest] = -1;
        }
      }
    }

    if (!onlyStyle) {
      m_mapper.modified();
      geom.boundsDirty(true);
      m_mapper.boundsDirtyTimestamp().modified();
    } else {
      if (updateFlags) {
        m_mapper.updateSourceBuffer('flags');
      }
      m_mapper.updateSourceBuffer('strokeWidth');
      m_mapper.updateSourceBuffer('strokeOpacity');
      m_mapper.updateSourceBuffer('strokeColor');
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
      [0, 'corner', -1, flagsVertex.corner], [0, 'near', 1, flagsVertex.near], [1, 'far', -1, flagsVertex.far],
      [1, 'corner', 1, flagsVertex.corner], [1, 'near', -1, flagsVertex.near], [0, 'far', 1, flagsVertex.far]];
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
    /* put a very small array here.  We only use the length, and we'll override
     * that elsewhere. */
    triangles.setIndices(new Uint16Array(1));
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
    createGLLines(!!(m_this.dataTime().timestamp() < m_this.buildTime().timestamp() && m_geometry));

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
