///////////////////////////////////////////////////////////////////////////////
//
// latlng class defines a geodesy coordinate
//
///////////////////////////////////////////////////////////////////////////////

/**
 * A latlng encapsulates geodesy coordinates defined by latitude and longitude
 *
 */
geoModule.latlng = function(lat, lng) {
  if (!(this instanceof geoModule.latlng)) {
    return new geoModule.latlng(lat, lng);
  }

  // / Private member variables
  var m_lat = lat;
  var m_lng = lng;

  // / Public member methods
  this.lat = function() {
    return m_lat;
  };

  this.lng = function() {
    return m_lng;
  };

  return this;
};
