//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class polygonFeature
 *
 * @class
 * @returns {geo.polygonFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.polygonFeature = function() {
  "use strict";
  if (!(this instanceof geo.polygonFeature)) {
    return new geo.polygonFeature();
  }
  geo.polygonFeature.call(this);
  this.setStyle({
    "fill_color": [{1.0, 1.0, 1.0, 1.0}],
    "fill_polygons": true,
  });
};

inherit(geo.polygonFeature, geo.feature);
