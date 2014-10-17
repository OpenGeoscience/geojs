//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo.gl
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of lineFeature
 *
 * @class
 * @returns {ggl.lineFeature}
 */
//////////////////////////////////////////////////////////////////////////////
ggl.lineFeature = function (arg) {
  'use strict';
  if (!(this instanceof ggl.lineFeature)) {
    return new ggl.lineFeature(arg);
  }
  arg = arg || {};
  geo.lineFeature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_actor = null,
      s_init = this._init,
      s_update = this._update;

  function createVertexShader() {
      var vertexShaderSource = [
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
        '  float angleNext = atan(deltaNext.y, deltaNext.x);',
        '  float anglePrev = atan(deltaPrev.y, deltaPrev.x);',
        '  if (deltaPrev.xy == vec2(0, 0)) anglePrev = angleNext;',
        '  if (deltaNext.xy == vec2(0, 0)) angleNext = anglePrev;',
        '  float angle = (anglePrev + angleNext) / 2.0;',
        '  float distance = (offset * strokeWidth * pixelWidth) /',
        '                    cos(anglePrev - angle);',
        '  worldPos.x += distance * sin(angle);',
        '  worldPos.y -= distance * cos(angle);',
        '  vec4  p = worldPos;',
        '  gl_Position = p;',
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
    var i, prev = [], next = [], numPts = m_this.data().length,
        itemIndex = 0, lineItemIndex = 0, lineItem = null, p = null,
        start, position = [], strokeWidth = [], strokeColor = [],
        strokeOpacity = [], posFunc, strokeWidthFunc, strokeColorFunc,
        strokeOpacityFunc, buffers = vgl.DataBuffers(1024),
        sourcePositions = vgl.sourceDataP3fv(),
        prevSourcePositions = vgl.sourceDataAnyfv(3,
          vgl.vertexAttributeKeysIndexed.Four),
        nextSourcePositions = vgl.sourceDataAnyfv(3,
          vgl.vertexAttributeKeysIndexed.Five),
        offsetSourcePositions = vgl.sourceDataAnyfv(1,
          vgl.vertexAttributeKeysIndexed.Six),
        sourceStokeWidth = vgl.sourceDataAnyfv(1,
          vgl.vertexAttributeKeysIndexed.One),
        sourceStrokeColor = vgl.sourceDataAnyfv(3,
          vgl.vertexAttributeKeysIndexed.Two),
        sourceStrokeOpacity = vgl.sourceDataAnyfv(1,
          vgl.vertexAttributeKeysIndexed.Three),
        trianglePrimitive = vgl.triangles(),
        mat = vgl.material(),
        blend = vgl.blend(),
        prog = vgl.shaderProgram(),
        vertexShader = createVertexShader(),
        fragmentShader = createFragmentShader(),
        posAttr = vgl.vertexAttribute('pos'),
        prevAttr = vgl.vertexAttribute('prev'),
        nextAttr = vgl.vertexAttribute('next'),
        offsetAttr = vgl.vertexAttribute('offset'),
        stokeWidthAttr = vgl.vertexAttribute('strokeWidth'),
        strokeColorAttr = vgl.vertexAttribute('strokeColor'),
        strokeOpacityAttr = vgl.vertexAttribute('strokeOpacity'),
        modelViewUniform = new vgl.modelViewUniform('modelViewMatrix'),
        projectionUniform = new vgl.projectionUniform('projectionMatrix'),
        pixelWidthUniform = new vgl.floatUniform('pixelWidth',
                              2.0 / m_this.renderer().width()),
        geom = vgl.geometryData(),
        mapper = vgl.mapper();

    posFunc = m_this.position();
    strokeWidthFunc = m_this.style().strokeWidth;
    strokeColorFunc = m_this.style().strokeColor;
    strokeOpacityFunc = m_this.style().strokeOpacity;

    m_this.data().forEach(function (item) {
      lineItem = m_this.line()(item, itemIndex);
      lineItem.forEach(function (lineItemData) {
        p = posFunc(item, itemIndex, lineItemData, lineItemIndex);
        if (p instanceof geo.latlng) {
          position.push([p.x(), p.y(), 0.0]);
        } else {
          position.push([p.x, p.y, p.z || 0.0]);
        }
        strokeWidth.push(strokeWidthFunc(item,
          itemIndex, lineItemData, lineItemIndex));
        var sc = strokeColorFunc(item,
          itemIndex, lineItemData, lineItemIndex);
        strokeColor.push([sc.r, sc.g, sc.b]);
        strokeOpacity.push(strokeOpacityFunc(item,
          itemIndex, lineItemData, lineItemIndex));

        // Assuming that we will have atleast two points
        if (lineItemIndex === 0) {
          var posxx = position[position.length - 1];
          prev.push(posxx);
          position.push(posxx);
          prev.push(posxx);
          next.push(posxx);
          strokeWidth.push(strokeWidthFunc(item,
            itemIndex, lineItemData, lineItemIndex));
          strokeOpacity.push(strokeOpacityFunc(item,
            itemIndex, lineItemData, lineItemIndex));
          strokeColor.push([sc.r, sc.g, sc.b]);
        }
        else {
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

    // TODO: Right now this is ugly but we will fix it.
    prog.addVertexAttribute(posAttr,
      vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(stokeWidthAttr,
      vgl.vertexAttributeKeysIndexed.One);
    prog.addVertexAttribute(strokeColorAttr,
      vgl.vertexAttributeKeysIndexed.Two);
    prog.addVertexAttribute(strokeOpacityAttr,
      vgl.vertexAttributeKeysIndexed.Three);
    prog.addVertexAttribute(prevAttr,
      vgl.vertexAttributeKeysIndexed.Four);
    prog.addVertexAttribute(nextAttr,
      vgl.vertexAttributeKeysIndexed.Five);
    prog.addVertexAttribute(offsetAttr,
      vgl.vertexAttributeKeysIndexed.Six);

    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);
    prog.addUniform(pixelWidthUniform);

    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);

    mat.addAttribute(prog);
    mat.addAttribute(blend);

    m_actor = vgl.actor();
    m_actor.setMaterial(mat);

    start = buffers.alloc(numPts * 6);
    var currentIndex = start;

    for (i = 0; i < numPts; i += 1) {
      //buffers.write('indices', [i], start + i, 1);
      buffers.repeat('strokeWidth', [strokeWidth[i]], start + i * 6, 6);
      buffers.repeat('strokeColor', strokeColor[i], start + i * 6, 6);
      buffers.repeat('strokeOpacity', [strokeOpacity[i]], start + i * 6, 6);
    }

    var addVert = function (p, c, n, offset) {
      buffers.write('prev', p, currentIndex, 1);
      buffers.write('pos', c, currentIndex, 1);
      buffers.write('next', n, currentIndex, 1);
      buffers.write('offset', [offset], currentIndex, 1);
      buffers.write('indices', [currentIndex], currentIndex, 1);
      currentIndex += 1;
    };

    for (i = 1; i < position.length; i += 1) {
      //buffers.write ('unit', unit_buffer, currentIndex, 6);
      addVert(prev[i - 1], position[i - 1], next[i - 1], 1);
      addVert(prev[i], position[i], next[i], -1);
      addVert(prev[i - 1], position[i - 1], next[i - 1], -1);

      addVert(prev[i - 1], position[i - 1], next[i - 1], 1);
      addVert(prev[i], position[i], next[i], 1);
      addVert(prev[i], position[i], next[i], -1);
    }

    sourcePositions.pushBack(buffers.get('pos'));
    geom.addSource(sourcePositions);

    prevSourcePositions.pushBack(buffers.get('prev'));
    geom.addSource(prevSourcePositions);

    nextSourcePositions.pushBack(buffers.get('next'));
    geom.addSource(nextSourcePositions);

    sourceStokeWidth.pushBack(buffers.get('strokeWidth'));
    geom.addSource(sourceStokeWidth);

    sourceStrokeColor.pushBack(buffers.get('strokeColor'));
    geom.addSource(sourceStrokeColor);

    sourceStrokeOpacity.pushBack(buffers.get('strokeOpacity'));
    geom.addSource(sourceStrokeOpacity);

    offsetSourcePositions.pushBack(buffers.get('offset'));
    geom.addSource(offsetSourcePositions);

    trianglePrimitive.setIndices(buffers.get('indices'));
    geom.addPrimitive(trianglePrimitive);

    mapper.setGeometryData(geom);
    m_actor.setMapper(mapper);
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);
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
  };

  this._init(arg);
  return this;
};

inherit(ggl.lineFeature, geo.lineFeature);

// Now register it
geo.registerFeature('vgl', 'line', ggl.lineFeature);
