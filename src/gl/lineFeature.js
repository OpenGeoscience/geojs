var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var lineFeature = require('../lineFeature');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of lineFeature
 *
 * @class geo.gl.lineFeature
 * @extends geo.lineFeature
 * @returns {geo.gl.lineFeature}
 */
//////////////////////////////////////////////////////////////////////////////
var gl_lineFeature = function (arg) {
  'use strict';
  if (!(this instanceof gl_lineFeature)) {
    return new gl_lineFeature(arg);
  }
  arg = arg || {};
  lineFeature.call(this, arg);

  var vgl = require('vgl');
  var transform = require('../transform');
  var util = require('../util');
  var object = require('./object');

  object.call(this);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      s_exit = this._exit,
      m_actor = null,
      m_mapper = null,
      m_material = null,
      m_pixelWidthUnif = null,
      m_aspectUniform = null,
      m_dynamicDraw = arg.dynamicDraw === undefined ? false : arg.dynamicDraw,
      s_init = this._init,
      s_update = this._update;

  function createVertexShader() {
    var vertexShaderSource = [
          '#ifdef GL_ES',
          '  precision highp float;',
          '#endif',
          'attribute vec3 pos;',
          'attribute vec3 prev;',
          'attribute vec3 next;',
          'attribute float offset;',

          'attribute vec3 strokeColor;',
          'attribute float strokeOpacity;',
          'attribute float strokeWidth;',

          'uniform mat4 modelViewMatrix;',
          'uniform mat4 projectionMatrix;',
          'uniform float pixelWidth;',
          'uniform float aspect;',

          'varying vec4 strokeColorVar;',

          'void main(void)',
          '{',
          /* If any vertex has been deliberately set to a negative opacity,
           * skip doing computations on it. */
          '  if (strokeOpacity < 0.0) {',
          '    gl_Position = vec4(2, 2, 0, 1);',
          '    return;',
          '  }',
          '  const float PI = 3.14159265358979323846264;',
          '  vec4 worldPos = projectionMatrix * modelViewMatrix * vec4(pos.xyz, 1);',
          '  if (worldPos.w != 0.0) {',
          '    worldPos = worldPos/worldPos.w;',
          '  }',
          '  vec4 worldNext = projectionMatrix * modelViewMatrix * vec4(next.xyz, 1);',
          '  if (worldNext.w != 0.0) {',
          '    worldNext = worldNext/worldNext.w;',
          '  }',
          '  vec4 worldPrev = projectionMatrix* modelViewMatrix * vec4(prev.xyz, 1);',
          '  if (worldPrev.w != 0.0) {',
          '    worldPrev = worldPrev/worldPrev.w;',
          '  }',
          '  strokeColorVar = vec4(strokeColor, strokeOpacity);',
          '  vec2 deltaNext = worldNext.xy - worldPos.xy;',
          '  vec2 deltaPrev = worldPos.xy - worldPrev.xy;',
          '  float angleNext = 0.0, anglePrev = 0.0;',
          '  if (deltaNext.xy != vec2(0.0, 0.0))',
          '    angleNext = atan(deltaNext.y / aspect, deltaNext.x);',
          '  if (deltaPrev.xy == vec2(0.0, 0.0)) anglePrev = angleNext;',
          '  else  anglePrev = atan(deltaPrev.y / aspect, deltaPrev.x);',
          '  if (deltaNext.xy == vec2(0.0, 0.0)) angleNext = anglePrev;',
          '  float angle = (anglePrev + angleNext) / 2.0;',
          '  if (abs(anglePrev - angleNext) >= PI)',
          '    angle += PI;',
          '  float cosAngle = cos(anglePrev - angle);',
          '  if (cosAngle < 0.1) { cosAngle = sign(cosAngle) * 1.0; angle = 0.0; }',
          '  float distance = (offset * strokeWidth * pixelWidth) /',
          '                    cosAngle;',
          '  worldPos.x += distance * sin(angle);',
          '  worldPos.y -= distance * cos(angle) * aspect;',
          '  gl_Position = worldPos;',
          '}'
        ].join('\n'),
        shader = new vgl.shader(vgl.GL.VERTEX_SHADER);
    shader.setShaderSource(vertexShaderSource);
    return shader;
  }

  function createFragmentShader() {
    var fragmentShaderSource = [
          '#ifdef GL_ES',
          '  precision highp float;',
          '#endif',
          'varying vec4 strokeColorVar;',
          'void main () {',
          '  gl_FragColor = strokeColorVar;',
          '}'
        ].join('\n'),
        shader = new vgl.shader(vgl.GL.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShaderSource);
    return shader;
  }

  function createGLLines() {
    var data = m_this.data(),
        i, j, k, v, lidx,
        numSegments = 0, len,
        lineItem, lineItemData,
        vert = [{}, {}], vertTemp,
        pos, posIdx3, firstpos, firstPosIdx3,
        position = [],
        posFunc = m_this.position(),
        strkWidthFunc = m_this.style.get('strokeWidth'),
        strkColorFunc = m_this.style.get('strokeColor'),
        strkOpacityFunc = m_this.style.get('strokeOpacity'),
        order = m_this.featureVertices(),
        posBuf, nextBuf, prevBuf, offsetBuf, indicesBuf,
        strokeWidthBuf, strokeColorBuf, strokeOpacityBuf,
        dest, dest3,
        geom = m_mapper.geometryData(),
        closedFunc = m_this.style.get('closed'), closed = [];

    for (i = 0; i < data.length; i += 1) {
      lineItem = m_this.line()(data[i], i);
      numSegments += lineItem.length - 1;
      for (j = 0; j < lineItem.length; j += 1) {
        pos = posFunc(lineItem[j], j, lineItem, i);
        position.push(pos.x);
        position.push(pos.y);
        position.push(pos.z || 0.0);
        if (!j) {
          firstpos = pos;
        }
      }
      if (lineItem.length > 2 && closedFunc(data[i], i)) {
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
                 m_this.gcs(), m_this.layer().map().gcs(),
                 position, 3);

    len = numSegments * order.length;
    posBuf = util.getGeomBuffer(geom, 'pos', len * 3);
    nextBuf = util.getGeomBuffer(geom, 'next', len * 3);
    prevBuf = util.getGeomBuffer(geom, 'prev', len * 3);
    offsetBuf = util.getGeomBuffer(geom, 'offset', len);
    strokeWidthBuf = util.getGeomBuffer(geom, 'strokeWidth', len);
    strokeColorBuf = util.getGeomBuffer(geom, 'strokeColor', len * 3);
    strokeOpacityBuf = util.getGeomBuffer(geom, 'strokeOpacity', len);
    indicesBuf = geom.primitive(0).indices();
    if (!(indicesBuf instanceof Uint16Array) || indicesBuf.length !== len) {
      indicesBuf = new Uint16Array(len);
      geom.primitive(0).setIndices(indicesBuf);
    }

    for (i = posIdx3 = dest = dest3 = 0; i < data.length; i += 1) {
      lineItem = m_this.line()(data[i], i);
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
          vertTemp = vert[0];
          vert[0] = vert[1];
          vert[1] = vertTemp;
        }
        vert[1].pos = j === lidx ? posIdx3 : firstPosIdx3;
        vert[1].prev = lidx ? posIdx3 - 3 : (closed[i] ?
            firstPosIdx3 + (lineItem.length - 3 + closed[i]) * 3 : posIdx3);
        vert[1].next = j + 1 < lineItem.length ? posIdx3 + 3 : (closed[i] ?
            (j !== lidx ? firstPosIdx3 + 3 : firstPosIdx3 + 6 - closed[i] * 3) :
            posIdx3);
        vert[1].strokeWidth = strkWidthFunc(lineItemData, lidx, lineItem, i);
        vert[1].strokeColor = strkColorFunc(lineItemData, lidx, lineItem, i);
        vert[1].strokeOpacity = strkOpacityFunc(lineItemData, lidx, lineItem, i);
        if (j) {
          for (k = 0; k < order.length; k += 1, dest += 1, dest3 += 3) {
            v = vert[order[k][0]];
            posBuf[dest3] = position[v.pos];
            posBuf[dest3 + 1] = position[v.pos + 1];
            posBuf[dest3 + 2] = position[v.pos + 2];
            prevBuf[dest3] = position[v.prev];
            prevBuf[dest3 + 1] = position[v.prev + 1];
            prevBuf[dest3 + 2] = position[v.prev + 2];
            nextBuf[dest3] = position[v.next];
            nextBuf[dest3 + 1] = position[v.next + 1];
            nextBuf[dest3 + 2] = position[v.next + 2];
            offsetBuf[dest] = order[k][1];
            /* We can ignore the indices (they will all be zero) */
            strokeWidthBuf[dest] = v.strokeWidth;
            strokeColorBuf[dest3] = v.strokeColor.r;
            strokeColorBuf[dest3 + 1] = v.strokeColor.g;
            strokeColorBuf[dest3 + 2] = v.strokeColor.b;
            strokeOpacityBuf[dest] = v.strokeOpacity;
          }
        }
      }
    }

    geom.boundsDirty(true);
    m_mapper.modified();
    m_mapper.boundsDirtyTimestamp().modified();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the arrangement of vertices used for each line segment.
   *
   * @returns {Number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.featureVertices = function () {
    return [[0, 1], [1, -1], [0, -1], [0, 1], [1, 1], [1, -1]];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the number of vertices used for each line segment.
   *
   * @returns {Number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.verticesPerFeature = function () {
    return m_this.featureVertices().length;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    var prog = vgl.shaderProgram(),
        vs = createVertexShader(),
        fs = createFragmentShader(),
        // Vertex attributes
        posAttr = vgl.vertexAttribute('pos'),
        prvAttr = vgl.vertexAttribute('prev'),
        nxtAttr = vgl.vertexAttribute('next'),
        offAttr = vgl.vertexAttribute('offset'),
        strkWidthAttr = vgl.vertexAttribute('strokeWidth'),
        strkColorAttr = vgl.vertexAttribute('strokeColor'),
        strkOpacityAttr = vgl.vertexAttribute('strokeOpacity'),
        // Shader uniforms
        mviUnif = new vgl.modelViewUniform('modelViewMatrix'),
        prjUnif = new vgl.projectionUniform('projectionMatrix'),
        geom = vgl.geometryData(),
        // Sources
        posData = vgl.sourceDataP3fv({'name': 'pos'}),
        prvPosData = vgl.sourceDataAnyfv(
            3, vgl.vertexAttributeKeysIndexed.Four, {'name': 'prev'}),
        nxtPosData = vgl.sourceDataAnyfv(
            3, vgl.vertexAttributeKeysIndexed.Five, {'name': 'next'}),
        offPosData = vgl.sourceDataAnyfv(
            1, vgl.vertexAttributeKeysIndexed.Six, {'name': 'offset'}),
        strkWidthData = vgl.sourceDataAnyfv(
            1, vgl.vertexAttributeKeysIndexed.One, {'name': 'strokeWidth'}),
        strkColorData = vgl.sourceDataAnyfv(
            3, vgl.vertexAttributeKeysIndexed.Two, {'name': 'strokeColor'}),
        strkOpacityData = vgl.sourceDataAnyfv(
            1, vgl.vertexAttributeKeysIndexed.Three,
            {'name': 'strokeOpacity'}),
        // Primitive indices
        triangles = vgl.triangles();

    m_pixelWidthUnif = new vgl.floatUniform('pixelWidth',
                          1.0 / m_this.renderer().width());
    m_aspectUniform = new vgl.floatUniform('aspect',
        m_this.renderer().width() / m_this.renderer().height());

    s_init.call(m_this, arg);
    m_material = vgl.material();
    m_mapper = vgl.mapper({dynamicDraw: m_dynamicDraw});

    prog.addVertexAttribute(posAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(strkWidthAttr, vgl.vertexAttributeKeysIndexed.One);
    prog.addVertexAttribute(strkColorAttr, vgl.vertexAttributeKeysIndexed.Two);
    prog.addVertexAttribute(strkOpacityAttr, vgl.vertexAttributeKeysIndexed.Three);
    prog.addVertexAttribute(prvAttr, vgl.vertexAttributeKeysIndexed.Four);
    prog.addVertexAttribute(nxtAttr, vgl.vertexAttributeKeysIndexed.Five);
    prog.addVertexAttribute(offAttr, vgl.vertexAttributeKeysIndexed.Six);

    prog.addUniform(mviUnif);
    prog.addUniform(prjUnif);
    prog.addUniform(m_pixelWidthUnif);
    prog.addUniform(m_aspectUniform);

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
    geom.addSource(strkWidthData);
    geom.addSource(strkColorData);
    geom.addSource(strkOpacityData);
    geom.addSource(offPosData);
    geom.addPrimitive(triangles);
    m_mapper.setGeometryData(geom);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return list of actors
   *
   * @returns {vgl.actor[]}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.actors = function () {
    if (!m_actor) {
      return [];
    }
    return [m_actor];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function () {
    if (m_actor) {
      m_this.renderer().contextRenderer().removeActor(m_actor);
    }

    createGLLines();

    m_this.renderer().contextRenderer().addActor(m_actor);
    m_this.buildTime().modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function () {
    s_update.call(m_this);

    if (m_this.dataTime().getMTime() >= m_this.buildTime().getMTime() ||
        m_this.updateTime().getMTime() <= m_this.getMTime()) {
      m_this._build();
    }

    m_pixelWidthUnif.set(1.0 / m_this.renderer().width());
    m_aspectUniform.set(m_this.renderer().width() /
                        m_this.renderer().height());
    m_actor.setVisible(m_this.visible());
    m_actor.material().setBinNumber(m_this.bin());
    m_this.updateTime().modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Destroy
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    m_this.renderer().contextRenderer().removeActor(m_actor);
    m_actor = null;
    s_exit();
  };

  this._init(arg);
  return this;
};

inherit(gl_lineFeature, lineFeature);

// Now register it
var capabilities = {};
capabilities[lineFeature.capabilities.basic] = true;
capabilities[lineFeature.capabilities.multicolor] = true;

// Now register it
registerFeature('vgl', 'line', gl_lineFeature, capabilities);

module.exports = gl_lineFeature;
