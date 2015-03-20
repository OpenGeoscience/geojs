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
      m_mapper = null,
      m_pixelWidthUniform = null,
      m_aspectUniform = null,
      m_dynamicDraw = arg.dynamicDraw === undefined ? false : arg.dynamicDraw,
      m_primitiveShape = "sprite", // arg can change this, below
      s_init = this._init,
      s_update = this._update,
      vertexShaderSource = null,
      fragmentShaderSource = null;

  if (arg.primitiveShape === "triangle" ||
      arg.primitiveShape === "square" ||
      arg.primitiveShape === "sprite") {
    m_primitiveShape = arg.primitiveShape;
  }

  vertexShaderSource = [
    "#ifdef GL_ES",
    "  precision highp float;",
    "#endif",
    "attribute vec3 pos;",
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
    "varying vec4 fillColorVar;",
    "varying vec4 strokeColorVar;",
    "varying float radiusVar;",
    "varying float strokeWidthVar;",
    "varying float fillVar;",
    "varying float strokeVar;"
  ];

  if (m_primitiveShape !== "sprite") {
    vertexShaderSource = vertexShaderSource.concat([
      "attribute vec2 unit;",
      "varying vec3 unitVar;"
    ]);
  }

  vertexShaderSource.push.apply(vertexShaderSource, [
    "void main(void)",
    "{",
    "  strokeWidthVar = strokeWidth;",
    "  // No stroke or fill implies nothing to draw",
    "  if (stroke < 1.0 || strokeWidth <= 0.0 || strokeOpacity <= 0.0) {",
    "    strokeVar = 0.0;",
    "    strokeWidthVar = 0.0;",
    "  }",
    "  else",
    "    strokeVar = 1.0;",
    "  if (fill < 1.0 || rad <= 0.0 || fillOpacity <= 0.0)",
    "    fillVar = 0.0;",
    "  else",
    "    fillVar = 1.0;",
    /* If the point has no visible pixels, skip doing computations on it. */
    "  if (fillVar == 0.0 && strokeVar == 0.0) {",
    "    gl_Position = vec4(2, 2, 0, 1);",
    "    return;",
    "  }",
    "  fillColorVar = vec4 (fillColor, fillOpacity);",
    "  strokeColorVar = vec4 (strokeColor, strokeOpacity);",
    "  radiusVar = rad;"
  ]);

  if (m_primitiveShape === "sprite") {
    vertexShaderSource.push.apply(vertexShaderSource, [
      "  gl_Position = (projectionMatrix * modelViewMatrix * vec4(pos, 1.0)).xyzw;",
      "  gl_PointSize = 2.0 * (rad + strokeWidthVar); ",
      "}"
    ]);
  } else {
    vertexShaderSource.push.apply(vertexShaderSource, [
        "  unitVar = vec3 (unit, 1.0);",
        "  vec4 p = (projectionMatrix * modelViewMatrix * vec4(pos, 1.0)).xyzw;",
        "  if (p.w != 0.0) {",
        "    p = p / p.w;",
        "  }",
        "  p += (rad + strokeWidthVar) * ",
        "       vec4 (unit.x * pixelWidth, unit.y * pixelWidth * aspect, 0.0, 1.0);",
        "  gl_Position = vec4(p.xyz, 1.0);",
        "}"
      ]);
  }
  vertexShaderSource = vertexShaderSource.join("\n");

  fragmentShaderSource = [
    "#ifdef GL_ES",
    "  precision highp float;",
    "#endif",
    "uniform float aspect;",
    "varying vec4 fillColorVar;",
    "varying vec4 strokeColorVar;",
    "varying float radiusVar;",
    "varying float strokeWidthVar;",
    "varying float fillVar;",
    "varying float strokeVar;"
  ];

  if (m_primitiveShape !== "sprite") {
    fragmentShaderSource.push("varying vec3 unitVar;");
  }

  fragmentShaderSource.push.apply(fragmentShaderSource, [
    "void main () {",
    "  vec4 strokeColor, fillColor;",
    "  float endStep;",
    "  // No stroke or fill implies nothing to draw",
    "  if (fillVar == 0.0 && strokeVar == 0.0)",
    "    discard;"
  ]);

  if (m_primitiveShape === "sprite") {
    fragmentShaderSource.push(
      "  float rad = 2.0 * length (gl_PointCoord - vec2(0.5));");
  } else {
    fragmentShaderSource.push(
      "  float rad = length (unitVar.xy);");
  }

  fragmentShaderSource.push.apply(fragmentShaderSource, [
    "  if (rad > 1.0)",
    "    discard;",
    "  // If there is no stroke, the fill region should transition to nothing",
    "  if (strokeVar == 0.0) {",
    "    strokeColor = vec4 (fillColorVar.rgb, 0.0);",
    "    endStep = 1.0;",
    "  } else {",
    "    strokeColor = strokeColorVar;",
    "    endStep = radiusVar / (radiusVar + strokeWidthVar);",
    "  }",
    "  // Likewise, if there is no fill, the stroke should transition to nothing",
    "  if (fillVar == 0.0)",
    "    fillColor = vec4 (strokeColor.rgb, 0.0);",
    "  else",
    "    fillColor = fillColorVar;",
    "  // Distance to antialias over",
    "  float antialiasDist = 3.0 / (2.0 * radiusVar);",
    "  if (rad < endStep) {",
    "    float step = smoothstep (endStep - antialiasDist, endStep, rad);",
    "    gl_FragColor = mix (fillColor, strokeColor, step);",
    "  } else {",
    "    float step = smoothstep (1.0 - antialiasDist, 1.0, rad);",
    "    gl_FragColor = mix (strokeColor, vec4 (strokeColor.rgb, 0.0), step);",
    "  }",
    "}"
  ]);

  fragmentShaderSource = fragmentShaderSource.join("\n");

  function createVertexShader() {
    var shader = new vgl.shader(gl.VERTEX_SHADER);
    shader.setShaderSource(vertexShaderSource);
    return shader;
  }

  function createFragmentShader() {
    var shader = new vgl.shader(gl.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShaderSource);
    return shader;
  }

  function pointPolygon(x, y, w, h) {
    var verts;
    switch (m_primitiveShape) {
      case "triangle":
        /* Use an equilateral triangle.  While this has 30% more area than a
         * square, the reduction in vertices should help more than the
         * processing the additional fragments. */
        verts = [
          x, y - h * 2,
          x - w * Math.sqrt(3.0), y + h,
          x + w * Math.sqrt(3.0), y + h
        ];
        break;
      case "sprite":
        /* Point sprite uses only one vertex per point. */
        verts = [x, y];
        break;
      default: // "square"
        /* Use a surrounding square split diagonally into two triangles. */
        verts = [
          x - w, y + h,
          x - w, y - h,
          x + w, y + h,
          x - w, y - h,
          x + w, y - h,
          x + w, y + h
        ];
        break;
    }
    return verts;
  }

  function createGLPoints() {
    // unit and associated data is not used when drawing sprite
    var i, j, numPts = m_this.data().length,
        unit = pointPolygon(0, 0, 1, 1),
        position = new Array(numPts * 3), posBuf, posVal, posFunc,
        unitBuf, indices,
        radius, radiusVal, radFunc,
        stroke, strokeVal, strokeFunc,
        strokeWidth, strokeWidthVal, strokeWidthFunc,
        strokeOpacity, strokeOpacityVal, strokeOpactityFunc,
        strokeColor, strokeColorVal, strokeColorFunc,
        fill, fillVal, fillFunc,
        fillOpacity, fillOpacityVal, fillOpacityFunc,
        fillColor, fillColorVal, fillColorFunc,
        vpf = m_this.verticesPerFeature(),
        data = m_this.data(),
        item, ivpf, ivpf3, iunit, i3,
        geom = m_mapper.geometryData();

    posFunc = m_this.position();
    radFunc = m_this.style.get("radius");
    strokeFunc = m_this.style.get("stroke");
    strokeWidthFunc = m_this.style.get("strokeWidth");
    strokeOpactityFunc = m_this.style.get("strokeOpacity");
    strokeColorFunc = m_this.style.get("strokeColor");
    fillFunc = m_this.style.get("fill");
    fillOpacityFunc = m_this.style.get("fillOpacity");
    fillColorFunc = m_this.style.get("fillColor");

    /* It is more efficient to do a transform on a single array rather than on
     * an array of arrays or an array of objects. */
    for (i = i3 = 0; i < numPts; i += 1, i3 += 3) {
      posVal = posFunc(data[i]);
      position[i3]     = posVal.x;
      position[i3 + 1] = posVal.y;
      position[i3 + 2] = posVal.z || 0;
    }
    position = geo.transform.transformCoordinates(
                  m_this.gcs(), m_this.layer().map().gcs(),
                  position, 3);

    posBuf        = getBuffer(geom, "pos", vpf * numPts * 3);

    if (m_primitiveShape !== "sprite") {
      unitBuf       = getBuffer(geom, "unit", vpf * numPts * 2);
    }

    radius        = getBuffer(geom, "rad", vpf * numPts * 1);
    stroke        = getBuffer(geom, "stroke", vpf * numPts * 1);
    strokeWidth   = getBuffer(geom, "strokeWidth", vpf * numPts * 1);
    strokeOpacity = getBuffer(geom, "strokeOpacity", vpf * numPts * 1);
    strokeColor   = getBuffer(geom, "strokeColor", vpf * numPts * 3);
    fill          = getBuffer(geom, "fill", vpf * numPts * 1);
    fillOpacity   = getBuffer(geom, "fillOpacity", vpf * numPts * 1);
    fillColor     = getBuffer(geom, "fillColor", vpf * numPts * 3);
    indices = geom.primitive(0).indices();
    if (!(indices instanceof Uint16Array) || indices.length !== vpf * numPts) {
      indices = new Uint16Array(vpf * numPts);
      geom.primitive(0).setIndices(indices);
    }

    for (i = ivpf = ivpf3 = iunit = i3 = 0; i < numPts; i += 1, i3 += 3) {
      item = data[i];
      if (m_primitiveShape !== "sprite") {
        for (j = 0; j < unit.length; j += 1, iunit += 1) {
          unitBuf[iunit] = unit[j];
        }
      }
      /* We can ignore the indicies (they will all be zero) */
      radiusVal = radFunc(item);
      strokeVal = strokeFunc(item) ? 1.0 : 0.0;
      strokeWidthVal = strokeWidthFunc(item);
      strokeOpacityVal = strokeOpactityFunc(item);
      strokeColorVal = strokeColorFunc(item);
      fillVal = fillFunc(item) ? 1.0 : 0.0;
      fillOpacityVal = fillOpacityFunc(item);
      fillColorVal = fillColorFunc(item);
      for (j = 0; j < vpf; j += 1, ivpf += 1, ivpf3 += 3) {
        posBuf[ivpf3]     = position[i3];
        posBuf[ivpf3 + 1] = position[i3 + 1];
        posBuf[ivpf3 + 2] = position[i3 + 2];
        radius[ivpf] = radiusVal;
        stroke[ivpf] = strokeVal;
        strokeWidth[ivpf] = strokeWidthVal;
        strokeOpacity[ivpf] = strokeOpacityVal;
        strokeColor[ivpf3]     = strokeColorVal.r;
        strokeColor[ivpf3 + 1] = strokeColorVal.g;
        strokeColor[ivpf3 + 2] = strokeColorVal.b;
        fill[ivpf] = fillVal;
        fillOpacity[ivpf] = fillOpacityVal;
        fillColor[ivpf3]     = fillColorVal.r;
        fillColor[ivpf3 + 1] = fillColorVal.g;
        fillColor[ivpf3 + 2] = fillColorVal.b;
      }
    }

    geom.boundsDirty(true);
    m_mapper.modified();
    m_mapper.boundsDirtyTimestamp().modified();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get a buffer for a geometry source.  If a buffer already exists and is
   * the correct size, return it.  Otherwise, allocate a new buffer; any data
   * in an old buffer is discarded.
   *
   * @param geom: the geometry to reference and modify.
   * @param srcName: the name of the source.
   * @param len: the number of elements for the array.
   * @returns {Float32Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  function getBuffer(geom, srcName, len) {
    var src = geom.sourceByName(srcName), data;

    data = src.data();
    if (data instanceof Float32Array && data.length === len) {
      return data;
    }
    data = new Float32Array(len);
    src.setData(data);
    return data;
  }

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
   * Return the number of vertices used for each point.
   *
   * @returns {Number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.verticesPerFeature = function () {
    var unit = pointPolygon(0, 0, 1, 1);
    return unit.length / 2;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
    var prog = vgl.shaderProgram(),
        vertexShader = createVertexShader(),
        fragmentShader = createFragmentShader(),
        posAttr = vgl.vertexAttribute("pos"),
        unitAttr = vgl.vertexAttribute("unit"),
        radAttr = vgl.vertexAttribute("rad"),
        strokeWidthAttr = vgl.vertexAttribute("strokeWidth"),
        fillColorAttr = vgl.vertexAttribute("fillColor"),
        fillAttr = vgl.vertexAttribute("fill"),
        strokeColorAttr = vgl.vertexAttribute("strokeColor"),
        strokeAttr = vgl.vertexAttribute("stroke"),
        fillOpacityAttr = vgl.vertexAttribute("fillOpacity"),
        strokeOpacityAttr = vgl.vertexAttribute("strokeOpacity"),
        modelViewUniform = new vgl.modelViewUniform("modelViewMatrix"),
        projectionUniform = new vgl.projectionUniform("projectionMatrix"),
        mat = vgl.material(),
        blend = vgl.blend(),
        geom = vgl.geometryData(),
        sourcePositions = vgl.sourceDataP3fv({"name": "pos"}),
        sourceUnits = vgl.sourceDataAnyfv(
            2, vgl.vertexAttributeKeysIndexed.One, {"name": "unit"}),
        sourceRadius = vgl.sourceDataAnyfv(
            1, vgl.vertexAttributeKeysIndexed.Two, {"name": "rad"}),
        sourceStrokeWidth = vgl.sourceDataAnyfv(
            1, vgl.vertexAttributeKeysIndexed.Three, {"name": "strokeWidth"}),
        sourceFillColor = vgl.sourceDataAnyfv(
            3, vgl.vertexAttributeKeysIndexed.Four, {"name": "fillColor"}),
        sourceFill = vgl.sourceDataAnyfv(
            1, vgl.vertexAttributeKeysIndexed.Five, {"name": "fill"}),
        sourceStrokeColor = vgl.sourceDataAnyfv(
            3, vgl.vertexAttributeKeysIndexed.Six, {"name": "strokeColor"}),
        sourceStroke = vgl.sourceDataAnyfv(
            1, vgl.vertexAttributeKeysIndexed.Seven, {"name": "stroke"}),
        sourceAlpha = vgl.sourceDataAnyfv(
            1, vgl.vertexAttributeKeysIndexed.Eight, {"name": "fillOpacity"}),
        sourceStrokeOpacity = vgl.sourceDataAnyfv(
            1, vgl.vertexAttributeKeysIndexed.Nine, {"name": "strokeOpacity"}),
        primitive = new vgl.triangles();

    if (m_primitiveShape === "sprite") {
      primitive = new vgl.points();
    }

    m_pixelWidthUniform = new vgl.floatUniform("pixelWidth",
                            2.0 / m_this.renderer().width());
    m_aspectUniform = new vgl.floatUniform("aspect",
                        m_this.renderer().width() / m_this.renderer().height());

    s_init.call(m_this, arg);
    m_mapper = vgl.mapper({dynamicDraw: m_dynamicDraw});

    // TODO: Right now this is ugly but we will fix it.
    prog.addVertexAttribute(posAttr, vgl.vertexAttributeKeys.Position);
    if (m_primitiveShape !== "sprite") {
      prog.addVertexAttribute(unitAttr, vgl.vertexAttributeKeysIndexed.One);
    }

    prog.addVertexAttribute(radAttr, vgl.vertexAttributeKeysIndexed.Two);
    prog.addVertexAttribute(strokeWidthAttr, vgl.vertexAttributeKeysIndexed.Three);
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
    m_actor.setMapper(m_mapper);

    geom.addSource(sourcePositions);
    geom.addSource(sourceUnits);
    geom.addSource(sourceRadius);
    geom.addSource(sourceStrokeWidth);
    geom.addSource(sourceFillColor);
    geom.addSource(sourceFill);
    geom.addSource(sourceStrokeColor);
    geom.addSource(sourceStroke);
    geom.addSource(sourceAlpha);
    geom.addSource(sourceStrokeOpacity);
    geom.addPrimitive(primitive);
    m_mapper.setGeometryData(geom);
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
