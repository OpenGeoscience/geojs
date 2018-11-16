var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var pointFeature = require('../pointFeature');

/**
 * Create a new instance of vtkjs.pointFeature.
 *
 * @class
 * @alias geo.vtkjs.pointFeature
 * @extends geo.pointFeature
 * @param {geo.pointFeature.spec} arg
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
  var vtkDataArray = vtk.Common.Core.vtkDataArray;
  var vtkGlyph3DMapper = vtk.Rendering.Core.vtkGlyph3DMapper;
  var vtkMapper = vtk.Rendering.Core.vtkMapper;
  var vtkPointSet = vtk.Common.DataModel.vtkPointSet;
  var vtkSphereSource = vtk.Filters.Sources.vtkSphereSource;

  object.call(this);

  var m_this = this,
      m_actor,
      m_pointSet,
      m_source,
      m_mappedColorArray,
      s_init = this._init,
      s_exit = this._exit,
      s_update = this._update;

  /**
   * Create pipeline.
   */
  this._createPipeline = function () {
    m_pointSet = vtkPointSet.newInstance();
    m_source = vtkSphereSource.newInstance();
    m_source.setThetaResolution(30);
    m_source.setPhiResolution(30);
    var mapper = vtkGlyph3DMapper.newInstance({
      // Orientation
      orient: false,

      // Color and Opacity
      useLookupTableScalarRange: true,
      colorByArrayName: 'color',
      scalarMode: vtkMapper.ScalarMode.USE_POINT_FIELD_DATA,

      // Scaling
      scaling: true,
      scaleArray: 'diam',
      scaleMode: vtkGlyph3DMapper.ScaleModes.SCALE_BY_MAGNITUDE
    });
    mapper.setInputData(m_pointSet, 0);
    mapper.setInputConnection(m_source.getOutputPort(), 1);
    m_actor = vtkActor.newInstance();
    m_actor.setMapper(mapper);
    m_actor.getProperty().setAmbient(1);
    this.renderer().contextRenderer().addActor(m_actor);

    // Fake the mapper lookup table to return our colors
    mapper.setLookupTable({
      mapScalars: function () {
        return {
          getNumberOfComponents: function () { return 4; },
          getData: function () { return m_mappedColorArray; }
        };
      },
      build: function () {},
      isOpaque: function () { return false; },
      getMTime: function () { return 1; },
      setRange: function () {}
    });
  };

  /**
   * Initialize.
   */
  this._init = function () {
    s_init.call(m_this, arg);
    m_this.renderer().contextRenderer().setLayer(1);
    this._createPipeline();
  };

  /**
   * Build this feature.
   */
  this._build = function () {
    var i, i3, i4, posVal, clrVal,
        nonzeroZ,
        numPts = m_this.data().length,
        position = new Array(numPts * 3),
        data = m_this.data(),
        posFunc = m_this.position(),
        radFunc = m_this.style.get('radius'),
        colorFunc = m_this.style.get('fillColor'),
        opacityFunc = m_this.style.get('fillOpacity'),
        unitsPerPixel = m_this.layer().map().unitsPerPixel(m_this.layer().map().zoom());

    const diamArray = new Float32Array(numPts);
    const colorArray = new Int32Array(numPts);
    if (!m_mappedColorArray || m_mappedColorArray.length !== numPts * 4) {
      m_mappedColorArray = new Uint8Array(numPts * 4);
    }

    /* It is more efficient to do a transform on a single array rather than on
     * an array of arrays or an array of objects. */
    for (i = i3 = i4 = 0; i < numPts; i += 1, i3 += 3, i4 += 4) {
      posVal = posFunc(data[i], i);
      position[i3] = posVal.x;
      position[i3 + 1] = posVal.y;
      position[i3 + 2] = posVal.z || 0;
      nonzeroZ = nonzeroZ || position[i3 + 2];

      diamArray[i] = radFunc(data[i], i) * unitsPerPixel * 2;
      // I'm not sure the colorArray is used other than for its size
      colorArray[i] = i;
      clrVal = colorFunc(data[i], i);
      m_mappedColorArray[i4] = clrVal.r * 255;
      m_mappedColorArray[i4 + 1] = clrVal.g * 255;
      m_mappedColorArray[i4 + 2] = clrVal.b * 255;
      m_mappedColorArray[i4 + 3] = opacityFunc(data[i], i) * 255;
    }
    position = transform.transformCoordinates(
      m_this.gcs(), m_this.layer().map().gcs(),
      position, 3);

    /* Some transforms modify the z-coordinate.  If we started with all zero z
     * coordinates, don't modify them.  This could be changed if the
     * z-coordinate space of the gl cube is scaled appropriately. */
    if (!nonzeroZ && m_this.gcs() !== m_this.layer().map().gcs()) {
      for (i = i3 = 0; i < numPts; i += 1, i3 += 3) {
        position[i3 + 2] = 0;
      }
    }

    m_pointSet.getPoints().setData(position, 3);

    // Attach fields
    m_pointSet.getPointData().addArray(vtkDataArray.newInstance({name: 'color', values: colorArray}));
    m_pointSet.getPointData().addArray(vtkDataArray.newInstance({name: 'diam', values: diamArray}));

    m_this.buildTime().modified();
  };

  /**
   * Update.
   */
  this._update = function () {
    s_update.call(m_this);

    if (m_this.dataTime().getMTime() >= m_this.buildTime().getMTime() ||
        m_this.updateTime().getMTime() < m_this.getMTime()) {
      m_this._build();
    } else {
      var data = m_this.data(),
          radFunc = m_this.style.get('radius');

      const scalingFactor = m_this.layer().map().unitsPerPixel(m_this.layer().map().zoom());
      const dataArray = m_pointSet.getPointData().getArray('diam');
      const newScaleArray = dataArray.getData().map((v, i) => radFunc(data[i], i) * scalingFactor * 2);

      dataArray.setData(newScaleArray);
      m_pointSet.modified();
    }

    m_this.updateTime().modified();
  };

  /**
   * Destroy.
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
