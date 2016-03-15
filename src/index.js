// License headers that will be preserved in distributed bundles.
/**
 * GeoJS
 * @copyright 2013-2016, Kitware, Inc.
 * @license Apache-2.0
 *
 * Bundled with the following libraries:
 *
 * vgl
 * @copyright 2014-2016, Kitware, Inc.
 * @license Apache-2.0
 *
 * Proj4js
 * @copyright 2014, Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf
 * @license MIT
 *
 * gl-matrix
 * @copyright 2015, Brandon Jones, Colin MacKenzie IV
 * @license MIT
 *
 * pnltri
 * @copyright 2014, Jurgen Ahting
 * @license MIT
 */

var util = require('./util');

module.exports = {
  camera: require('./core/camera'),
  choroplethFeature: require('./core/choroplethFeature'),
  clock: require('./core/clock'),
  contourFeature: require('./core/contourFeature'),
  domRenderer: require('./core/domRenderer'),
  event: require('./core/event'),
  feature: require('./core/feature'),
  featureLayer: require('./core/featureLayer'),
  fetchQueue: require('./core/fetchQueue'),
  fileReader: require('./core/fileReader'),
  geomFeature: require('./core/geomFeature'),
  graphFeature: require('./core/graphFeature'),
  imageTile: require('./core/imageTile'),
  jsonReader: require('./core/jsonReader'),
  layer: require('./core/layer'),
  lineFeature: require('./core/lineFeature'),
  map: require('./core/map'),
  mapInteractor: require('./core/mapInteractor'),
  object: require('./core/object'),
  osmLayer: require('./core/osmLayer'),
  pathFeature: require('./core/pathFeature'),
  planeFeature: require('./core/planeFeature'),
  pointFeature: require('./core/pointFeature'),
  polygonFeature: require('./core/polygonFeature'),
  quadFeature: require('./core/quadFeature'),
  renderer: require('./core/renderer'),
  sceneObject: require('./core/sceneObject'),
  tile: require('./core/tile'),
  tileCache: require('./core/tileCache'),
  tileLayer: require('./core/tileLayer'),
  timestamp: require('./core/timestamp'),
  transform: require('./core/transform'),
  vectorFeature: require('./core/vectorFeature'),
  version: require('./core/version'),
  util: util,
  d3: require('./d3'),
  gl: require('./gl'),
  canvas: require('./canvas'),
  gui: require('./ui'),

  checkRenderer: util.checkRenderer,
  registerFeature: util.registerFeature,
  createFeature: util.createFeature,
  registerLayerAdjustment: util.registerLayerAdjustment,
  adjustLayerForRenderer: util.adjustLayerForRenderer,
  registerLayer: util.registerLayer,
  createLayer: util.createLayer,
  registerWidget: util.registerWidget,
  createWidget: util.createWidget,
  registerFileReader: util.registerFileReader,
  createFileReader: util.createFileReader,
  inherit: util.inherit
};
