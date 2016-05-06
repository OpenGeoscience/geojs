var $ = require('jquery');
var inherit = require('./inherit');
var feature = require('./feature');
var transform = require('./transform');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class heatmapFeature
 *
 * @class
 * @param {Object} arg Options object
 * @extends geo.feature
 * @param {Object|string|Function} [color] Color transfer function that.
 *   will be used to evaluate color of each pixel using normalized intensity
 *   as the look up value.
 * @param {number|Function} [opacity=1] Homogeneous opacity for each pixel.
 * @param {Object|Function} [radius=10] Radius of a point in terms of number
 *   of pixels.
 * @param {Object|Function} [blurRadius=10] Gaussian blur radius for each
 *   point in terms of number of pixels.
 * @param {Object|Function} [position] Position of the data.  Default is
 *   (data). The position is an Object which specifies the location of the
 *   data in geo-spatial context.
 * @param {boolean} [intensity] Scalar value of each data point. Scalar
 *   value must be a positive real number and will be used to compute
 *   the weight for each data point.
 * @param {boolean} [maxIntensity=null] Maximum intensity of the data. Maximum
 *   intensity must be a positive real number and will be used to normalize all
 *   intensities with a dataset. If no value is given, then a it will
 *   be computed.
 * @param {boolean} [minIntensity=null] Minimum intensity of the data. Minimum
 *   intensity must be a positive real number will be used to normalize all
 *   intensities with a dataset. If no value is given, then a it will
 *   be computed.
 * @param {number} [updateDelay=1000] Delay in milliseconds after a zoom,
 *   rotate, or pan event before recomputing the heatmap.
 * @returns {geo.heatmapFeature}
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
var heatmapFeature = function (arg) {
  'use strict';
  if (!(this instanceof heatmapFeature)) {
    return new heatmapFeature(arg);
  }
  arg = arg || {};
  feature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_position,
      m_intensity,
      m_maxIntensity,
      m_minIntensity,
      m_updateDelay,
      m_gcsPosition,
      s_init = this._init;

  m_position = arg.position || function (d) { return d; };
  m_intensity = arg.intensity || function (d) { return 1; };
  m_maxIntensity = arg.maxIntensity !== undefined ? arg.maxIntensity : null;
  m_minIntensity = arg.minIntensity !== undefined ? arg.minIntensity : null;
  m_updateDelay = arg.updateDelay ? parseInt(arg.updateDelay, 10) : 1000;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set maxIntensity
   *
   * @returns {geo.heatmap}
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
   * @returns {geo.heatmap}
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
   * @returns {geo.heatmap}
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
   * Get/Set position accessor
   *
   * @returns {geo.heatmap}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.position = function (val) {
    if (val === undefined) {
      return m_position;
    } else {
      m_position = val;
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get pre-computed gcs position accessor
   *
   * @returns {geo.heatmap}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.gcsPosition = function () {
    this._update();
    return m_gcsPosition;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set intensity
   *
   * @returns {geo.heatmap}
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
          opacity: 0.1,
          radius: 10,
          blurRadius: 10,
          color: {0:    {r: 0, g: 0, b: 0.0, a: 0.0},
                  0.25: {r: 0, g: 0, b: 1, a: 0.5},
                  0.5:  {r: 0, g: 1, b: 1, a: 0.6},
                  0.75: {r: 1, g: 1, b: 0, a: 0.7},
                  1:    {r: 1, g: 0, b: 0, a: 0.8}}
        },
      arg.style === undefined ? {} : arg.style
    );

    m_this.style(defaultStyle);

    if (m_position) {
      m_this.dataTime().modified();
    }
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
        position = [],
        setMax = (m_maxIntensity === null || m_maxIntensity === undefined),
        setMin = (m_minIntensity === null || m_minIntensity === undefined);

    data.forEach(function (d) {
      position.push(m_this.position()(d));
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
        m_this.gcs(), m_this.layer().map().gcs(), position);

    m_this.buildTime().modified();
    return m_this;
  };

  this._init(arg);
  return this;
};

inherit(heatmapFeature, feature);
module.exports = heatmapFeature;
