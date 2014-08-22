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
        alpha = 1.0,
        unit = rect(0, 0, 1, 1),
        positions = geo.transform.transformCoordinates(
                      m_this.gcs(), m_this.layer().map().gcs(),
                      m_this.positions(), 3),
        positionArray = [],
        sourcePositions = vgl.sourceDataP3fv(),
        unitsArray = [],
        sourceUnits = vgl.sourceDataAnyfv(2,
          vgl.vertexAttributeKeys.CountAttributeIndex + 1),
        radiusArray = [],
        sourceRadius = vgl.sourceDataAnyfv(1,
          vgl.vertexAttributeKeys.CountAttributeIndex + 2),
        indicesArray = [],
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

    /// Now create the geometry
    positionArray.length = numPts * 3;
    unitsArray.length = numPts * 2;
    radiusArray.length = numPts;
    indicesArray.length = numPts;

    /// TODO: Write a function to this for us.
    /// Repeat positions (We need six points to draw two triangles)
    for (i = 0; i < numPts * 3; i += 18) {
      positionArray[i + 0] = positions[i];
      positionArray[i + 1] = positions[i + 1];
      positionArray[i + 2] = positions[i + 2];
      positionArray[i + 3] = positions[i];
      positionArray[i + 4] = positions[i + 1];
      positionArray[i + 5] = positions[i + 2];
      positionArray[i + 6] = positions[i];
      positionArray[i + 7] = positions[i + 1];
      positionArray[i + 8] = positions[i + 2];
      positionArray[i + 9] = positions[i];
      positionArray[i + 10] = positions[i + 1];
      positionArray[i + 11] = positions[i + 2];
      positionArray[i + 12] = positions[i];
      positionArray[i + 13] = positions[i + 1];
      positionArray[i + 14] = positions[i + 2];
      positionArray[i + 15] = positions[i];
      positionArray[i + 16] = positions[i + 1];
      positionArray[i + 17] = positions[i + 2];
    }

    for (i = 0; i < numPts * 2; i += 12) {
      unitsArray[i + 0] = unit[0];
      unitsArray[i + 1] = unit[1];
      unitsArray[i + 2] = unit[2];
      unitsArray[i + 3] = unit[3];
      unitsArray[i + 4] = unit[4];
      unitsArray[i + 5] = unit[5];
      unitsArray[i + 6] = unit[6];
      unitsArray[i + 7] = unit[7];
      unitsArray[i + 8] = unit[8];
      unitsArray[i + 9] = unit[9];
      unitsArray[i + 10] = unit[10];
      unitsArray[i + 11] = unit[11];
    }

    for (i = 0; i < numPts; i += 6) {
      radiusArray[i + 0] = 1.0;
      radiusArray[i + 1] = 1.0;
      radiusArray[i + 2] = 1.0;
      radiusArray[i + 3] = 1.0;
      radiusArray[i + 4] = 1.0;
      radiusArray[i + 5] = 1.0;
    }

    for (i = 0; i < numPts; ++i) {
      indicesArray[i] = i;
    }

    sourcePositions.pushBack(positionArray);
    geom.addSource(sourcePositions);

    sourceUnits.pushBack(unitsArray);
    geom.addSource(sourceUnits);

    sourceRadius.pushBack(radiusArray);
    geom.addSource(sourceRadius);

    trianglesPrimitive.setIndices(indicesArray);
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
