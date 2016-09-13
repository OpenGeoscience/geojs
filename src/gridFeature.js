var $ = require('jquery');
var inherit = require('./inherit');
var feature = require('./feature');
var transform = require('./transform');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class gridFeature
 *
 * @class geo.gridFeature
 * @param {Object} arg Options object
 * @extends geo.feature
 * @param {Object|Function} [intensity] Scalar value of each data point. Scalar
 *   value must be a positive real number and will be used to compute
 *   the weight for each data point.
 * @param {number} [maxIntensity=null] Maximum intensity of the data. Maximum
 *   intensity must be a positive real number and will be used to normalize all
 *   intensities with a dataset. If no value is given, then a it will
 *   be computed.
 * @param {number} [minIntensity=null] Minimum intensity of the data. Minimum
 *   intensity must be a positive real number will be used to normalize all
 *   intensities with a dataset. If no value is given, then a it will
 *   be computed.
 * @param {number} [updateDelay=1000] Delay in milliseconds after a zoom,
 *   rotate, or pan event before recomputing the grid.
 * @param {Object|string|Function} [style.color] Color transfer function that.
 *   will be used to evaluate color of each pixel using normalized intensity
 *   as the look up value.
 * @param {Array} upperLeft Coordinates of the first intensity datum.
 * @param {Number} cellSize The length of a cell side in meters.
 * @param {Number} rowCount The number of rows used in the grid matrix.
 * @returns {geo.gridFeature}
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
var gridFeature = function (arg) {
  'use strict';
  if (!(this instanceof gridFeature)) {
    return new gridFeature(arg);
  }
  arg = arg || {};
  feature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_intensity,
      m_maxIntensity,
      m_minIntensity,
      m_updateDelay,
      m_gcsPosition,
      m_upperLeft,
      m_rowCount,
      m_cellSize, //measured in meters
      s_init = this._init;

  m_intensity = arg.intensity || function (d) { return 1; };
  m_maxIntensity = arg.maxIntensity !== undefined ? arg.maxIntensity : null;
  m_minIntensity = arg.minIntensity !== undefined ? arg.minIntensity : null;
  m_updateDelay = arg.updateDelay ? parseInt(arg.updateDelay, 10) : 1000;
  m_upperLeft = arg.upperLeft || [-90, -180];
  m_rowCount = arg.rowCount || 0;
  m_cellSize = arg.cellSize || 1000;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set maxIntensity
   *
   * @returns {geo.grid}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.maxIntensity = function (val) {
    if (val === undefined) {
      return m_maxIntensity;
    } else {
      m_maxIntensity = val;
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set maxIntensity
   *
   * @returns {geo.grid}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.minIntensity = function (val) {
    if (val === undefined) {
      return m_minIntensity;
    } else {
      m_minIntensity = val;
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set updateDelay
   *
   * @returns {geo.grid}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateDelay = function (val) {
    if (val === undefined) {
      return m_updateDelay;
    } else {
      m_updateDelay = parseInt(val, 10);
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set upperLeft
   *
   * @returns {geo.grid}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.upperLeft = function (val) {
    if (val === undefined) {
      return m_upperLeft;
    } else {
      m_upperLeft = val;
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set rowCount
   *
   * @returns {geo.grid}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.rowCount = function (val) {
    if (val === undefined) {
      return m_rowCount;
    } else {
      m_rowCount = val;
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set cellSize
   *
   * @returns {geo.grid}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.cellSize = function (val) {
    if (val === undefined) {
      return m_cellSize;
    } else {
      m_cellSize = val;
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set intensity
   *
   * @returns {geo.grid}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.intensity = function (val) {
    if (val === undefined) {
      return m_intensity;
    } else {
      m_intensity = val;
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);

    var defaultStyle = $.extend(
      {},
      {
        color: {0:    {r: 0, g: 0, b: 0.0, a: 0.0},
                0.25: {r: 0, g: 0, b: 1, a: 0.5},
                0.5:  {r: 0, g: 1, b: 1, a: 0.6},
                0.75: {r: 1, g: 1, b: 0, a: 0.7},
                1:    {r: 1, g: 0, b: 0, a: 0.8}}
      },
      arg.style === undefined ? {} : arg.style
    );

    m_this.style(defaultStyle);
    m_this.dataTime().modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get pre-computed gcs position accessor
   *
   * @returns {geo.gridFeature}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.gcsPosition = function () {
    this._update();
    return m_gcsPosition;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function () {
    var data = m_this.data(),
        intensity = null,
        setMax = (m_maxIntensity === null || m_maxIntensity === undefined),
        setMin = (m_minIntensity === null || m_minIntensity === undefined);

    data.forEach(function (d) {
      if (setMax || setMin) {
        intensity = m_this.intensity()(d);
        if (m_maxIntensity === null || m_maxIntensity === undefined) {
          m_maxIntensity = intensity;
        }
        if (m_minIntensity === null || m_minIntensity === undefined) {
          m_minIntensity = intensity;
        }
        if (setMax && intensity > m_maxIntensity) {
          m_maxIntensity = intensity;
        }
        if (setMin && intensity < m_minIntensity) {
          m_minIntensity = intensity;
        }

      }
    });
    if (setMin && setMax && m_minIntensity === m_maxIntensity) {
      m_minIntensity -= 1;
    }
    m_gcsPosition = transform.transformCoordinates(
        m_this.gcs(), m_this.layer().map().gcs(), m_upperLeft);

    m_this.buildTime().modified();
    return m_this;
  };

  this._init(arg);
  return this;
};

inherit(gridFeature, feature);
module.exports = gridFeature;
