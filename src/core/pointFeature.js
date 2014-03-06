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
geo.pointFeature = function(cfg) {
  "use strict";
  if (!(this instanceof geo.pointFeature)) {
    return new geo.pointFeature(cfg);
  }
  cfg = cfg || {};
  geo.feature.call(this, cfg);

  cfg.style = cfg.style === undefined ? {"size":[1.0],
              "color": [{1.0, 1.0, 1.0, 1.0}],
              "point_sprites": false,
              "image": null} : cfg.style;

  return this;
};

inherit(geo.pointFeature, geo.feature);
