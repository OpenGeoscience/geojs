//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointGeomFeature
 *
 * @class
 * @param positions
 * @param colors
 * @returns {geo.pointGeomFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.pointGeomFeature = function(positions, colors) {
  "use strict";
  if (!(this instanceof geo.pointGeomFeature)) {
    return new geo.pointGeomFeature(positions, colors);
  }
  geo.pointFeature.call(this);

  // Initialize
  var m_actor = vgl.utils.createPoints(positions, colors),
      m_lastModifiedTimestamp = null;

  this.setMapper(m_actor.mapper());
  this.setMaterial(m_actor.material());

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

inherit(geo.pointGeomFeature, geo.feature);