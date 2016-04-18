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
 * earcut
 * @copyright 2016, Mapbox
 * @license ISC
 */

var $ = require('jquery');
require('./polyfills');

module.exports = $.extend({
  camera: require('./camera'),
  choroplethFeature: require('./choroplethFeature'),
  clock: require('./clock'),
  contourFeature: require('./contourFeature'),
  domRenderer: require('./domRenderer'),
  event: require('./event'),
  feature: require('./feature'),
  featureLayer: require('./featureLayer'),
  fetchQueue: require('./fetchQueue'),
  fileReader: require('./fileReader'),
  geomFeature: require('./geomFeature'),
  graphFeature: require('./graphFeature'),
  imageTile: require('./imageTile'),
  jsonReader: require('./jsonReader'),
  layer: require('./layer'),
  lineFeature: require('./lineFeature'),
  map: require('./map'),
  mapInteractor: require('./mapInteractor'),
  object: require('./object'),
  osmLayer: require('./osmLayer'),
  pathFeature: require('./pathFeature'),
  planeFeature: require('./planeFeature'),
  pointFeature: require('./pointFeature'),
  polygonFeature: require('./polygonFeature'),
  quadFeature: require('./quadFeature'),
  heatmapFeature: require('./heatmapFeature'),
  renderer: require('./renderer'),
  sceneObject: require('./sceneObject'),
  tile: require('./tile'),
  tileCache: require('./tileCache'),
  tileLayer: require('./tileLayer'),
  timestamp: require('./timestamp'),
  transform: require('./transform'),
  vectorFeature: require('./vectorFeature'),
  inherit: require('./inherit'),
  version: require('./version'),

  util: require('./util'),
  d3: require('./d3'),
  gl: require('./gl'),
  canvas: require('./canvas'),
  gui: require('./ui')
}, require('./registry'));
