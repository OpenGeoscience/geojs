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
 * Create a new instance of class lineFeature
 *
 * @class
 * @returns {geo.lineFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.lineFeature = function() {
  "use strict";
  if (!(this instanceof geo.lineFeature)) {
    return new geo.lineFeature();
  }
  geo.lineFeature.call(this);
  this.setStyle({
    "size":[1.0],
    "color": [{1.0, 1.0, 1.0, 1.0}],
    "width": [1.0]
    });
};

inherit(geo.lineFeature, geo.feature);
