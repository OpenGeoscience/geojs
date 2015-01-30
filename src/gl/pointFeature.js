//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointFeature
 *
 * @class
 * @returns {geo.gl.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.gl.pointFeature = function (arg) {
  "use strict";
  if (!(this instanceof geo.gl.pointFeature)) {
    return new geo.gl.pointFeature(arg);
  }
  arg = arg || {};
  geo.pointFeature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_actor = null,
      m_pixelWidthUniform = null,
      m_aspectUniform = null,
      s_init = this._init,
      s_update = this._update,
      s_setter = this._propertySetter,
      m_cache = {positions: []};

  var vertexShaderSource = [
      "attribute vec3 pos;",
      "attribute vec2 unit;",
      "attribute float rad;",
      "attribute vec3 fillColor;",
      "attribute vec3 strokeColor;",
      "attribute float fillOpacity;",
      "attribute float strokeWidth;",
      "attribute float strokeOpacity;",
      "attribute float fill;",
      "attribute float stroke;",
      "uniform float pixelWidth;",
      "uniform float aspect;",
      "uniform mat4 modelViewMatrix;",
      "uniform mat4 projectionMatrix;",
      "varying vec3 unitVar;",
      "varying vec4 fillColorVar;",
      "varying vec4 strokeColorVar;",
      "varying float radiusVar;",
      "varying float strokeWidthVar;",
      "varying float fillVar;",
      "varying float strokeVar;",
      "void main(void)",
      "{",
      "  unitVar = vec3 (unit, 1.0);",
      "  fillColorVar = vec4 (fillColor, fillOpacity);",
      "  strokeColorVar = vec4 (strokeColor, strokeOpacity);",
      "  strokeWidthVar = strokeWidth;",
      "  fillVar = fill;",
      "  strokeVar = stroke;",
      "  radiusVar = rad;",
      "  vec4 p = (projectionMatrix * modelViewMatrix * vec4(pos, 1.0)).xyzw;",
      "  if (p.w != 0.0) {",
      "    p = p/p.w;",
      "  }",
      "  p += (rad + strokeWidth) * ",
      "vec4 (unit.x * pixelWidth, unit.y * pixelWidth * aspect, 0.0, 1.0);",
      "  gl_Position = vec4(p.xyz, 1.0);",
      "}"
    ].join("\n");

  function createVertexShader() {
    var shader = new vgl.shader(gl.VERTEX_SHADER);

    shader.setShaderSource(vertexShaderSource);
    return shader;
  }

  var fragmentShaderSource = [
      "#ifdef GL_ES",
      "  precision highp float;",
      "#endif",
      "uniform float aspect;",
      "varying vec3 unitVar;",
      "varying vec4 fillColorVar;",
      "varying vec4 strokeColorVar;",
      "varying float radiusVar;",
      "varying float strokeWidthVar;",
      "varying float fillVar;",
      "varying float strokeVar;",
      "bool to_bool (in float value) {",
      "  if (value < 1.0)",
      "    return false;",
      "  else",
      "    return true;",
      "}",
      "void main () {",
      "  bool fill = to_bool (fillVar);",
      "  bool stroke = to_bool (strokeVar);",
      "  vec4 strokeColor, fillColor;",
      "  // No stroke or fill implies nothing to draw",
      "  if (!fill && !stroke)",
      "    discard;",
      "  // Get normalized texture coordinates and polar r coordinate",
      "  vec2 tex = (unitVar.xy + 1.0) / 2.0;",
      "  float rad = length (unitVar.xy);",
      "  // If there is no stroke, the fill region should transition to nothing",
      "  if (!stroke)",
      "    strokeColor = vec4 (fillColorVar.rgb, 0.0);",
      "  else",
      "    strokeColor = strokeColorVar;",
      "  // Likewise, if there is no fill, the stroke should transition to nothing",
      "  if (!fill)",
      "    fillColor = vec4 (strokeColor.rgb, 0.0);",
      "  else",
      "    fillColor = fillColorVar;",
      "  float radiusWidth = radiusVar;",
      "  // Distance to antialias over",
      "  float antialiasDist = 3.0 / (2.0 * radiusVar);",
      "  if (rad < (radiusWidth / (radiusWidth + strokeWidthVar))) {",
      "    float endStep = radiusWidth / (radiusWidth + strokeWidthVar);",
      "    float step = smoothstep (endStep - antialiasDist, endStep, rad);",
      "    gl_FragColor = mix (fillColor, strokeColor, step);",
      "  }",
      "  else {",
      "    float step = smoothstep (1.0 - antialiasDist, 1.0, rad);",
      "    gl_FragColor = mix (strokeColor, vec4 (strokeColor.rgb, 0.0), step);",
      "  }",
      "}"
    ].join("\n");

  function createFragmentShader() {
    var shader = new vgl.shader(gl.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShaderSource);
    return shader;
  }

  var rect = function (x, y, w, h) {
    var verts = [
        x - w, y + h,
        x - w, y - h,
        x + w, y + h,
        x - w, y - h,
        x + w, y - h,
        x + w, y + h
      ];
    return verts;
  };

  function createGLPoints() {
    var i, numPts = m_this.data().length,
        start, unit = rect(0, 0, 1, 1),
        s_cache = m_this._cache(true),
        buffers = vgl.DataBuffers(1024),
        sourcePositions = vgl.sourceDataP3fv(),
        sourceUnits = vgl.sourceDataAnyfv(2, vgl.vertexAttributeKeysIndexed.One),
        sourceRadius = vgl.sourceDataAnyfv(1, vgl.vertexAttributeKeysIndexed.Two),
        sourceStokeWidth = vgl.sourceDataAnyfv(1, vgl.vertexAttributeKeysIndexed.Three),
        sourceFillColor = vgl.sourceDataAnyfv(3, vgl.vertexAttributeKeysIndexed.Four),
        sourceFill = vgl.sourceDataAnyfv(1, vgl.vertexAttributeKeysIndexed.Five),
        sourceStrokeColor = vgl.sourceDataAnyfv(3, vgl.vertexAttributeKeysIndexed.Six),
        sourceStroke = vgl.sourceDataAnyfv(1, vgl.vertexAttributeKeysIndexed.Seven),
        sourceAlpha = vgl.sourceDataAnyfv(1, vgl.vertexAttributeKeysIndexed.Eight),
        sourceStrokeOpacity = vgl.sourceDataAnyfv(1, vgl.vertexAttributeKeysIndexed.Nine),
        trianglesPrimitive = vgl.triangles(),
        mat = vgl.material(),
        blend = vgl.blend(),
        prog = vgl.shaderProgram(),
        vertexShader = createVertexShader(),
        fragmentShader = createFragmentShader(),
        posAttr = vgl.vertexAttribute("pos"),
        unitAttr = vgl.vertexAttribute("unit"),
        radAttr = vgl.vertexAttribute("rad"),
        stokeWidthAttr = vgl.vertexAttribute("strokeWidth"),
        fillColorAttr = vgl.vertexAttribute("fillColor"),
        fillAttr = vgl.vertexAttribute("fill"),
        strokeColorAttr = vgl.vertexAttribute("strokeColor"),
        strokeAttr = vgl.vertexAttribute("stroke"),
        fillOpacityAttr = vgl.vertexAttribute("fillOpacity"),
        strokeOpacityAttr = vgl.vertexAttribute("strokeOpacity"),
        modelViewUniform = new vgl.modelViewUniform("modelViewMatrix"),
        projectionUniform = new vgl.projectionUniform("projectionMatrix"),
        geom = vgl.geometryData(),
        mapper = vgl.mapper();

    m_pixelWidthUniform = new vgl.floatUniform("pixelWidth",
                            2.0 / m_this.renderer().width());
    m_aspectUniform = new vgl.floatUniform("aspect",
                        m_this.renderer().width() / m_this.renderer().height());

    position = geo.transform.transformCoordinates(
                  m_this.gcs(), m_this.layer().map().gcs(),
                  position, 3);

    buffers.create("pos", 3);
    buffers.create("indices", 1);
    buffers.create("unit", 2);
    buffers.create("rad", 1);
    buffers.create("strokeWidth", 1);
    buffers.create("fillColor", 3);
    buffers.create("fill", 1);
    buffers.create("strokeColor", 3);
    buffers.create("stroke", 1);
    buffers.create("fillOpacity", 1);
    buffers.create("strokeOpacity", 1);

    // TODO: Right now this is ugly but we will fix it.
    prog.addVertexAttribute(posAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(unitAttr, vgl.vertexAttributeKeysIndexed.One);
    prog.addVertexAttribute(radAttr, vgl.vertexAttributeKeysIndexed.Two);
    prog.addVertexAttribute(stokeWidthAttr, vgl.vertexAttributeKeysIndexed.Three);
    prog.addVertexAttribute(fillColorAttr, vgl.vertexAttributeKeysIndexed.Four);
    prog.addVertexAttribute(fillAttr, vgl.vertexAttributeKeysIndexed.Five);
    prog.addVertexAttribute(strokeColorAttr, vgl.vertexAttributeKeysIndexed.Six);
    prog.addVertexAttribute(strokeAttr, vgl.vertexAttributeKeysIndexed.Seven);
    prog.addVertexAttribute(fillOpacityAttr, vgl.vertexAttributeKeysIndexed.Eight);
    prog.addVertexAttribute(strokeOpacityAttr, vgl.vertexAttributeKeysIndexed.Nine);

    prog.addUniform(m_pixelWidthUniform);
    prog.addUniform(m_aspectUniform);
    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);

    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);

    mat.addAttribute(prog);
    mat.addAttribute(blend);

    m_actor = vgl.actor();
    m_actor.setMaterial(mat);

    start = buffers.alloc(6 * numPts);
    for (i = 0; i < numPts; i += 1) {
      buffers.repeat("pos", position[i],
                      start + i * 6, 6);
      buffers.write("unit", unit, start + i * 6, 6);
      buffers.write("indices", [i], start + i, 1);
      buffers.repeat("rad", [radius[i]], start + i * 6, 6);
      buffers.repeat("strokeWidth", [strokeWidth[i]], start + i * 6, 6);
      buffers.repeat("fillColor", fillColor[i], start + i * 6, 6);
      buffers.repeat("fill", [fill[i]], start + i * 6, 6);
      buffers.repeat("strokeColor", strokeColor[i], start + i * 6, 6);
      buffers.repeat("stroke", [stroke[i]], start + i * 6, 6);
      buffers.repeat("fillOpacity", [fillOpacity[i]], start + i * 6, 6);
      buffers.repeat("strokeOpacity", [strokeOpacity[i]], start + i * 6, 6);
    }

    sourcePositions.pushBack(buffers.get("pos"));
    geom.addSource(sourcePositions);

    sourceUnits.pushBack(buffers.get("unit"));
    geom.addSource(sourceUnits);

    sourceRadius.pushBack(buffers.get("rad"));
    geom.addSource(sourceRadius);

    sourceStokeWidth.pushBack(buffers.get("strokeWidth"));
    geom.addSource(sourceStokeWidth);

    sourceFillColor.pushBack(buffers.get("fillColor"));
    geom.addSource(sourceFillColor);

    sourceFill.pushBack(buffers.get("fill"));
    geom.addSource(sourceFill);

    sourceStrokeColor.pushBack(buffers.get("strokeColor"));
    geom.addSource(sourceStrokeColor);

    sourceStroke.pushBack(buffers.get("stroke"));
    geom.addSource(sourceStroke);

    sourceAlpha.pushBack(buffers.get("fillOpacity"));
    geom.addSource(sourceAlpha);

    sourceStrokeOpacity.pushBack(buffers.get("strokeOpacity"));
    geom.addSource(sourceStrokeOpacity);

    trianglesPrimitive.setIndices(buffers.get("indices"));
    geom.addPrimitive(trianglesPrimitive);

    mapper.setGeometryData(geom);

    m_actor.setMapper(mapper);
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Generate a local cache of the data stored as arrays to speed up renders.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._propertySetter = function (name, root, data) {
    s_setter.call(m_this, name, root, data);
    if (name === "positions") {
      m_cache.positions = geo.transform.transformCoordinates(
        m_this.gcs(),
        m_this.layer().map().gcs(),
        geo.gl.positionsToArray(data, 2),
        2
      );
    } else if (name === "strokeColor" || name === "fillColor") {
      m_cache[name] = geo.gl.colorsToArray(data);
    } else if (name === "stroke" || name === "fill") {
      m_cache[name] = geo.gl.boolsToArray(data);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
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

    createGLPoints();

    m_this.renderer().contextRenderer().addActor(m_actor);
    m_this.renderer().contextRenderer().render();
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

    // For now build if the data or style changes. In the future we may
    // we able to partially update the data using dynamic gl buffers.
    if (m_this.dataTime().getMTime() >= m_this.buildTime().getMTime() ||
        m_this.updateTime().getMTime() < m_this.getMTime()) {
      m_this._build();
    }

    // Update uniforms
    m_pixelWidthUniform.set(2.0 / m_this.renderer().width());
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
  };

  m_this._init();
  return this;
};

inherit(geo.gl.pointFeature, geo.pointFeature);

// Now register it
geo.registerFeature("vgl", "point", geo.gl.pointFeature);
