//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointFeature
 *
 * @class
 * @extends geo.pointFeature
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
      s_exit = this._exit,
      m_actor = null,
      m_pixelWidthUniform = null,
      m_aspectUniform = null,
      m_dynamicDraw = arg.dynamicDraw === undefined ? false : arg.dynamicDraw,
      s_init = this._init,
      s_update = this._update;

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
        position = [], radius = [], strokeWidth = [],
        fillColor = [], fill = [], strokeColor = [], stroke = [],
        fillOpacity = [], strokeOpacity = [], posFunc, radFunc, strokeWidthFunc,
        fillColorFunc, fillFunc, strokeColorFunc, strokeFunc, fillOpacityFunc,
        strokeOpactityFunc, buffers = vgl.DataBuffers(1024),
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
        mapper = vgl.mapper({dynamicDraw: m_dynamicDraw});

    m_pixelWidthUniform = new vgl.floatUniform("pixelWidth",
                            2.0 / m_this.renderer().width());
    m_aspectUniform = new vgl.floatUniform("aspect",
                        m_this.renderer().width() / m_this.renderer().height());

    posFunc = m_this.position();
    radFunc = m_this.style.get("radius");
    strokeWidthFunc = m_this.style.get("strokeWidth");
    fillColorFunc = m_this.style.get("fillColor");
    fillFunc = m_this.style.get("fill");
    strokeColorFunc = m_this.style.get("strokeColor");
    strokeFunc = m_this.style.get("stroke");
    fillOpacityFunc = m_this.style.get("fillOpacity");
    strokeOpactityFunc = m_this.style.get("strokeOpacity");

    m_this.data().forEach(function (item) {
      var p = posFunc(item), c;

      position.push([p.x, p.y, p.z || 0]);
      radius.push(radFunc(item));
      strokeWidth.push(strokeWidthFunc(item));
      fill.push(fillFunc(item) ? 1.0 : 0.0);

      c = fillColorFunc(item);
      fillColor.push([c.r, c.g, c.b]);

      c = strokeColorFunc(item);
      strokeColor.push([c.r, c.g, c.b]);

      stroke.push(strokeFunc(item) ? 1.0 : 0.0);
      fillOpacity.push(fillOpacityFunc(item));
      strokeOpacity.push(strokeOpactityFunc(item));
    });

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
    geom.addSource(sourcePositions, "pos");

    sourceUnits.pushBack(buffers.get("unit"));
    geom.addSource(sourceUnits, "unit");

    sourceRadius.pushBack(buffers.get("rad"));
    geom.addSource(sourceRadius, "rad");

    sourceStokeWidth.pushBack(buffers.get("strokeWidth"));
    geom.addSource(sourceStokeWidth, "strokeWidth");

    sourceFillColor.pushBack(buffers.get("fillColor"));
    geom.addSource(sourceFillColor, "fillColor");

    sourceFill.pushBack(buffers.get("fill"));
    geom.addSource(sourceFill, "fill");

    sourceStrokeColor.pushBack(buffers.get("strokeColor"));
    geom.addSource(sourceStrokeColor, "strokeColor");

    sourceStroke.pushBack(buffers.get("stroke"));
    geom.addSource(sourceStroke, "stroke");

    sourceAlpha.pushBack(buffers.get("fillOpacity"));
    geom.addSource(sourceAlpha, "fillOpacity");

    sourceStrokeOpacity.pushBack(buffers.get("strokeOpacity"));
    geom.addSource(sourceStrokeOpacity, "strokeOpacity");

    trianglesPrimitive.setIndices(buffers.get("indices"));
    geom.addPrimitive(trianglesPrimitive);

    mapper.setGeometryData(geom);

    m_actor.setMapper(mapper);
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return mapper where actor gets it behavior and data
   *
   * @returns {vgl.mapper}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.mapper = function () {
    if (!m_actor) {
        return null;
    }
    return m_actor.mapper();
  }

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
    s_exit();
  };

  m_this._init();
  return this;
};

inherit(geo.gl.pointFeature, geo.pointFeature);

// Now register it
geo.registerFeature("vgl", "point", geo.gl.pointFeature);
