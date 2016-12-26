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
      s_update = this._update;


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
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

    console.debug("built vtkjs point feature");
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
        m_this.updateTime().getMTime() < m_this.getMTime()) {
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
    s_exit();
  };

  m_this._init();
  return this;
};

inherit(vtkjs_pointFeature, pointFeature);

// Now register it
registerFeature('vtkjs', 'point', vtkjs_pointFeature);

module.exports = vtkjs_pointFeature;
