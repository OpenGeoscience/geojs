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
    var vertexShaderSource = " \n\
          attribute vec3 pos; \n\
          attribute vec2 unit; \n\
          attribute float rad; \n\
          attribute vec3 fillColor; \n\
          attribute vec3 strokeColor; \n\
          attribute float alpha; \n\
          attribute float strokeWidth; \n\
          attribute float fill; \n\
          attribute float stroke; \n\
          uniform float pixelWidth; \n\
          uniform float aspect; \n\
          uniform mat4 modelViewMatrix; \n\
          uniform mat4 projectionMatrix; \n\
          varying vec3 unitVar; \n\
          varying vec4 fillColorVar; \n\
          varying vec4 strokeColorVar; \n\
          varying float radiusVar; \n\
          varying float strokeWidthVar; \n\
          varying float fillVar; \n\
          varying float strokeVar; \n\
          void main(void) \n\
          { \n\
            unitVar = vec3 (unit, 1.0); \n\
            fillColorVar = vec4 (fillColor, alpha); \n\
            strokeColorVar = vec4 (strokeColor, alpha); \n\
            strokeWidthVar = strokeWidth; \n\
            fillVar = fill; \n\
            strokeVar = stroke; \n\
            radiusVar = rad; \n\
            vec4 p = (projectionMatrix * modelViewMatrix * vec4(pos, 1.0)).xyzw; \n\
            if (p.w != 0.0) { \n\
              p = p/p.w; \n\
            } \n\
            p += (rad + strokeWidth) * vec4 (unit.x * pixelWidth, unit.y * pixelWidth * aspect, 0.0, 1.0); \n\
            gl_Position = vec4(p.xyz, 1.0); \n\
          }",
        shader = new vgl.shader(gl.VERTEX_SHADER);

    shader.setShaderSource(vertexShaderSource);
    return shader;
  }

  function createFragmentShader () {
    var fragmentShaderSource = " \n\n\
          #ifdef GL_ES \n\n\
            precision highp float; \n\n\
          #endif \n\n\
          uniform float aspect; \n\
          varying vec3 unitVar; \n\
          varying vec4 fillColorVar; \n\
          varying vec4 strokeColorVar; \n\
          varying float radiusVar; \n\
          varying float strokeWidthVar; \n\
          varying float fillVar; \n\
          varying float strokeVar; \n\
          bool to_bool (in float value) { \n\
            if (value < 0.0) \n\
              return false; \n\
            else \n\
              return true; \n\
          } \n\
          void main () { \n\
            bool fill = to_bool (fillVar); \n\
            bool stroke = to_bool (strokeVar); \n\
            vec4 strokeColor, fillColor; \n\
            // No stroke or fill implies nothing to draw \n\
            if (!fill && !stroke) \n\
              discard; \n\
            // Get normalized texture coordinates and polar r coordinate \n\
            vec2 tex = (unitVar.xy + 1.0) / 2.0; \n\
            float rad = length (unitVar.xy); \n\
            // If there is no stroke, the fill region should transition to nothing \n\
            if (!stroke) \n\
              strokeColor = vec4 (fillColorVar.rgb, 0.0); \n\
            else \n\
              strokeColor = strokeColorVar; \n\
            // Likewise, if there is no fill, the stroke should transition to nothing \n\
            if (!fill) \n\
              fillColor = vec4 (strokeColor.rgb, 0.0); \n\
            else \n\
              fillColor = fillColorVar; \n\
            float radiusWidth = radiusVar; \n\
            // Distance to antialias over \n\
            float antialiasDist = 3.0 / (2.0 * radiusVar); \n\
            if (rad < (radiusWidth / (radiusWidth + strokeWidthVar))) { \n\
              float endStep = radiusWidth / (radiusWidth + strokeWidthVar); \n\
              float step = smoothstep (endStep - antialiasDist, endStep, rad); \n\
              gl_FragColor = mix (fillColorVar, strokeColorVar, step); \n\
            } \n\
            else { \n\
              float step = smoothstep (1.0 - antialiasDist, 1.0, rad); \n\
              gl_FragColor = mix (strokeColor, vec4 (strokeColor.rgb, 0.0), step); \n\
            } \n\
            //float step = smoothstep (1.0 - antialiasDist, 1.0, rad); \n\
            //gl_FragColor = mix (color, vec4 (color.rgb, 0.0), step); \n\
          }",
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
        sourceStokeWidth = vgl.sourceDataAnyfv(1,
          vgl.vertexAttributeKeys.CountAttributeIndex + 3),
        sourceFillColor = vgl.sourceDataAnyfv(3,
          vgl.vertexAttributeKeys.CountAttributeIndex + 4),
        sourceFill = vgl.sourceDataAnyfv(1,
          vgl.vertexAttributeKeys.CountAttributeIndex + 5),
        sourceStrokeColor = vgl.sourceDataAnyfv(3,
          vgl.vertexAttributeKeys.CountAttributeIndex + 6),
        sourceStroke = vgl.sourceDataAnyfv(1,
          vgl.vertexAttributeKeys.CountAttributeIndex + 7),
        sourceAlpha = vgl.sourceDataAnyfv(1,
          vgl.vertexAttributeKeys.CountAttributeIndex + 8),
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
        alphaAttr = vgl.vertexAttribute("alpha"),
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
    buffers.create ('strokeWidth', 1);
    buffers.create ('fillColor', 3);
    buffers.create ('fill', 1);
    buffers.create ('strokeColor', 3);
    buffers.create ('stroke', 1);
    buffers.create ('alpha', 1);

    // TODO: Right now this is ugly but we will fix it.
    prog.addVertexAttribute(posAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(unitAttr, vgl.vertexAttributeKeys.CountAttributeIndex + 1);
    prog.addVertexAttribute(radAttr, vgl.vertexAttributeKeys.CountAttributeIndex + 2);
    prog.addVertexAttribute(stokeWidthAttr, vgl.vertexAttributeKeys.CountAttributeIndex + 3);
    prog.addVertexAttribute(fillColorAttr, vgl.vertexAttributeKeys.CountAttributeIndex + 4);
    prog.addVertexAttribute(fillAttr, vgl.vertexAttributeKeys.CountAttributeIndex + 5);
    prog.addVertexAttribute(strokeColorAttr, vgl.vertexAttributeKeys.CountAttributeIndex + 6);
    prog.addVertexAttribute(strokeAttr, vgl.vertexAttributeKeys.CountAttributeIndex + 7);
    prog.addVertexAttribute(alphaAttr, vgl.vertexAttributeKeys.CountAttributeIndex + 8);

    prog.addUniform(pixelWidthUniform);
    prog.addUniform(aspectUniform);
    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);

    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);

    mat.addAttribute(prog);
    mat.addAttribute(blend);

    m_actor = vgl.actor();
    m_actor.setMaterial(mat);

    start = buffers.alloc (3 * numPts);

    // Instructions on how to write to the buffers for specific styles
    m_this.styleMap = {
      'fill': function (color) {
        if (!color || color == 'none') {
          buffers.repeat ('fill', [-.75], start, numPts);
        }
        else {
          buffers.repeat ('fill', [.75], start, numPts);
          buffers.repeat ('fillColor', color, start, numPts);                                }
      },
      'opacity': function (opacity) {
        if (!opacity || opacity == 'none') {
          opacity = [1.0];
        }
        buffers.repeat ('alpha', opacity, start, numPts);
      },
      'radius': function (rad) {
        if (!rad || rad == 'none') {
          rad = [4.0];
        }
        buffers.repeat ('rad', rad, start, numPts);
      },
      'stroke': function (color) {
          if (!color || color == 'none') {
            buffers.repeat ('stroke', [-.75], start, numPts);
          }
          else {
            buffers.repeat ('stroke', [.75], start, numPts);
            buffers.repeat ('strokeColor', color, start, numPts);
          }
      },
      'strokeWidth': function (width) {
        if (!width || width == 'none') {
          width = [10.0];
        }
        buffers.repeat ('strokeWidth', width, start, numPts);
      }
    };

    for (i = 0; i < numPts; ++i) {
      buffers.repeat ('pos', [positions[i * 3],
                      positions[i * 3 + 1], positions[i * 3 + 2]],
                      start + i * 6, 6);
      buffers.write ('unit', unit, start + i * 6, 6);
      buffers.write("indices", [i], start + i, 1);
    }

    m_this.styleMap.fill([1.0, 0.0, 0.0]);
    m_this.styleMap.opacity();
    m_this.styleMap.radius();
    m_this.styleMap.stroke([0.0, 1.0, 0.0]);
    m_this.styleMap.strokeWidth();

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

    sourceAlpha.pushBack(buffers.get("alpha"));
    geom.addSource(sourceAlpha);

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

    if (m_this.updateTime().getMTime() < m_this.getMTime()) {
      m_this._build();
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
  };

  this._init(arg);
  return this;
};

inherit(ggl.pointFeature, geo.pointFeature);

// Now register it
geo.registerFeature("vgl", "point", ggl.pointFeature);
