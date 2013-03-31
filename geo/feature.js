/**
 * @module ogs.geo
 */

/**
 * Create a new instance of class feature
 *
 * @class
 * @returns {geoModule.feature}
 */
geoModule.feature = function() {

  if (!(this instanceof geoModule.feature)) {
    return new geoModule.feature();
  }
  ogs.vgl.actor.call(this);

  return this;
};

inherit(geoModule.feature, ogs.vgl.actor);

/**
 * Create a new instance of planeFeature
 *
 * @class
 * @desc Create a plane feature given a lower left corner point {ogs.geo.latlng}
 * and and upper right corner point {ogs.geo.latlng}
 * @param lowerleft
 * @param upperright
 * @returns {geoModule.planeFeature}
 */
geoModule.planeFeature = function(lowerleft, upperright) {

  if (!(this instanceof geoModule.planeFeature)) {
    return new geoModule.planeFeature(lowerleft, upperright);
  }

  ogs.vgl.actor.call(this);

  // Initialize
  var origin = [ lowerleft.lng(), lowerleft.lat(), 0.0 ];
  var pt2 = [ lowerleft.lng(), upperright.lat(), 0.0 ];
  var pt1 = [ upperright.lng(), lowerleft.lat(), 0.0 ];

  var actor = ogs.vgl.utils.createPlane(origin[0], origin[1], origin[2],
                                        pt1[0], pt1[1], pt1[2], pt2[0], pt2[1],
                                        pt2[2]);

  this.setMapper(actor.mapper());
  this.setMaterial(actor.material());

  return this;
};

inherit(geoModule.planeFeature, geoModule.feature);

/**
 * Create a new instance of pointFeature
 *
 * @class
 * @param positions
 * @param colors
 * @returns {geoModule.pointFeature}
 */
geoModule.pointFeature = function(positions, colors) {

  if (!(this instanceof geoModule.pointFeature)) {
    return new geoModule.pointFeature(positions, colors);
  }

  ogs.vgl.actor.call(this);

  // Initialize
  var actor = ogs.vgl.utils.createPoints(positions, colors);
  this.setMapper(actor.mapper());
  this.setMaterial(actor.material());

  return this;
};

inherit(geoModule.pointFeature, geoModule.feature);

/**
 * Create a new instance of pointSpritesFeature
 *
 * @class
 * @param positions
 * @param colors
 * @returns {geoModule.pointFeature}
 */
geoModule.pointSpritesFeature = function(image, positions, colors) {

  if (!(this instanceof geoModule.pointSpritesFeature)) {
    return new geoModule.pointSpritesFeature(image, positions, colors);
  }

  ogs.vgl.actor.call(this);

  // Initialize
  var actor = ogs.vgl.utils.createPointSprites(image, positions, colors);
  this.setMapper(actor.mapper());
  this.setMaterial(actor.material());

  return this;
};

inherit(geoModule.pointSpritesFeature, geoModule.feature);

/**
 * Create a new instance of geometryFeature
 *
 * @class
 * @desc Create a geometry feature given a geometry {ogs.vgl.geometryData} *
 * @param geometry data {ogs.vgl.geometryData} *
 * @returns {geoModule.planeFeature}
 */
geoModule.geometryFeature = function(geom) {

  if (!(this instanceof geoModule.geometryFeature)) {
    return new geoModule.geometryFeature(geom);
  }

  ogs.vgl.actor.call(this);

  // Initialize
  var mapper = ogs.vgl.mapper();
  mapper.setGeometryData(geom);

  this.setMapper(mapper);

  var material = ogs.vgl.utils.createGeometryMaterial();
  this.setMaterial(material);

  return this;
};

inherit(geoModule.geometryFeature, geoModule.feature);
