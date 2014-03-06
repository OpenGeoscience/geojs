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
 * Create a new instance of class pointFeature
 *
 * @class
 * @returns {geo.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.pointFeature = function() {
  "use strict";
  if (!(this instanceof geo.pointFeature)) {
    return new geo.pointFeature();
  }
  geo.feature.call(this);
  this.setStyle({"size":[1.0],
                 "color": [{1.0, 1.0, 1.0, 1.0}],
                 "image": null});
  return this;
};

inherit(geo.pointFeature, geo.feature);
