/** @namespace */
geo.mercator = {
  r_major: 6378137.0  //Equatorial Radius, WGS84
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Returns the polar radius based on the projection.
 *
 * @param {Boolean} sperical
 * @returns {Number}
 */
//////////////////////////////////////////////////////////////////////////////
geo.mercator.r_minor = function (spherical) {
  'use strict';

  var r_minor;

  spherical = spherical !== undefined ? spherical : false;

  if (spherical) {
    r_minor = 6378137.0;
  } else {
    r_minor = 6356752.314245179;
  }

  return r_minor;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * 1/f=(a-b)/a , a=r_major, b=r_minor
 */
//////////////////////////////////////////////////////////////////////////////
geo.mercator.f = function (spherical) {
  'use strict';

  return (geo.mercator.r_major - geo.mercator.r_minor(spherical)) / geo.mercator.r_major;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert longitude (Degree) to Tile X
 *
 *  @param {float} lon
 *  @param {integer} z
 *  @returns {integer}
 */
//////////////////////////////////////////////////////////////////////////////
geo.mercator.long2tilex = function (lon, z) {
  'use strict';
  var rad = (lon + 180.0) / 360.0,
      f = Math.floor(rad * Math.pow(2.0, z));
  return f;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert latitude (Degree) to Tile Y
 *
 *  @param {float} lat
 *  @param {integer} z
 *  @returns {integer}
 */
//////////////////////////////////////////////////////////////////////////////
geo.mercator.lat2tiley = function (lat, z) {
  'use strict';
  var rad = lat * Math.PI / 180.0;
  return Math.floor((1.0 - rad / Math.PI) / 2.0 * Math.pow(2.0, z));
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert Longitute (Degree) to Tile X and fraction.
 *
 *  @param {float} lon
 *  @param {integer} z
 *  @returns {number[]}
 */
//////////////////////////////////////////////////////////////////////////////
geo.mercator.long2tilex2 = function (lon, z) {
  'use strict';
  var rad = (lon + 180.0) / 360.0,
      f = rad * Math.pow(2.0, z),
      ret = Math.floor(f),
      frac = f - ret;
  return [ret, frac];
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert Latitude (Degree) to Tile Y and fraction
 *
 *  @param {float} lat
 *  @param {integer} z
 *  @returns {number[]}
 */
//////////////////////////////////////////////////////////////////////////////
geo.mercator.lat2tiley2 = function (lat, z) {
  'use strict';
  var rad = lat * Math.PI / 180.0,
      f = (1.0 - Math.log(Math.tan(rad) + 1.0 / Math.cos(rad)) /
           Math.PI) / 2.0 * Math.pow(2.0, z),
      ret = Math.floor(f),
      frac = f - ret;
  return [ret, frac];
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert Tile X to Longitute (Degree)
 *
 *  @param {integer} x
 *  @param {integer} z
 *  @returns {float}
 */
//////////////////////////////////////////////////////////////////////////////
geo.mercator.tilex2long = function (x, z) {
  'use strict';
  return x / Math.pow(2.0, z) * 360.0 - 180.0;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert Tile Y to Latitute (Degree)
 *
 *  @param {integer} y
 *  @param {integer} z
 *  @returns {float}
 */
//////////////////////////////////////////////////////////////////////////////
geo.mercator.tiley2lat = function (y, z) {
  'use strict';
  var n = Math.PI - 2.0 * Math.PI * y / Math.pow(2.0, z);
  return 180.0 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert spherical mercator Y to latitude
 *
 *  @param {float} a
 *  @returns {float}
 */
//////////////////////////////////////////////////////////////////////////////
geo.mercator.y2lat = function (a) {
  'use strict';
  return 180 / Math.PI * (2 * Math.atan(Math.exp(a * Math.PI / 180)) - Math.PI / 2);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert latitude into Y position in spherical mercator
 *
 *  @param {float} a
 *  @returns {float}
 */
//////////////////////////////////////////////////////////////////////////////
geo.mercator.lat2y = function (a) {
  'use strict';
  return 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + a * (Math.PI / 180) / 2));
};

//////////////////////////////////////////////////////////////////////////////
/**
 *
 * @param {float} d
 * @returns {number}
 */
//////////////////////////////////////////////////////////////////////////////
geo.mercator.deg2rad = function (d) {
  'use strict';
  var r = d * (Math.PI / 180.0);
  return r;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert radian to degree
 *
 * @param {float} r
 * @returns {number}
 */
//////////////////////////////////////////////////////////////////////////////
geo.mercator.rad2deg = function (r) {
  'use strict';
  var d = r / (Math.PI / 180.0);
  return d;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert latlon to mercator
 *
 * @param {float} lon
 * @param {float} lat
 * @returns {object}
 */
//////////////////////////////////////////////////////////////////////////////
geo.mercator.ll2m = function (lon, lat, spherical) {
  'use strict';

  if (lat > 89.5) {
    lat = 89.5;
  }

  if (lat < -89.5) {
    lat = -89.5;
  }

  var x = this.r_major * this.deg2rad(lon),
      temp = this.r_minor(spherical) / this.r_major,
      es = 1.0 - (temp * temp),
      eccent = Math.sqrt(es),
      phi = this.deg2rad(lat),
      sinphi = Math.sin(phi),
      con = eccent * sinphi,
      com = 0.5 * eccent,
      con2 = Math.pow((1.0 - con) / (1.0 + con), com),
      ts = Math.tan(0.5 * (Math.PI * 0.5 - phi)) / con2,
      y = -this.r_major * Math.log(ts),
      ret = {'x': x, 'y': y};

  return ret;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convert mercator to lat lon
 *
 * @param {float} x
 * @param {float} y
 */
//////////////////////////////////////////////////////////////////////////////
geo.mercator.m2ll = function (x, y, spherical) {
  'use strict';
  var lon = this.rad2deg((x / this.r_major)),
      temp = this.r_minor(spherical) / this.r_major,
      e = Math.sqrt(1.0 - (temp * temp)),
      lat = this.rad2deg(this.pjPhi2(Math.exp(-(y / this.r_major)), e)),
      ret = {'lon': lon, 'lat': lat};

  return ret;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * pjPhi2
 *
 * @param {float} ts
 * @param {float} e
 * @returns {number}
 */
//////////////////////////////////////////////////////////////////////////////
geo.mercator.pjPhi2 = function (ts, e) {
  'use strict';
  var N_ITER = 15,
      HALFPI = Math.PI / 2,
      TOL = 0.0000000001,
      con, dphi,
      i = N_ITER,
      eccnth = 0.5 * e,
      Phi = HALFPI - 2.0 * Math.atan(ts);

  do {
    con = e * Math.sin(Phi);
    dphi = HALFPI - 2.0 * Math.atan(ts * Math.pow(
            (1.0 - con) / (1.0 + con), eccnth)) - Phi;
    Phi += dphi;
    i -= 1;
  } while (Math.abs(dphi) > TOL && i);
  return Phi;
};
