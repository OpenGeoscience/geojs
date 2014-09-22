//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class pointFeature
 *
 * @class
 * @returns {geo.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.pointFeature = function (arg) {
  "use strict";
  if (!(this instanceof geo.pointFeature)) {
    return new geo.pointFeature(arg);
  }
  arg = arg || {};
  geo.feature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_position = arg.position === undefined ? null : arg.position,
      s_init = this._init;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set position
   *
   * @returns {geo.pointFeature}
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
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);

    var defaultStyle = $.extend(
      {},
      {
        radius: function () { return 10.0; },
        stroke: function () { return 1.0; },
        strokeColor: function () { return [0.0, 1.0, 0.0]; },
        strokeWidth: function () { return 2.0; },
        strokeOpacity: function () { return 1.0; },
        fillColor: function () { return [1.0, 0.0, 0.0]; },
        fill: function () { return 1.0; },
        fillOpacity: function () { return 1.0; },
        sprites: false,
        sprites_image: null
      },
      arg.style === undefined ? {} : arg.style
    );

    m_this.style(defaultStyle);

    if (m_position) {
      m_this.dataTime().modified();
    }
  };

  return m_this;
};

inherit(geo.pointFeature, geo.feature);
