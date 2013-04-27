/**
 * @module ogs.geo
 */

/*jslint devel: true, eqeq: true, forin: true, newcap: true, plusplus: true, white: true, indent: 2*/
/*global geoModule*/

/**
 * Create a new instance of latlng
 *
 * @desc A latlng encapsulates geodesy coordinates defined by latitude and
 * longitude
 * @returns {geoModule.latlng}
 */
geoModule.latlng = function(lat, lng) {
  "use strict";
  if (!(this instanceof geoModule.latlng)) {
    return new geoModule.latlng(lat, lng);
  }

  /** @priave */
  var m_lat, m_lng;
  m_lat = lat;
  m_lng = lng;

  // / Public member methods
  this.lat = function() {
    return m_lat;
  };

  this.lng = function() {
    return m_lng;
  };

  return this;
};
