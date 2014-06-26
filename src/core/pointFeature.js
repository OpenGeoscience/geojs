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
  var m_positions = arg.positions === undefined ? null : arg.positions,
      s_init = this._init;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set positions
   *
   * @returns {geo.pointFeature}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.positions = function (val) {
    if (val === undefined) {
      return m_positions;
    } else {
      // Copy incoming array of positions
      m_positions = val.slice(0);
      this.dataTime().modified();
      this.modified();
      return this;
    }
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
        size: 1.0,
        width: 1.0,
        height: 1.0,
        color: [1.0, 1.0, 1.0],
        point_sprites: false,
        point_sprites_image: null
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

inherit(geo.pointFeature, geo.feature);
