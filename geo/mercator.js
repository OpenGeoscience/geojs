/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true, white: true, indent: 2*/
/*global geoModule, ogs, inherit, $, vglModule, document*/


/**
 * Create a new instance of class map
 *
 * @class Creates a new map inside of the given HTML container (Typically DIV)
 * @returns {geoModule.map}
 */
geoModule.mercator = {};

/**
 * Convert Longitute (Degree) to Tile X
 *
 *  @method long2tilex
 *  @param {float, integer}
 *  @returns {integer}
 */
geoModule.mercator.long2tilex = function(lon, z) {
  var rad = (lon + 180.0) / 360.0;
  var f = Math.floor(rad * Math.pow(2.0, z));
  return Math.round(f)
}


/**
 * Convert Latitude (Degree) to Tile Y
 *
 *  @method lat2tiley
 *  @param {float, integer}
 *  @returns {integer}
 */
geoModule.mercator.lat2tiley = function(lat, z) {
  var rad = lat * Math.PI/180.0;
  return Math.round(Math.floor((1.0 - rad / Math.PI) / 2.0 * Math.pow(2.0, z)));
}

/**
 * Convert Longitute (Degree) to Tile X and fraction.
 *
 *  @method long2tilex
 *  @param {float, integer}
 *  @returns {integer, float}
 */
geoModule.mercator.long2tilex2 = function(lon, z) {
  var rad = (lon + 180.0) / 360.0;
  var f = rad * Math.pow(2.0, z);
  var ret = Math.floor(f);
  var frac = f-ret;
  return [ret, frac];
}


/**
 * Convert Latitude (Degree) to Tile Y and fraction
 *
 *  @method lat2tiley
 *  @param {float, integer}
 *  @returns {integer, float}
 */
geoModule.mercator.lat2tiley2 = function(lat, z) {
  var rad = lat * Math.PI/180.0;
  var f = (1.0 - Math.log( Math.tan(rad) + 1.0 / Math.cos(rad)) / Math.PI) / 2.0 * Math.pow(2.0, z);
  var ret = Math.floor(f);
  var frac = f-ret;
  return [ret, frac];
}
/**
 * Convert Tile X to Longitute (Degree)
 *
 *  @method tilex2long
 *  @param {integer, integer}
 *  @returns {float}
 */

geoModule.mercator.tilex2long = function(x, z) {
  return x / pow(2.0, z) * 360.0 - 180.0;
}


/**
 * Convert Tile Y to Latitute (Degree)
 *
 *  @method tiley2lat
 *  @param {integer, integer}
 *  @returns {float}
 */

geoModule.mercator.tiley2lat = function(y, z) {
  n = Math.PI - 2.0 * Math.PI * y / pow(2.0, z);
  return 180.0 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}
