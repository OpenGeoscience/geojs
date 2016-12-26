var vtkjs = require('vtk.js');
var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var pointFeature = require('../pointFeature');


var vtkActor = require('vtk.js/Sources/Rendering/Core/Actor');
var vtkMapper = require('vtk.js/Sources/Rendering/Core/Mapper');
var vtkSphereSource = require('vtk.js/Sources/Filters/Sources/SphereSource');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointFeature
 *
 * @class geo.vtkjs.pointFeature
 * @extends geo.pointFeature
 * @returns {geo.vtkjs.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
var vtkjs_pointFeature = function (arg) {
  'use strict';
  if (!(this instanceof vtkjs_pointFeature)) {
    return new vtkjs_pointFeature(arg);
  }
  arg = arg || {};
  pointFeature.call(this, arg);

  var transform = require('../transform');
  var util = require('../util');
  var object = require('../object');

  object.call(this);

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
      m_primitiveShape = 'sprite', // arg can change this, below
      s_init = this._init,
      s_update = this._update,
      vertexShaderSource = null,
      fragmentShaderSource = null;

  function createVertexShader() {
    // TODO
  }

  function createFragmentShader() {
    // TODO
  }

  function pointPolygon(x, y, w, h) {
  }

  function createGLPoints() {
    // TODO
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return list of actors
   *
   * @returns {vgl.actor[]}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.actors = function () {
    // if (!m_actor) {
    //   return [];
    // }
    // return [m_actor];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the number of vertices used for each point.
   *
   * @returns {Number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.verticesPerFeature = function () {
    // var unit = pointPolygon(0, 0, 1, 1);
    // return unit.length / 2;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
    // var prog = vgl.shaderProgram(),
    //     vertexShader = createVertexShader(),
    //     fragmentShader = createFragmentShader(),
    //     posAttr = vgl.vertexAttribute('pos'),
    //     unitAttr = vgl.vertexAttribute('unit'),
    //     radAttr = vgl.vertexAttribute('rad'),
    //     strokeWidthAttr = vgl.vertexAttribute('strokeWidth'),
    //     fillColorAttr = vgl.vertexAttribute('fillColor'),
    //     fillAttr = vgl.vertexAttribute('fill'),
    //     strokeColorAttr = vgl.vertexAttribute('strokeColor'),
    //     strokeAttr = vgl.vertexAttribute('stroke'),
    //     fillOpacityAttr = vgl.vertexAttribute('fillOpacity'),
    //     strokeOpacityAttr = vgl.vertexAttribute('strokeOpacity'),
    //     modelViewUniform = new vgl.modelViewUniform('modelViewMatrix'),
    //     projectionUniform = new vgl.projectionUniform('projectionMatrix'),
    //     mat = vgl.material(),
    //     blend = vgl.blend(),
    //     geom = vgl.geometryData(),
    //     sourcePositions = vgl.sourceDataP3fv({'name': 'pos'}),
    //     sourceUnits = vgl.sourceDataAnyfv(
    //         2, vgl.vertexAttributeKeysIndexed.One, {'name': 'unit'}),
    //     sourceRadius = vgl.sourceDataAnyfv(
    //         1, vgl.vertexAttributeKeysIndexed.Two, {'name': 'rad'}),
    //     sourceStrokeWidth = vgl.sourceDataAnyfv(
    //         1, vgl.vertexAttributeKeysIndexed.Three, {'name': 'strokeWidth'}),
    //     sourceFillColor = vgl.sourceDataAnyfv(
    //         3, vgl.vertexAttributeKeysIndexed.Four, {'name': 'fillColor'}),
    //     sourceFill = vgl.sourceDataAnyfv(
    //         1, vgl.vertexAttributeKeysIndexed.Five, {'name': 'fill'}),
    //     sourceStrokeColor = vgl.sourceDataAnyfv(
    //         3, vgl.vertexAttributeKeysIndexed.Six, {'name': 'strokeColor'}),
    //     sourceStroke = vgl.sourceDataAnyfv(
    //         1, vgl.vertexAttributeKeysIndexed.Seven, {'name': 'stroke'}),
    //     sourceAlpha = vgl.sourceDataAnyfv(
    //         1, vgl.vertexAttributeKeysIndexed.Eight, {'name': 'fillOpacity'}),
    //     sourceStrokeOpacity = vgl.sourceDataAnyfv(
    //         1, vgl.vertexAttributeKeysIndexed.Nine, {'name': 'strokeOpacity'}),
    //     primitive = new vgl.triangles();

    // if (m_primitiveShape === 'sprite') {
    //   primitive = new vgl.points();
    // }

    // m_pixelWidthUniform = new vgl.floatUniform('pixelWidth',
    //                         2.0 / m_this.renderer().width());
    // m_aspectUniform = new vgl.floatUniform('aspect',
    //                     m_this.renderer().width() / m_this.renderer().height());

    // s_init.call(m_this, arg);
    // m_mapper = vgl.mapper({dynamicDraw: m_dynamicDraw});

    // // TODO: Right now this is ugly but we will fix it.
    // prog.addVertexAttribute(posAttr, vgl.vertexAttributeKeys.Position);
    // if (m_primitiveShape !== 'sprite') {
    //   prog.addVertexAttribute(unitAttr, vgl.vertexAttributeKeysIndexed.One);
    // }

    // prog.addVertexAttribute(radAttr, vgl.vertexAttributeKeysIndexed.Two);
    // prog.addVertexAttribute(strokeWidthAttr, vgl.vertexAttributeKeysIndexed.Three);
    // prog.addVertexAttribute(fillColorAttr, vgl.vertexAttributeKeysIndexed.Four);
    // prog.addVertexAttribute(fillAttr, vgl.vertexAttributeKeysIndexed.Five);
    // prog.addVertexAttribute(strokeColorAttr, vgl.vertexAttributeKeysIndexed.Six);
    // prog.addVertexAttribute(strokeAttr, vgl.vertexAttributeKeysIndexed.Seven);
    // prog.addVertexAttribute(fillOpacityAttr, vgl.vertexAttributeKeysIndexed.Eight);
    // prog.addVertexAttribute(strokeOpacityAttr, vgl.vertexAttributeKeysIndexed.Nine);

    // prog.addUniform(m_pixelWidthUniform);
    // prog.addUniform(m_aspectUniform);
    // prog.addUniform(modelViewUniform);
    // prog.addUniform(projectionUniform);

    // prog.addShader(fragmentShader);
    // prog.addShader(vertexShader);

    // mat.addAttribute(prog);
    // mat.addAttribute(blend);

    // m_actor = vgl.actor();
    // m_actor.setMaterial(mat);
    // m_actor.setMapper(m_mapper);

    // geom.addSource(sourcePositions);
    // geom.addSource(sourceUnits);
    // geom.addSource(sourceRadius);
    // geom.addSource(sourceStrokeWidth);
    // geom.addSource(sourceFillColor);
    // geom.addSource(sourceFill);
    // geom.addSource(sourceStrokeColor);
    // geom.addSource(sourceStroke);
    // geom.addSource(sourceAlpha);
    // geom.addSource(sourceStrokeOpacity);
    // geom.addPrimitive(primitive);
    // m_mapper.setGeometryData(geom);
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

    const sphereSource = vtkSphereSource.newInstance();
    const actor = vtkActor.newInstance();
    const mapper = vtkMapper.newInstance();
    actor.getProperty().setEdgeVisibility(true);
    mapper.setInputConnection(sphereSource.getOutputPort());
    actor.setMapper(mapper);
    m_this.renderer().contextRenderer().addActor(actor);
    m_actor = actor;
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

    // // Update uniforms
    // m_pixelWidthUniform.set(2.0 / m_this.renderer().width());
    // m_aspectUniform.set(m_this.renderer().width() /
    //                     m_this.renderer().height());

    // m_actor.setVisible(m_this.visible());
    // m_actor.material().setBinNumber(m_this.bin());

    m_this.updateTime().modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Destroy
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    // m_this.renderer().contextRenderer().removeActor(m_actor);
    s_exit();
  };

  m_this._init();
  return this;
};

inherit(vtkjs_pointFeature, pointFeature);

// Now register it
registerFeature('vtkjs', 'point', vtkjs_pointFeature);

module.exports = vtkjs_pointFeature;
