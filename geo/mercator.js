//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, document*/
//////////////////////////////////////////////////////////////////////////////

geoModule.mercator = {
  r_major:6378137.0,  //Equatorial Radius, WGS84
  r_minor:6356752.314245179,  //defined as constant
  f:298.257223563 //1/f=(a-b)/a , a=r_major, b=r_minor
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert longitude (Degree) to Tile X
 *
 *  @method long2tilex
 *  @param {float, integer}
 *  @returns {integer}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.mercator.long2tilex = function(lon, z) {
  "use strict";
  var rad = (lon + 180.0) / 360.0,
      f = Math.floor(rad * Math.pow(2.0, z));
  return f;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert latitude (Degree) to Tile Y
 *
 *  @method lat2tiley
 *  @param {float, integer}
 *  @returns {integer}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.mercator.lat2tiley = function(lat, z) {
  "use strict";
  var rad = lat * Math.PI/180.0;
  return Math.floor((1.0 - rad / Math.PI) / 2.0 * Math.pow(2.0, z));
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert Longitute (Degree) to Tile X and fraction.
 *
 *  @method long2tilex
 *  @param {float, integer}
 *  @returns {integer, float}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.mercator.long2tilex2 = function(lon, z) {
  "use strict";
  var rad = (lon + 180.0) / 360.0,
      f = rad * Math.pow(2.0, z),
      ret = Math.floor(f),
      frac = f-ret;
  return [ret, frac];
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert Latitude (Degree) to Tile Y and fraction
 *
 *  @method lat2tiley
 *  @param {float, integer}
 *  @returns {integer, float}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.mercator.lat2tiley2 = function(lat, z) {
  "use strict";
  var rad = lat * Math.PI/180.0,
      f = (1.0 - Math.log(Math.tan(rad) + 1.0 / Math.cos(rad)) /
           Math.PI) / 2.0 * Math.pow(2.0, z),
      ret = Math.floor(f),
      frac = f-ret;
  return [ret, frac];
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert Tile X to Longitute (Degree)
 *
 *  @method tilex2long
 *  @param {integer, integer}
 *  @returns {float}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.mercator.tilex2long = function(x, z) {
  "use strict";
  return x / Math.pow(2.0, z) * 360.0 - 180.0;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert Tile Y to Latitute (Degree)
 *
 *  @method tiley2lat
 *  @param {integer, integer}
 *  @returns {float}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.mercator.tiley2lat = function(y, z) {
  "use strict";
  var n = Math.PI - 2.0 * Math.PI * y / Math.pow(2.0, z);
  return 180.0 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert spherical mercator Y to latitude
 *
 *  @method y2lat
 *  @param {float}
 *  @returns {float}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.mercator.y2lat = function(a) {
  "use strict";
  return 180/Math.PI * (2 * Math.atan(Math.exp(a*Math.PI/180)) - Math.PI/2);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert latitude into Y position in spherical mercator
 *
 *  @method lat2y
 *  @param {float}
 *  @returns {float}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.mercator.lat2y = function(a) {
  "use strict";
  return 180/Math.PI * Math.log(Math.tan(Math.PI/4+a*(Math.PI/180)/2));
};

//////////////////////////////////////////////////////////////////////////////
/**
 *
 * @param d
 * @returns {number}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.mercator.deg2rad = function(d) {
  var r= d * (Math.PI/180.0);
  return r;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert radian to degree
 *
 * @param r
 * @returns {number}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.mercator.rad2deg = function(r) {
  var d= r / (Math.PI/180.0);
  return d;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert latlon to mercator
 *
 * @param lon
 * @param lat
 * @returns {{x: number, y: number}}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.mercator.ll2m = function(lon,lat) {
  //lat, lon in rad
  var x = this.r_major * this.deg2rad(lon);
  console.log('x   ', x);

  if (lat > 89.5) lat = 89.5;
  if (lat < -89.5) lat = -89.5;

  var temp = this.r_minor / this.r_major,
      es = 1.0 - (temp * temp),
      eccent = Math.sqrt(es),
      phi = this.deg2rad(lat),
      sinphi = Math.sin(phi),
      con = eccent * sinphi,
      com = .5 * eccent,
      con2 = Math.pow((1.0-con)/(1.0+con), com),
      ts = Math.tan(.5 * (Math.PI*0.5 - phi))/con2,
      y = 0 - this.r_major * Math.log(ts),
      ret={'x':x,'y':y};

  return ret;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert mercator to lat lon
 *
 * @param x
 * @param y
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.mercator.m2ll = function(x,y) {
  var lon=this.rad2deg((x/this.r_major)),
      temp = this.r_minor / this.r_major,
      e = Math.sqrt(1.0 - (temp * temp)),
      lat=this.rad2deg(this.pjPhi2( Math.exp( 0-(y/this.r_major)), e)),
      ret={'lon':lon,'lat':lat};

  return ret;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * pjPhi2
 *
 * @param ts
 * @param e
 * @returns {number}
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.mercator.pjPhi2 = function(ts, e) {
  var N_ITER=15,
      HALFPI=Math.PI/2,
      TOL=0.0000000001,
      eccnth, Phi, con, dphi,
      i = N_ITER,
      eccnth = .5 * e,
      Phi = HALFPI - 2. * Math.atan (ts);

  do
  {
    con = e * Math.sin (Phi);
    dphi = HALFPI - 2. * Math.atan (ts * Math.pow((1. - con) / (1. + con), eccnth)) - Phi;
    Phi += dphi;

  }
  while ( Math.abs(dphi)>TOL && --i);
  return Phi;
};