//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, inherit, document$*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class pointFeature
 *
 * @class
 * @returns {geo.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.pointFeature = function(arg) {
  "use strict";
  if (!(this instanceof geo.pointFeature)) {
    return new geo.pointFeature(arg);
  }
  arg = arg || {};
  geo.feature.call(this, arg);

  arg.style = arg.style === undefined ? $.extend({}, {"size":[1.0],
              "color":[1.0, 1.0, 1.0],
              "point_sprites": false,
              "point_sprites_image": null}, arg.style) : arg.style;

  // Update style
  this.style(arg.style);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_positions = arg.positions === undefined ? null : arg.positions;
  if (m_positions) {
    this.dataTime().modified();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set positions
   *
   * @returns {geo.pointFeature}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.positions = function(val) {
    if (val === undefined ) {
      return m_positions;
    } else {
      // Copy incoming array of positions
      m_positions = val.slice(0);
      this.dataTime().modified();
      this.modified();
      return this;
    }
  };

  return this;
};

inherit(geo.pointFeature, geo.feature);
