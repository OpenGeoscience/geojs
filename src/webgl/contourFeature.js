var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var contourFeature = require('../contourFeature');

/**
 * Create a new instance of contourFeature.
 *
 * @class
 * @alias geo.webgl.contourFeature
 * @extends geo.contourFeature
 * @param {geo.contourFeature.spec} arg
 * @returns {geo.webgl.contourFeature}
 */
var webgl_contourFeature = function (arg) {
  'use strict';

  if (!(this instanceof webgl_contourFeature)) {
    return new webgl_contourFeature(arg);
  }
  arg = arg || {};
  contourFeature.call(this, arg);

  var vgl = require('vgl');
  var transform = require('../transform');
  var util = require('../util');
  var object = require('./object');
  var fragmentShader = require('./contourFeature.frag');
  var vertexShader = require('./contourFeature.vert');

  object.call(this);

  /**
   * @private
   */
  var m_this = this,
      s_exit = this._exit,
      m_textureUnit = 7,
      m_actor = null,
      m_mapper = null,
      m_material = null,
      m_texture = null,
      m_minColorUniform = null,
      m_maxColorUniform = null,
      m_stepsUniform = null,
      m_steppedUniform = null,
      m_dynamicDraw = arg.dynamicDraw === undefined ? false : arg.dynamicDraw,
      s_init = this._init,
      s_update = this._update;

  function createVertexShader() {
    var shader = new vgl.shader(vgl.GL.VERTEX_SHADER);
    shader.setShaderSource(vertexShader);
    return shader;
  }

  function createFragmentShader() {
    var shader = new vgl.shader(vgl.GL.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShader);
    return shader;
  }

  /* Create the contours.  This calls the base class to generate the geometry,
   * color map, and other parameters.  The generated geoemtry is then loaded
   * into the various gl uniforms and buffers.
   */
  function createGLContours() {
    var contour = m_this._createContours(),
        numPts = contour.elements.length,
        colorTable = [],
        i, i3, j, j3,
        posBuf, opacityBuf, valueBuf, indicesBuf,
        geom = m_mapper.geometryData();

    m_minColorUniform.set([
      contour.minColor.r,
      contour.minColor.g,
      contour.minColor.b,
      contour.minColor.a]);
    m_maxColorUniform.set([
      contour.maxColor.r,
      contour.maxColor.g,
      contour.maxColor.b,
      contour.maxColor.a]);
    m_stepsUniform.set(contour.colorMap.length);
    m_steppedUniform.set(contour.stepped);
    // pad the colortable by repeating the end colors an extra time to ensure
    // interpolation never goes off of the colormap.
    for (i = -1; i < contour.colorMap.length + 1; i += 1) {
      j = Math.max(0, Math.min(contour.colorMap.length - 1, i));
      colorTable.push(contour.colorMap[j].r * 255);
      colorTable.push(contour.colorMap[j].g * 255);
      colorTable.push(contour.colorMap[j].b * 255);
      colorTable.push(contour.colorMap[j].a * 255);
    }
    m_texture.setColorTable(colorTable);
    contour.pos = transform.transformCoordinates(
      m_this.gcs(), m_this.layer().map().gcs(), contour.pos, 3);
    posBuf = util.getGeomBuffer(geom, 'pos', numPts * 3);
    opacityBuf = util.getGeomBuffer(geom, 'opacity', numPts);
    valueBuf = util.getGeomBuffer(geom, 'value', numPts);
    for (i = i3 = 0; i < numPts; i += 1, i3 += 3) {
      j = contour.elements[i];
      j3 = j * 3;
      posBuf[i3] = contour.pos[j3];
      posBuf[i3 + 1] = contour.pos[j3 + 1];
      posBuf[i3 + 2] = contour.pos[j3 + 2];
      opacityBuf[i] = contour.opacity[j];
      valueBuf[i] = contour.value[j];
    }
    indicesBuf = geom.primitive(0).indices();
    if (!(indicesBuf instanceof Uint16Array) || indicesBuf.length !== numPts) {
      indicesBuf = new Uint16Array(numPts);
      geom.primitive(0).setIndices(indicesBuf);
    }
    geom.boundsDirty(true);
    m_mapper.modified();
    m_mapper.boundsDirtyTimestamp().modified();
  }

  /**
   * Initialize.
   *
   * @param {geo.contourFeature.spec} arg The contour feature specification.
   */
  this._init = function (arg) {
    var blend = vgl.blend(),
        prog = vgl.shaderProgram(),
        mat = vgl.material(),
        tex = vgl.lookupTable(),
        geom = vgl.geometryData(),
        modelViewUniform = new vgl.modelViewUniform('modelViewMatrix'),
        projectionUniform = new vgl.projectionUniform('projectionMatrix'),
        samplerUniform = new vgl.uniform(vgl.GL.INT, 'sampler2d'),
        vertexShader = createVertexShader(),
        fragmentShader = createFragmentShader(),
        posAttr = vgl.vertexAttribute('pos'),
        valueAttr = vgl.vertexAttribute('value'),
        opacityAttr = vgl.vertexAttribute('opacity'),
        sourcePositions = vgl.sourceDataP3fv({'name': 'pos'}),
        sourceValues = vgl.sourceDataAnyfv(
          1, vgl.vertexAttributeKeysIndexed.One, {'name': 'value'}),
        sourceOpacity = vgl.sourceDataAnyfv(
          1, vgl.vertexAttributeKeysIndexed.Two, {'name': 'opacity'}),
        primitive = new vgl.triangles();

    s_init.call(m_this, arg);
    m_mapper = vgl.mapper({dynamicDraw: m_dynamicDraw});

    prog.addVertexAttribute(posAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(valueAttr, vgl.vertexAttributeKeysIndexed.One);
    prog.addVertexAttribute(opacityAttr, vgl.vertexAttributeKeysIndexed.Two);

    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);
    m_minColorUniform = new vgl.uniform(vgl.GL.FLOAT_VEC4, 'minColor');
    prog.addUniform(m_minColorUniform);
    m_maxColorUniform = new vgl.uniform(vgl.GL.FLOAT_VEC4, 'maxColor');
    prog.addUniform(m_maxColorUniform);
    /* steps is always an integer, but it is more efficient if we use a float
     */
    m_stepsUniform = new vgl.uniform(vgl.GL.FLOAT, 'steps');
    prog.addUniform(m_stepsUniform);
    m_steppedUniform = new vgl.uniform(vgl.GL.BOOL, 'stepped');
    prog.addUniform(m_steppedUniform);

    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);

    prog.addUniform(samplerUniform);
    tex.setTextureUnit(m_textureUnit);
    samplerUniform.set(m_textureUnit);

    m_material = mat;
    m_material.addAttribute(prog);
    m_material.addAttribute(blend);
    m_texture = tex;
    m_material.addAttribute(m_texture);

    m_actor = vgl.actor();
    m_actor.setMaterial(m_material);
    m_actor.setMapper(m_mapper);

    geom.addSource(sourcePositions);
    geom.addSource(sourceValues);
    geom.addSource(sourceOpacity);
    geom.addPrimitive(primitive);
    /* We don't need vgl to comptue bounds, so make the geo.computeBounds just
     * set them to 0. */
    geom.computeBounds = function () {
      geom.setBounds(0, 0, 0, 0, 0, 0);
    };
    m_mapper.setGeometryData(geom);
  };

  /**
   * Build.
   */
  this._build = function () {
    if (m_actor) {
      m_this.renderer().contextRenderer().removeActor(m_actor);
    }

    createGLContours();

    m_this.renderer().contextRenderer().addActor(m_actor);
    m_this.buildTime().modified();
  };

  /**
   * Update.
   */
  this._update = function () {
    s_update.call(m_this);

    if (m_this.dataTime().timestamp() >= m_this.buildTime().timestamp() ||
        m_this.updateTime().timestamp() <= m_this.timestamp()) {
      m_this._build();
    }

    m_actor.setVisible(m_this.visible());
    m_actor.material().setBinNumber(m_this.bin());
    m_this.updateTime().modified();
  };

  /**
   * Destroy.
   */
  this._exit = function () {
    m_this.renderer().contextRenderer().removeActor(m_actor);
    s_exit();
  };

  this._init(arg);
  return this;
};

inherit(webgl_contourFeature, contourFeature);

// Now register it
registerFeature('webgl', 'contour', webgl_contourFeature);

module.exports = webgl_contourFeature;
