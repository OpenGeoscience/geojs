//////////////////////////////////////////////////////////////////////////////
/**
 * @namespace geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class polygonFeature
 *
 * @class
 * @returns {geo.polygonFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.polygonFeature = function (arg) {
  "use strict";
  if (!(this instanceof geo.polygonFeature)) {
    return new geo.polygonFeature(arg);
  }
  arg = arg || {};
  geo.feature.call(this, arg);

  var m_this = this,
      s_init = this._init;

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
        "color": [1.0, 1.0, 1.0],
        "fill_color": [1.0, 1.0, 1.0],
        "fill": true
      },
      arg.style === undefined ? {} : arg.style
    );

    m_this.style(defaultStyle);
  };

  m_this._init(arg);
  return m_this;
};

inherit(geo.polygonFeature, geo.feature);
