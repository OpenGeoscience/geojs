//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo.gl
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointFeature
 *
 * @class
 * @returns {ggl.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
ggl.pointFeature = function (arg) {
  "use strict";
  if (!(this instanceof ggl.pointFeature)) {
    return new ggl.pointFeature(arg);
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
      s_init = this._init,
      s_update = this._update;


  function createVertexShader() {
    var vertexShaderSource = [
          'attribute vec3 pos;',
          'attribute vec2 unit;',
          'attribute float rad;',
          'uniform float pixelWidth;',
          'uniform float aspect;',
          'uniform mat4 modelViewMatrix;',
          'uniform mat4 projectionMatrix;',
          'void main(void)',
          '{',
          'vec4 p = (projectionMatrix * modelViewMatrix * vec4(pos, 1.0)).xyzw;',
          'if (p.w != 0.0) {',
          ' p = p/p.w;',
          '}',
          'p += (rad + 1.0) * vec4 (unit.x * pixelWidth, unit.y * pixelWidth * aspect, 0.0, 1.0);',
          'gl_Position = vec4(p.xyz, 1.0);}'].join('\n'),

        shader = new vgl.shader(gl.VERTEX_SHADER);

    shader.setShaderSource(vertexShaderSource);
    return shader;
  }

  function createFragmentShader () {
    var fragmentShaderSource = [
          'void main(void) {',
          'gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);}' ].join('\n'),
        shader = new vgl.shader(gl.FRAGMENT_SHADER);
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

// point_shader.data ('aspect', engine.canvas.width () / engine.canvas.height ());
//         point_shader.data ('pix_w', 2.0 / engine.canvas.width ());

  function createGLPoints () {
    var i, numPts = 2 * m_this.positions().length,
        alpha = 1.0, start, unit = rect(0, 0, 1, 1),
        positions = geo.transform.transformCoordinates(
                      m_this.gcs(), m_this.layer().map().gcs(),
                      m_this.positions(), 3),
        buffers = vgl.DataBuffers(1024),
        sourcePositions = vgl.sourceDataP3fv(),
        sourceUnits = vgl.sourceDataAnyfv(2,
          vgl.vertexAttributeKeys.CountAttributeIndex + 1),
        sourceRadius = vgl.sourceDataAnyfv(1,
          vgl.vertexAttributeKeys.CountAttributeIndex + 2),
        trianglesPrimitive = vgl.triangles(),
        mat = vgl.material(),
        prog = vgl.shaderProgram(),
        vertexShader = createVertexShader(),
        fragmentShader = createFragmentShader(),
        posAttr = vgl.vertexAttribute("pos"),
        unitAttr = vgl.vertexAttribute("unit"),
        radAttr = vgl.vertexAttribute("rad"),
        pixelWidthUniform = new vgl.floatUniform("pixelWidth", 2.0 / m_this.renderer().width()),
        aspectUniform = new vgl.floatUniform("aspect", m_this.renderer().width() / m_this.renderer().height()),
        modelViewUniform = new vgl.modelViewUniform("modelViewMatrix"),
        projectionUniform = new vgl.projectionUniform("projectionMatrix"),
        geom = vgl.geometryData(),
        mapper = vgl.mapper();

    buffers.create ('pos', 3);
    buffers.create ('indices', 1);
    buffers.create ('unit', 2);
    buffers.create ('rad', 1);

    // buffers.create ('strokeWidth', 1);
    // buffers.create ('fillColor', 3);
    // buffers.create ('fill', 1);
    // buffers.create ('strokeColor', 3);
    // buffers.create ('stroke', 1);
    // buffers.create ('alpha', 1);

    prog.addVertexAttribute(posAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(unitAttr, vgl.vertexAttributeKeys.CountAttributeIndex + 1);
    prog.addVertexAttribute(radAttr, vgl.vertexAttributeKeys.CountAttributeIndex + 2);

    prog.addUniform(pixelWidthUniform);
    prog.addUniform(aspectUniform);
    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);

    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);

    mat.addAttribute(prog);

    m_actor = vgl.actor();
    m_actor.setMaterial(mat);

    start = buffers.alloc (3 * numPts);

    for (i = 0; i < numPts; ++i) {
      buffers.repeat ('pos', [positions[i * 3],
                      positions[i * 3 + 1], positions[i * 3 + 2]],
                      start + i * 6, 6);
      buffers.write ('unit', unit, start + i * 6, 6);
    }

    buffers.repeat ('rad', [1.0], start, numPts);

    for (i = 0; i < numPts; ++i) {
      buffers.write("indices", [i], start + i, 1);
    }

    sourcePositions.pushBack(buffers.get("pos"));
    geom.addSource(sourcePositions);

    sourceUnits.pushBack(buffers.get("unit"));
    geom.addSource(sourceUnits);

    sourceRadius.pushBack(buffers.get("rad"));
    geom.addSource(sourceRadius);

    trianglesPrimitive.setIndices(buffers.get("indices"));
    geom.addPrimitive(trianglesPrimitive);

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
    var style = m_this.style(),
        positions = geo.transform.transformFeature(
          m_this.renderer().map().gcs(),
          m_this,
          false
    );

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
    var style =  m_this.style();

    s_update.call(m_this);

    if (m_this.dataTime().getMTime() >= m_this.buildTime().getMTime()) {
      m_this._build();
    }

    // if (m_this.updateTime().getMTime() <= m_this.getMTime()) {
    //   if (m_this.style.color instanceof vgl.lookupTable) {
    //     vgl.utils.updateColorMappedMaterial(m_this.material(),
    //       m_this.style.color);
    //   }

    //   if (style.point_sprites === true) {
    //     if (style.point_sprites_image === null) {
    //       throw "[error] Invalid image for point sprites";
    //     }

    //     if (style.width && style.height) {
    //       m_actor.material().shaderProgram().uniform("pointSize").set(
    //         [style.width, style.height]);
    //     }
    //     else if (style.size) {
    //       m_actor.material().shaderProgram().uniform("pointSize").set(
    //         [style.size, style.size]);
    //     }
    //   } else {
    //     /// Points only has support for size
    //     if (style.size) {
    //       m_actor.material().shaderProgram().uniform("pointSize").set(
    //         style.size);
    //     }
    //   }
    // }
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

inherit(ggl.pointFeature, geo.pointFeature);

// Now register it
geo.registerFeature("vgl", "point", ggl.pointFeature);
