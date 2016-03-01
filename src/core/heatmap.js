//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class heatmap
 *
 * @class
 * @extends geo.feature
 * @returns {geo.heatmap}
 *
 */
//////////////////////////////////////////////////////////////////////////////
geo.heatmap = function (arg) {
  'use strict';
  if (!(this instanceof geo.heatmap)){
    return new geo.heatmap(arg);
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
        color: {.25: {r: 0, g: 0, b: 1}, .5: {r: 0, g: 1, b: 1}, .75: {r: 1, g: 1, b: 0}, 1: {r: 1, g: 0, b: 0}}
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

inherit(geo.heatmap, geo.feature)
