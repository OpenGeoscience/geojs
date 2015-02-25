//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of lineFeature
 *
 * @class
 * @extends geo.lineFeature
 * @returns {geo.gl.lineFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.gl.lineFeature = function (arg) {
  'use strict';
  if (!(this instanceof geo.gl.lineFeature)) {
    return new geo.gl.lineFeature(arg);
  }
  arg = arg || {};
  geo.lineFeature.call(this, arg);

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

        'varying vec3 strokeColorVar;',
        'varying float strokeWidthVar;',
        'varying float strokeOpacityVar;',

        'void main(void)',
        '{',
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
        '  strokeColorVar = strokeColor;',
        '  strokeWidthVar = strokeWidth;',
        '  strokeOpacityVar = strokeOpacity;',
        '  vec2 deltaNext = worldNext.xy - worldPos.xy;',
        '  vec2 deltaPrev = worldPos.xy - worldPrev.xy;',
        '  float angleNext = PI * 0.5;',
        '  if (deltaNext.y < 0.0) { angleNext = -angleNext; } ',
        '  if (deltaNext.x != 0.0) {',
        '    angleNext = atan(deltaNext.y, deltaNext.x);',
        '  }',
        '  float anglePrev = PI * 0.5;',
        '  if (deltaPrev.y < 0.0) { anglePrev = -anglePrev; } ',
        '  if (deltaPrev.x != 0.0) {',
        '    anglePrev = atan(deltaPrev.y, deltaPrev.x);',
        '  }',
        '  if (deltaPrev.xy == vec2(0.0, 0.0)) anglePrev = angleNext;',
        '  if (deltaNext.xy == vec2(0.0, 0.0)) angleNext = anglePrev;',
        '  float angle = (anglePrev + angleNext) / 2.0;',
        '  float cosAngle = cos(anglePrev - angle);',
        '  if (cosAngle < 0.1) { cosAngle = sign(cosAngle) * 1.0; angle = 0.0; }',
        '  float distance = (offset * strokeWidth * pixelWidth) /',
        '                    cosAngle;',
        '  worldPos.x += distance * sin(angle);',
        '  worldPos.y -= distance * cos(angle);',
        '  gl_Position = worldPos;',
        '}'
      ].join('\n'),
      shader = new vgl.shader(gl.VERTEX_SHADER);
      shader.setShaderSource(vertexShaderSource);
      return shader;
    }

  function createFragmentShader() {
    var fragmentShaderSource = [
      '#ifdef GL_ES',
      '  precision highp float;',
      '#endif',
      'varying vec3 strokeColorVar;',
      'varying float strokeWidthVar;',
      'varying float strokeOpacityVar;',
      'void main () {',
      '  gl_FragColor = vec4 (strokeColorVar, strokeOpacityVar);',
      '}'
    ].join('\n'),
    shader = new vgl.shader(gl.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShaderSource);
    return shader;
  }

  function createGLLines() {
    var i = null,
        j = null,
        k = null,
        v,
        prev = [],
        next = [],
        numPts = m_this.data().length,
        itemIndex = 0,
        lineItemIndex = 0,
        lineItem = null,
        currIndex = null,
        lineSegments = [],
        pos = null,
        posTmp = null,
        strkColor = null,
        start = null,
        position = [],
        strkWidthArr = [],
        strkColorArr = [],
        strkOpacityArr = [],
        geom = vgl.geometryData(),
        posFunc = m_this.position(),
        strkWidthFunc = m_this.style.get('strokeWidth'),
        strkColorFunc = m_this.style.get('strokeColor'),
        strkOpacityFunc = m_this.style.get('strokeOpacity'),
        buffers = vgl.DataBuffers(1024),
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

    m_this.data().forEach(function (item) {
      lineItem = m_this.line()(item, itemIndex);
      lineSegments.push(lineItem.length);
      lineItem.forEach(function (lineItemData) {
        pos = posFunc(lineItemData, lineItemIndex, item, itemIndex);
        if (pos instanceof geo.latlng) {
          position.push([pos.x(), pos.y(), 0.0]);
        } else {
          position.push([pos.x, pos.y, pos.z || 0.0]);
        }
        strkWidthArr.push(strkWidthFunc(lineItemData, lineItemIndex,
                                        item, itemIndex));
        strkColor = strkColorFunc(lineItemData, lineItemIndex,
                                  item, itemIndex);
        strkColorArr.push([strkColor.r, strkColor.g, strkColor.b]);
        strkOpacityArr.push(strkOpacityFunc(lineItemData, lineItemIndex,
                                            item, itemIndex));

        // Assuming that we will have atleast two points
        if (lineItemIndex === 0) {
          posTmp = position[position.length - 1];
          prev.push(posTmp);
        } else {
          prev.push(position[position.length - 2]);
          next.push(position[position.length - 1]);
        }

        lineItemIndex += 1;
      });
      next.push(position[position.length - 1]);
      lineItemIndex = 0;
      itemIndex += 1;
    });

    position = geo.transform.transformCoordinates(
                 m_this.gcs(), m_this.layer().map().gcs(),
                 position, 3);
    prev = geo.transform.transformCoordinates(
                 m_this.gcs(), m_this.layer().map().gcs(),
                 prev, 3);
    next = geo.transform.transformCoordinates(
                 m_this.gcs(), m_this.layer().map().gcs(),
                 next, 3);

    buffers.create('pos', 3);
    buffers.create('next', 3);
    buffers.create('prev', 3);
    buffers.create('offset', 1);
    buffers.create('indices', 1);
    buffers.create('strokeWidth', 1);
    buffers.create('strokeColor', 3);
    buffers.create('strokeOpacity', 1);

    numPts = position.length;

    start = buffers.alloc(numPts * 6);
    currIndex = start;

    var addVert = function (prevPos, currPos, nextPos, offset,
                            width, color, opacity) {
      buffers.write('prev', prevPos, currIndex, 1);
      buffers.write('pos', currPos, currIndex, 1);
      buffers.write('next', nextPos, currIndex, 1);
      buffers.write('offset', [offset], currIndex, 1);
      buffers.write('indices', [currIndex], currIndex, 1);
      buffers.write('strokeWidth', [width], currIndex, 1);
      buffers.write('strokeColor', color, currIndex, 1);
      buffers.write('strokeOpacity', [opacity], currIndex, 1);
      currIndex += 1;
    };

    i = 0;
    k = 0;
    var order = m_this.featureVertices();
    for (j = 0; j < lineSegments.length; j += 1) {
      i += 1;
      for (k = 0; k < lineSegments[j] - 1; k += 1) {
        for (v = 0; v < order.length; v += 1) {
          addVert(prev[i + order[v][0]], position[i + order[v][0]],
                  next[i + order[v][0]], order[v][1],
                  strkWidthArr[i + order[v][0]],
                  strkColorArr[i + order[v][0]],
                  strkOpacityArr[i + order[v][0]]);
        }
        i += 1;
      }
    }

    posData.pushBack(buffers.get('pos'));
    geom.addSource(posData);

    prvPosData.pushBack(buffers.get('prev'));
    geom.addSource(prvPosData);

    nxtPosData.pushBack(buffers.get('next'));
    geom.addSource(nxtPosData);

    strkWidthData.pushBack(buffers.get('strokeWidth'));
    geom.addSource(strkWidthData);

    strkColorData.pushBack(buffers.get('strokeColor'));
    geom.addSource(strkColorData);

    strkOpacityData.pushBack(buffers.get('strokeOpacity'));
    geom.addSource(strkOpacityData);

    offPosData.pushBack(buffers.get('offset'));
    geom.addSource(offPosData);

    triangles.setIndices(buffers.get('indices'));
    geom.addPrimitive(triangles);

    m_mapper.setGeometryData(geom);
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the arrangement of vertices used for each line segment.
   *
   * @returns {Number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.featureVertices = function () {
    return [[-1, 1], [0, -1], [-1, -1], [-1, 1], [0, 1], [0, -1]];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the number of vertices used for each line segment.
   *
   * @returns {Number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.verticesPerFeature = function () {
    return this.featureVertices().length;
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
        prjUnif = new vgl.projectionUniform('projectionMatrix');

    m_pixelWidthUnif =  new vgl.floatUniform('pixelWidth',
                          1.0 / m_this.renderer().width());
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

    prog.addShader(fs);
    prog.addShader(vs);

    m_material.addAttribute(prog);
    m_material.addAttribute(vgl.blend());

    m_actor = vgl.actor();
    m_actor.setMaterial(m_material);
    m_actor.setMapper(m_mapper);
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
    s_exit();
  };

  this._init(arg);
  return this;
};

inherit(geo.gl.lineFeature, geo.lineFeature);

// Now register it
geo.registerFeature('vgl', 'line', geo.gl.lineFeature);
