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
  "use strict";
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
        "attribute vec3 pos;",
        "attribute vec3 strokeColor;",
        "attribute float strokeOpacity;",
        "attribute float strokeWidth;",
        "uniform mat4 modelViewMatrix;",
        "uniform mat4 projectionMatrix;",
        "varying vec3 strokeColorVar;",
        "varying float strokeWidthVar;",
        "varying float strokeOpacityVar;",
        "void main(void)",
        "{",
        "  strokeColorVar = strokeColor;",
        "  strokeWidthVar = strokeWidth;",
        "  strokeOpacityVar = strokeOpacity;",
        "  vec4 p = (projectionMatrix * modelViewMatrix * vec4(pos, 1.0)).xyzw;",
        "  if (p.w != 0.0) {",
        "    p = p/p.w;",
        "  }",
        "  gl_Position = p;",
        "}"
      ].join("\n"),
      shader = new vgl.shader(gl.VERTEX_SHADER);
      shader.setShaderSource(vertexShaderSource);
      return shader;
    }

  function createFragmentShader() {
    var fragmentShaderSource = [
      "#ifdef GL_ES",
      "  precision highp float;",
      "#endif",
      "varying vec3 strokeColorVar;",
      "varying float strokeWidthVar;",
      "varying float strokeOpacityVar;",
      "void main () {",
      "  gl_FragColor = vec4 (strokeColorVar, strokeOpacityVar);",
      "}"
    ],
    shader = new vgl.shader(gl.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShaderSource);
    return shader;
  }

  function createGLLines() {
    var i, numPts = m_this.data().length,
        start, position = [], strokeWidth = [],
        strokeColor = [], strokeOpacity = [], posFunc, strokeWidthFunc,
        strokeColorFunc, strokeOpacityFunc,
        buffers = vgl.DataBuffers(1024),
        sourcePositions = vgl.sourceDataP3fv(),
        sourceStokeWidth = vgl.sourceDataAnyfv(1,
          vgl.vertexAttributeKeys.CountAttributeIndex + 1),
        sourceStrokeColor = vgl.sourceDataAnyfv(3,
          vgl.vertexAttributeKeys.CountAttributeIndex + 2),
        sourceStrokeOpacity = vgl.sourceDataAnyfv(1,
          vgl.vertexAttributeKeys.CountAttributeIndex + 3),
        linesPrimitive = vgl.lines(),
        mat = vgl.material(),
        blend = vgl.blend(),
        prog = vgl.shaderProgram(),
        vertexShader = createVertexShader(),
        fragmentShader = createFragmentShader(),
        posAttr = vgl.vertexAttribute("pos"),
        stokeWidthAttr = vgl.vertexAttribute("strokeWidth"),
        strokeColorAttr = vgl.vertexAttribute("strokeColor"),
        strokeOpacityAttr = vgl.vertexAttribute("strokeOpacity"),
        modelViewUniform = new vgl.modelViewUniform("modelViewMatrix"),
        projectionUniform = new vgl.projectionUniform("projectionMatrix"),
        geom = vgl.geometryData(),
        mapper = vgl.mapper();

    posFunc = m_this.position();
    strokeWidthFunc = m_this.style().strokeWidth;
    strokeColorFunc = m_this.style().strokeColor;
    strokeOpacityFunc = m_this.style().strokeOpacity;

    m_this.data().forEach(function (item) {
      var p = posFunc(item);
      position.push([p.x, p.y, p.z || 0]);
      strokeWidth.push(strokeWidthFunc(item));
      strokeColor.push(strokeColorFunc(item));
      strokeOpacity.push(strokeOpacityFunc(item));
    });

    position = geo.transform.transformCoordinates(
                  m_this.gcs(), m_this.layer().map().gcs(),
                  position, 3);

    buffers.create("pos", 3);
    buffers.create("indices", 1);
    buffers.create("strokeWidth", 1);
    buffers.create("strokeColor", 3);
    buffers.create("strokeOpacity", 1);

    // TODO: Right now this is ugly but we will fix it.
    prog.addVertexAttribute(posAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(
      stokeWidthAttr,
      vgl.vertexAttributeKeys.CountAttributeIndex + 1
    );
    prog.addVertexAttribute(
      strokeColorAttr,
      vgl.vertexAttributeKeys.CountAttributeIndex + 2
    );
    prog.addVertexAttribute(
      strokeOpacityAttr,
      vgl.vertexAttributeKeys.CountAttributeIndex + 3
    );

    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);

    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);

    mat.addAttribute(prog);
    mat.addAttribute(blend);

    m_actor = vgl.actor();
    m_actor.setMaterial(mat);

    start = buffers.alloc(numPts);
    for (i = 0; i < numPts; i += 1) {
      buffers.write("pos", position[i], start + i, 1);
      buffers.write("indices", [i], start + i, 1);
      buffers.write("strokeWidth", [strokeWidth[i]], start + i * 1, 1);
      buffers.write("strokeColor", strokeColor[i], start + i * 1, 1);
      buffers.write("strokeOpacity", [strokeOpacity[i]], start + i * 1, 1);
    }

    sourcePositions.pushBack(buffers.get("pos"));
    geom.addSource(sourcePositions);

    sourceStokeWidth.pushBack(buffers.get("strokeWidth"));
    geom.addSource(sourceStokeWidth);

    sourceStrokeColor.pushBack(buffers.get("strokeColor"));
    geom.addSource(sourceStrokeColor);

    sourceStrokeOpacity.pushBack(buffers.get("strokeOpacity"));
    geom.addSource(sourceStrokeOpacity);

    linesPrimitive.setIndices(buffers.get("indices"));
    geom.addPrimitive(linesPrimitive);

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
geo.registerFeature("vgl", "line", ggl.lineFeature);
