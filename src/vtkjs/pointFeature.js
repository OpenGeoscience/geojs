var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var pointFeature = require('../pointFeature');

/**
 * Create a new instance of pointFeature
 *
 * @class geo.vtkjs.pointFeature
 * @extends geo.pointFeature
 * @returns {geo.vtkjs.pointFeature}
 */
var vtkjs_pointFeature = function (arg) {
  'use strict';
  if (!(this instanceof vtkjs_pointFeature)) {
    return new vtkjs_pointFeature(arg);
  }
  arg = arg || {};
  pointFeature.call(this, arg);

  var transform = require('../transform');
  var object = require('../object');
  var vtk = require('./vtkjsRenderer').vtkjs;
  var vtkActor = vtk.Rendering.Core.vtkActor;
  var vtkMapper = vtk.Rendering.Core.vtkGlyph3DMapper;
  var vtkPointSet = vtk.Common.DataModel.vtkPointSet;
  var vtkSphereSource = vtk.Filters.Sources.vtkSphereSource;

  object.call(this);

  /**
   * Member variables
   *
   * @private
   */
  var m_this = this,
      s_exit = this._exit,
      m_actor = null,
      m_pointSet = null,
      m_source = null,
      s_update = this._update;

  /**
   * Create pipeline
   */
  this._createPipeline = function () {
    m_pointSet = vtkPointSet.newInstance();
    m_source = vtkSphereSource.newInstance();
    m_source.setThetaResolution(30);
    m_source.setPhiResolution(30);
    var mapper = vtkMapper.newInstance();
    mapper.setInputData(m_pointSet, 0);
    mapper.setInputConnection(m_source.getOutputPort(), 1);
    m_actor = vtkActor.newInstance();
    m_actor.setMapper(mapper);
    this.renderer().contextRenderer().addActor(m_actor);
  };

  /**
   * Initialize
   */
  this._init = function () {
    m_this.renderer().contextRenderer().setLayer(1);
    this._createPipeline();
  };

  /**
   * Build this feature
   */
  this._build = function () {
    var i, i3, posVal,
        nonzeroZ,
        numPts = m_this.data().length,
        position = new Array(numPts * 3),
        data = m_this.data(),
        posFunc = m_this.position(),
        radFunc = m_this.style.get('radius'),
        colorFunc = m_this.style.get('fillColor'),
        opacityFunc = m_this.style.get('fillOpacity');

    /* It is more efficient to do a transform on a single array rather than on
      * an array of arrays or an array of objects. */
    for (i = i3 = 0; i < numPts; i += 1, i3 += 3) {
      posVal = posFunc(data[i]);
      position[i3] = posVal.x;
      position[i3 + 1] = posVal.y;
      position[i3 + 2] = posVal.z || 0;
      nonzeroZ = nonzeroZ || position[i3 + 2];
      m_actor.getProperty().setOpacity(opacityFunc(data[i]));
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
    m_pointSet.getPoints().setData(position, 3);
    m_source.setRadius(radFunc());
    m_actor.getProperty().setColor(colorFunc()['r'],
                                   colorFunc()['g'],
                                   colorFunc()['b']);
    m_this.buildTime().modified();

    console.debug('built vtkjs point feature');
  };

  /**
   * Update
   *
   */
  this._update = function () {

    s_update.call(m_this);

    if (m_this.dataTime().getMTime() >= m_this.buildTime().getMTime() ||
        m_this.updateTime().getMTime() < m_this.getMTime()) {
      m_this._build();
    }

    m_this.updateTime().modified();
  };

  /**
   * Destroy
   */
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
