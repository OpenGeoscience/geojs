//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class heatmapFeature
 *
 * @class
 * @extends geo.feature
 * @returns {geo.heatmapFeature}
 *
 */

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class heatmapFeature
 *
 * @class
 * @param {Object} arg Options object
 * @extends geo.feature
 * @param {Object|string|Function} [color] Color transfer function that.
 *   will be used to evaluate color of each pixel using normalized intensity
*    as the look up value.
 * @param {number|Function} [opacity=1] Opacity for each pixel. 
 * @param {Object|Function} [radius=10] Radius of a point in terms of number
*    of pixels.
 * @param {Object|Function} [blurRadius=10] Gaussian blur radius.
 * @param {Object|Function} [position] Position of the data.  Default is
 *   (data).  The position is an Object which specifies the location of the
 *   data in geo-spatial context.
 * @param {boolean} [intensity] Scalar value that of each data point. Scalar
 *   value will be used to compute the weight for each data point for the final
 *   computation of its opacity.
 * @param {boolean} [maxIntensity=1] Maximum intensity of the data. Maximum
 * intensity will be used to normalize all intensities with a dataset.
 * @returns {geo.heatmapFetures}
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
geo.heatmapFeature = function (arg) {
  'use strict';
  if (!(this instanceof geo.heatmapFeature)){
    return new geo.heatmapFeature(arg);
  }
  arg = arg || {};
  geo.feature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_position,
      m_intensity,
      m_maxIntensity,
      s_init = this._init,
      s_data = this.data;

  m_position = arg.position || function (d) { return d; };
  m_intensity = arg.intensity || function (d) { return 1; };
  m_maxIntensity = arg.maxIntensity || 1;

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
        opacity: 1,
        radius: 10,
        blurRadius: 10,
        blur: 'Gaussian',
        color: {.25: {r: 0, g: 0, b: 1},
                .5: {r: 0, g: 1, b: 1},
                .75: {r: 1, g: 1, b: 0},
                1: {r: 1, g: 0, b: 0}},
        maxIntensity: 1
      },
      arg.style === undefined ? {} : arg.style
    );

    m_this.style(defaultStyle);

    if (m_position) {
      m_this.dataTime().modified();
    }
  };

  this._init(arg);
  return this;

};

inherit(geo.heatmapFeature, geo.feature)
