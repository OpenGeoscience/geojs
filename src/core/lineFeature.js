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
 * Create a new instance of class lineFeature
 *
 * @class
 * @returns {geo.lineFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.lineFeature = function(arg) {
  "use strict";
  if (!(this instanceof geo.lineFeature)) {
    return new geo.lineFeature(arg);
  }
  arg = arg || {};
  geo.feature.call(this, arg);

  arg.style = arg.style === undefined ? $.extend({}, {"width":[1.0],
              "color": [1.0, 1.0, 1.0],
              "pattern": "solid"}, arg.style) : arg.style;

  // Update style
  this.style(arg.style);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_positions = arg.positions === undefined ? [] : arg.positions;

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
      m_positions = positions.slice(0);
      this.modified();
      return this;
    }
  };

  return this;
};

inherit(geo.lineFeature, geo.feature);
