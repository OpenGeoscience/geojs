//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
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

  var s_init = this._init;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(this, arg);
    var defaultStyle = $.extend(
      {},
      {
        "color": [1.0, 1.0, 1.0],
        "fill_color": [1.0, 1.0, 1.0],
        "fill": true
      },
      arg.style === undefined ? {} : arg.style
    );

    this.style(defaultStyle);
  };

  this._init(arg);
  return this;
};

inherit(geo.polygonFeature, geo.feature);
