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
  geo.gl.feature.call(this, arg);

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
      s_update = this._update,
      s_setter = this._propertySetter,
      m_sizeAlloc = 0,
      m_program = null;


  var vertexShaderSource = [
      "attribute vec3 pos;",
      "attribute vec2 unit;",
      "attribute float radius;",
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
      "  radiusVar = radius;",
      "  vec4 p = (projectionMatrix * modelViewMatrix * vec4(pos, 1.0)).xyzw;",
      "  if (p.w != 0.0) {",
      "    p = p/p.w;",
      "  }",
      "  p += (radius + strokeWidth) * ",
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

  /*
   * Construct the shader program and store in the private
   * variable m_program.  Called on construction.
   * @private
   */
  (function createShaderProg() {
    var prog = vgl.shaderProgram(),
        posAttr = vgl.vertexAttribute("pos"),
        unitAttr = vgl.vertexAttribute("unit"),
        radAttr = vgl.vertexAttribute("radius"),
        stokeWidthAttr = vgl.vertexAttribute("strokeWidth"),
        fillColorAttr = vgl.vertexAttribute("fillColor"),
        fillAttr = vgl.vertexAttribute("fill"),
        strokeColorAttr = vgl.vertexAttribute("strokeColor"),
        strokeAttr = vgl.vertexAttribute("stroke"),
        fillOpacityAttr = vgl.vertexAttribute("fillOpacity"),
        strokeOpacityAttr = vgl.vertexAttribute("strokeOpacity"),
        modelViewUniform = new vgl.modelViewUniform("modelViewMatrix"),
        projectionUniform = new vgl.projectionUniform("projectionMatrix"),
        fragmentShader = createFragmentShader(),
        vertexShader = createVertexShader();

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

    m_program = prog;
  })();

  /**
   * Create a vgl actor.
   * @returns {
   * @private
   */
  function createActor() {
    var blend = vgl.blend(),
        actor = vgl.actor(),
        material = vgl.material();

    material.addAttribute(m_program);
    material.addAttribute(blend);
    actor.setMaterial(material);
    return actor;
  }

  /**
   * Allocate the gl buffer with the given size.  Clears
   * any current content.
   * @private
   * @param {number} n Number of points
   */
  function allocateBuffer(n) {
    var unit, tmp;
    if (m_sizeAlloc !== n) {
      m_this._allocateBuffer(
        n * 6,
        [
          {
            name: "unit",
            size: 2,
            source: vgl.sourceDataAnyfv(
              2,
              vgl.vertexAttributeKeysIndexed.One,
              {"name": "unit"}
            )
          },
          {
            name: "pos",
            size: 3,
            source: vgl.sourceDataP3fv({"name": "pos"})
          },
          {
            name: "radius",
            size: 1,
            source: vgl.sourceDataAnyfv(
              1,
              vgl.vertexAttributeKeysIndexed.Two,
              {"name": "radius"}
            )
          },
          {
            name: "strokeWidth",
            size: 1,
            source: vgl.sourceDataAnyfv(
              1,
              vgl.vertexAttributeKeysIndexed.Three,
              {"name": "strokeWidth"})
          },
          {
            name: "fillColor",
            size: 3,
            source: vgl.sourceDataAnyfv(
              3,
              vgl.vertexAttributeKeysIndexed.Four,
              {"name": "fillColor"}
            )
          },
          {
            name: "fill",
            size: 1,
            source: vgl.sourceDataAnyfv(
              1,
              vgl.vertexAttributeKeysIndexed.Five,
              {"name": "fill"}
            )
          },
          {
            name: "strokeColor",
            size: 3,
            source: vgl.sourceDataAnyfv(
              3,
              vgl.vertexAttributeKeysIndexed.Six,
              {"name": "strokeColor"}
            )
          },
          {
            name: "stroke",
            size: 1,
            source: vgl.sourceDataAnyfv(
              1,
              vgl.vertexAttributeKeysIndexed.Seven,
              {"name": "stroke"}
            )
          },
          {
            name: "fillOpacity",
            size: 1,
            source: vgl.sourceDataAnyfv(
              1,
              vgl.vertexAttributeKeysIndexed.Eight,
              {"name": "fillOpacity"}
            )
          },
          {
            name: "strokeOpacity",
            size: 1,
            source: vgl.sourceDataAnyfv(
              1,
              vgl.vertexAttributeKeysIndexed.Nine,
              {"name": "strokeOpacity"}
            )
          }
        ],
        [
          {
            "indices": "indices",
            "primitive": vgl.triangles()
          }
        ]
      );
      unit = rect(0, 0, 1, 1);

      tmp = [];
      tmp.length = n;
      m_this._writeBuffer("indices", tmp, 1, function (d, i) { return i; });
      m_this._writeBuffer("unit", tmp, 6, function () { return unit; });
    }
  }

  function createGLPoints() {
    var geom = m_this._buildGeometry(),
        mapper = vgl.mapper({
          dynamicDraw: m_dynamicDraw
        });

    m_pixelWidthUniform = new vgl.floatUniform("pixelWidth",
                            2.0 / m_this.renderer().width());
    m_aspectUniform = new vgl.floatUniform("aspect",
                        m_this.renderer().width() / m_this.renderer().height());

    if (m_actor) {
      m_this.renderer().contextRenderer().removeActor(m_actor);
      m_actor = null;
    }

    if (m_sizeAlloc === 0) {
      return;
    }

    m_actor = createActor();

    mapper.setGeometryData(geom);
    m_actor.setMapper(mapper);
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Generate a local cache of the data stored as arrays to speed up renders.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._propertySetter = function (name, root, data) {
    // Call parent method to keep base class functionality
    // (mouse handlers, etc)
    s_setter.call(m_this, name, root, data);

    // maybe move this elsewhere (also use dataModified, etc)
    allocateBuffer(data.length);
    if (name === "position") {
      m_this._writePositions("pos", data, 6);
    } else if (name === "strokeColor" || name === "fillColor") {
      m_this._writeColors(name, data, 6);
    } else if (name === "stroke" || name === "fill") {
      m_this._writeBools(name, data, 6);
    } else if (name === "strokeOpacity" || name === "fillOpacity" || name === "radius") {
      m_this._writeBuffer(name, data, 6);
    }
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

    if (m_actor) {
      m_actor.setVisible(m_this.visible());
      m_actor.material().setBinNumber(m_this.bin());
    }

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
