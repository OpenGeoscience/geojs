var inherit = require('../util').inherit;
var feature = require('../core/feature');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointSpritesGeomFeature
 *
 * @class geo.gl.pointSpritesGeomFeature
 * @extends geo.feature
 * @param positions
 * @param colors
 * @returns {geo.gl.pointSpritesGeomFeature}
 */
//////////////////////////////////////////////////////////////////////////////
var pointSpritesGeomFeature = function (image, positions, colors) {
  'use strict';
  if (!(this instanceof pointSpritesGeomFeature)) {
    return new pointSpritesGeomFeature(image, positions, colors);
  }

  feature.call(this);

  var vgl = require('vgl');

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

inherit(pointSpritesGeomFeature, feature);
module.exports = pointSpritesGeomFeature;
