//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointSpritesGeomFeature
 *
 * @class
 * @param positions
 * @param colors
 * @returns {geo.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.pointSpritesGeomFeature = function(image, positions, colors) {
  "use strict";
  if (!(this instanceof geo.pointSpritesGeomFeature)) {
    return new geo.pointSpritesGeomFeature(image, positions, colors);
  }

  geo.feature.call(this);

  // Initialize
  var actor = vgl.utils.createPointSprites(image, positions, colors);
  this.setMapper(actor.mapper());
  this.setMaterial(actor.material());

  return this;
};

inherit(geo.pointSpritesGeomFeature, geo.feature);