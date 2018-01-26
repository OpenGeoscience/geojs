var vtk = require('vtk.js');
var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var pointFeature = require('../pointFeature');

var vtkActor = vtk.Rendering.Core.vtkActor;// = require('vtk.js/Sources/Rendering/Core/Actor');
var vtkMapper = vtk.Rendering.Core.vtkMapper;// = require('vtk.js/Sources/Rendering/Core/Mapper');
var vtkSphereSource = vtk.Filters.Sources.vtkSphereSource;// = require('vtk.js/Sources/Filters/Sources/SphereSource');
// var vtkPlaneSource = vtk.Filters.Sources.vtkPlaneSource;// = require('vtk.js/Sources/Filters/Sources/PlaneSource');

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
      m_actors = [],
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
    var i, j, i3, posVal, posFunc,
        radius, radiusVal, nonzeroZ,
        numPts = m_this.data().length,
        position = new Array(numPts * 3),
        data = m_this.data(),
        posFunc = m_this.position(),
        radFunc = m_this.style.get('radius');

    if (m_actors) {
      m_this.renderer().contextRenderer().removeActor(m_actors);
    }

     /* It is more efficient to do a transform on a single array rather than on
     * an array of arrays or an array of objects. */
    for (i = i3 = 0; i < numPts; i += 1, i3 += 3)
    {
      posVal = posFunc(data[i]);
      position[i3] = posVal.x;
      position[i3 + 1] = posVal.y;
      position[i3 + 2] = posVal.z || 0;
      nonzeroZ = nonzeroZ || position[i3 + 2];
    }
    position = transform.transformCoordinates(
                  m_this.gcs(), m_this.layer().map().gcs(),
                  position, 3);

    if (!nonzeroZ && m_this.gcs() !== m_this.layer().map().gcs()) {
      for (i = i3 = 0; i < numPts; i += 1, i3 += 3) {
        position[i3 + 2] = 0;
      }
    }
    /* Some transforms modify the z-coordinate.  If we started with all zero z
     * coordinates, don't modify them.  This could be changed if the
     * z-coordinate space of the gl cube is scaled appropriately. */
    for (i = i3 = 0; i < numPts; i += 1, i3 += 3) {
      var source = vtkSphereSource.newInstance();
      source.setCenter(position[i3], position[i3 + 1], position[i3 + 2]);
      source.setRadius(100000.0);
      var actor = vtkActor.newInstance();
      var mapper = vtkMapper.newInstance();
      actor.getProperty().setEdgeVisibility(true);
      mapper.setInputConnection(source.getOutputPort());
      actor.setMapper(mapper);
      m_this.renderer().contextRenderer().addActor(actor);
      m_actors.push(actor);
    }
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
    m_this.renderer().contextRenderer().removeActor(m_actors);
    s_exit();
  };

  m_this._init();
  return this;
};

inherit(vtkjs_pointFeature, pointFeature);

// Now register it
registerFeature('vtkjs', 'point', vtkjs_pointFeature);

module.exports = vtkjs_pointFeature;
