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
 * Create a new instance of class polygonFeature
 *
 * @class
 * @returns {geo.polygonFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.polygonFeature = function(arg) {
  "use strict";
  if (!(this instanceof geo.polygonFeature)) {
    return new geo.polygonFeature(arg);
  }
  arg = arg || {};
  geo.feature.call(this, arg);

  arg.style = arg.style === undefined ? $.extend({}, {
              "color": [1.0, 1.0, 1.0],
              "fill_color": [1.0, 1.0, 1.0],
              "fill": true}, arg.style) : arg.style;

  // Update style
  this.style(arg.style);

  return this;
};

inherit(geo.polygonFeature, geo.feature);
