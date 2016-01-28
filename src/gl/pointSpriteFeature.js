//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointSpritesGeomFeature
 *
 * @class
 * @extends geo.feature
 * @param positions
 * @param colors
 * @returns {geo.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.pointSpritesGeomFeature = function (image, positions, colors) {
  'use strict';
  if (!(this instanceof geo.pointSpritesGeomFeature)) {
    return new geo.pointSpritesGeomFeature(image, positions, colors);
  }

  geo.feature.call(this);

  // Initialize
  var actor = vgl.utils.createPointSprites(image, positions, colors),
      m_lookupTable = null,
      m_this = this;
  this.setMapper(actor.mapper());
  this.setMaterial(actor.material());

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update color mapping
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateColorMapping = function () {
    if (!m_lookupTable) {
      console.log('[warning] Invalid lookup table');
      return;
    }

    vgl.utils.updateColorMappedMaterial(m_this.material(), m_lookupTable);
    return m_this;
  };

  return this;
};

inherit(geo.pointSpritesGeomFeature, geo.feature);
