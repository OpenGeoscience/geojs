/**
 * Create a new instance of meshColored.
 *
 * @class
 * @alias geo.webgl.meshColored
 * @param {geo.meshColored.spec} arg
 * @returns {geo.webgl.meshColored}
 */
var webgl_meshColored = function (arg) {
  'use strict';

  arg = arg || {};

  var vgl = require('vgl');
  var transform = require('../transform');
  var util = require('../util');
  var fragmentShader = require('./meshColored.frag');
  var vertexShader = require('./meshColored.vert');

  var object = require('./object');
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
      m_origin,
      m_modelViewUniform,
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

  /**
   * Create the colored mesh.  The generated geometry is loaded into the
   * various gl uniforms and buffers.
   *
   * @param {geo.meshFeature.meshColoredInfo} mesh The mesh to draw.
   */
  this.createGLMeshColored = function (mesh) {
    var numPts = mesh.elements.length,
        colorTable = [],
        i, i3, j, j3, e,
        posBuf, opacityBuf, valueBuf, indicesBuf,
        geom = m_mapper.geometryData();

    m_minColorUniform.set([
      mesh.minColor.r,
      mesh.minColor.g,
      mesh.minColor.b,
      mesh.minColor.a]);
    m_maxColorUniform.set([
      mesh.maxColor.r,
      mesh.maxColor.g,
      mesh.maxColor.b,
      mesh.maxColor.a]);
    m_stepsUniform.set(mesh.colorMap.length);
    m_steppedUniform.set(mesh.stepped);
    // pad the colortable by repeating the end colors an extra time to ensure
    // interpolation never goes off of the colormap.
    for (i = -1; i < mesh.colorMap.length + 1; i += 1) {
      j = Math.max(0, Math.min(mesh.colorMap.length - 1, i));
      colorTable.push(mesh.colorMap[j].r * 255);
      colorTable.push(mesh.colorMap[j].g * 255);
      colorTable.push(mesh.colorMap[j].b * 255);
      colorTable.push(mesh.colorMap[j].a * 255);
    }
    m_texture.setColorTable(colorTable);
    mesh.pos = transform.transformCoordinates(
      m_this.gcs(), m_this.layer().map().gcs(), mesh.pos, 3);
    m_origin = new Float32Array(m_this.style.get('origin')(mesh.pos));
    if (m_origin[0] || m_origin[1] || m_origin[2]) {
      for (i = 0; i < mesh.pos.length; i += 3) {
        mesh.pos[i] -= m_origin[0];
        mesh.pos[i + 1] -= m_origin[1];
        mesh.pos[i + 2] -= m_origin[2];
      }
    }
    m_modelViewUniform.setOrigin(m_origin);

    posBuf = util.getGeomBuffer(geom, 'pos', numPts * 3);
    opacityBuf = util.getGeomBuffer(geom, 'opacity', numPts);
    valueBuf = util.getGeomBuffer(geom, 'value', numPts);
    for (i = i3 = 0; i < numPts; i += 1, i3 += 3) {
      j = mesh.elements[i];
      j3 = j * 3;
      posBuf[i3] = mesh.pos[j3];
      posBuf[i3 + 1] = mesh.pos[j3 + 1];
      posBuf[i3 + 2] = mesh.pos[j3 + 2];
      e = mesh.elementValues ? Math.floor(i / 3) : j;
      opacityBuf[i] = mesh.opacity[e];
      valueBuf[i] = mesh.value[e];
    }
    indicesBuf = geom.primitive(0).indices();
    if (!(indicesBuf instanceof Uint16Array) || indicesBuf.length !== numPts) {
      indicesBuf = new Uint16Array(numPts);
      geom.primitive(0).setIndices(indicesBuf);
    }
    geom.boundsDirty(true);
    m_mapper.modified();
    m_mapper.boundsDirtyTimestamp().modified();
  };

  /**
   * Initialize.
   *
   * @param {geo.meshColored.spec} arg The contour feature specification.
   */
  this._init = function (arg) {
    var blend = vgl.blend(),
        prog = vgl.shaderProgram(),
        mat = vgl.material(),
        tex = vgl.lookupTable(),
        geom = vgl.geometryData(),
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
    m_modelViewUniform = new vgl.modelViewOriginUniform('modelViewMatrix');

    s_init.call(m_this, arg);
    m_mapper = vgl.mapper({dynamicDraw: m_dynamicDraw});

    prog.addVertexAttribute(posAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(valueAttr, vgl.vertexAttributeKeysIndexed.One);
    prog.addVertexAttribute(opacityAttr, vgl.vertexAttributeKeysIndexed.Two);

    prog.addUniform(m_modelViewUniform);
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
    /* We don't need vgl to compute bounds, so make the geo.computeBounds just
     * set them to 0. */
    geom.computeBounds = function () {
      geom.setBounds(0, 0, 0, 0, 0, 0);
    };
    m_mapper.setGeometryData(geom);
  };

  /**
   * List vgl actors.
   *
   * @returns {vgl.actor[]} The list of actors.
   */
  this.actors = function () {
    return m_actor ? [m_actor] : [];
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

  return this;
};

module.exports = webgl_meshColored;
