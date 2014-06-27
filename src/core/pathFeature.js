//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class pathFeature
 *
 * @class
 * @returns {geo.pathFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.pathFeature = function (arg) {
  "use strict";
  if (!(this instanceof geo.pathFeature)) {
    return new geo.pathFeature(arg);
  }
  arg = arg || {};
  geo.feature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_positions = arg.positions === undefined ? [] : arg.positions,
      s_init = this._init;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set positions
   *
   * @returns {geo.pathFeature}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.positions = function (val) {
    if (val === undefined) {
      return m_positions;
    }
    // Copy incoming array of positions
    m_positions = val.slice(0);
    this.dataTime().modified();
    this.modified();
    return this;
  };

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
        "width": [1.0],
        "color": [1.0, 1.0, 1.0],
        "pattern": "solid"
      },
      arg.style === undefined ? {} : arg.style
    );

    this.style(defaultStyle);

    if (m_positions) {
      this.dataTime().modified();
    }
  };

  this._init(arg);
  return this;
};

inherit(geo.pathFeature, geo.feature);
