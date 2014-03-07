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
geo.polygonFeature = function(cfg) {
  "use strict";
  if (!(this instanceof geo.polygonFeature)) {
    return new geo.polygonFeature(cfg);
  }
  cfg = cfg || {};
  geo.feature.call(this, cfg);

  cfg.style = cfg.style === undefined ? $.extend({}, {
              "color": [{1.0, 1.0, 1.0, 1.0}],
              "fill_color": [1.0, 1.0, 1.0],
              "fill": true}, cfg.style) : cfg.style;

  // Update style
  this.style(cfg.style);

  return this;
};

inherit(geo.polygonFeature, geo.feature);
