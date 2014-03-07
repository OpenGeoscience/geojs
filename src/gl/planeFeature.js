//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of planeFeature
 *
 * @class
 * Create a plane feature given a lower left corner point {geo.latlng}
 * and and upper right corner point {geo.latlng}
 * @param lowerleft
 * @param upperright
 * @returns {geo.planeFeature}
 */
//////////////////////////////////////////////////////////////////////////////
ggl.planeFeature = function(lowerleft, upperright, z) {
  "use strict";
  if (!(this instanceof geo.planeFeature)) {
    return new geo.planeFeature(lowerleft, upperright);
  }

  geo.polygonFeature.call(this);

  z = typeof z !== 'undefined' ? z : 0.0;

  // Initialize
  var m_origin, m_pt2, m_pt1, m_actor, m_lastModifiedTimestamp;
  m_origin = [ lowerleft.lng(), lowerleft.lat(), z ];
  m_pt2 = [ lowerleft.lng(), upperright.lat(), z ];
  m_pt1 = [ upperright.lng(), lowerleft.lat(), z ];

  m_actor = vgl.utils.createPlane(m_origin[0], m_origin[1], m_origin[2],
                                  m_pt1[0], m_pt1[1], m_pt1[2], m_pt2[0],
                                  m_pt2[1], m_pt2[2]);



  this.setMapper(m_actor.mapper());
  this.setMaterial(m_actor.material());

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Gets the coordinates for this plane
   *
   * @returns {Array} [lat1, lon1, lat2, lon2]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getCoords = function() {
    return [m_origin[1], m_origin[0], m_pt2[1], m_pt1[0]];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this.update = function() {
    if (m_lastModifiedTimestamp &&
        m_lastModifiedTimestamp.getMTime() < this.getMTime()) {

      vgl.utils.updateColorMappedMaterial(this.material(), m_lookupTable);

    } else {

      m_lastModifiedTimestamp = vgl.timestamp();
      m_lastModifiedTimestamp.modified();

    }
  };

  return this;
};

inherit(geo.planeFeature, geo.polygonFeature);