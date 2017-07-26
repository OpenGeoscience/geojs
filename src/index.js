/** @namespace geo */
// License headers that will be preserved in distributed bundles.
/**
 * GeoJS
 * @copyright 2013-2017, Kitware, Inc.
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
 * JQuery
 * @copyright jQuery Foundation and other contributors
 * @license MIT
 *
 * earcut
 * @copyright 2016, Mapbox
 * @license ISC
 *
 * kdbush
 * @copyright 2017, Vladimir Agafonkin
 * @license ISC
 */

var $ = require('jquery');
require('./polyfills');

require('./main.styl');

module.exports = $.extend({
  annotation: require('./annotation'),
  annotationLayer: require('./annotationLayer'),
  camera: require('./camera'),
  choroplethFeature: require('./choroplethFeature'),
  contourFeature: require('./contourFeature'),
  domRenderer: require('./domRenderer'),
  event: require('./event'),
  feature: require('./feature'),
  featureLayer: require('./featureLayer'),
  fetchQueue: require('./fetchQueue'),
  fileReader: require('./fileReader'),
  geo_action: require('./action'),
  graphFeature: require('./graphFeature'),
  heatmapFeature: require('./heatmapFeature'),
  imageTile: require('./imageTile'),
  jsonReader: require('./jsonReader'),
  layer: require('./layer'),
  lineFeature: require('./lineFeature'),
  map: require('./map'),
  mapInteractor: require('./mapInteractor'),
  object: require('./object'),
  osmLayer: require('./osmLayer'),
  pathFeature: require('./pathFeature'),
  pointFeature: require('./pointFeature'),
  polygonFeature: require('./polygonFeature'),
  quadFeature: require('./quadFeature'),
  pixelmapFeature: require('./pixelmapFeature'),
  renderer: require('./renderer'),
  sceneObject: require('./sceneObject'),
  textFeature: require('./textFeature'),
  tile: require('./tile'),
  tileCache: require('./tileCache'),
  tileLayer: require('./tileLayer'),
  timestamp: require('./timestamp'),
  transform: require('./transform'),
  typedef: require('./typedef'),
  vectorFeature: require('./vectorFeature'),
  inherit: require('./inherit'),
  version: require('./version'),
  sha: require('./sha'),

  util: require('./util'),
  jQuery: $,
  d3: require('./d3'),
  gl: require('./gl'),
  canvas: require('./canvas'),
  gui: require('./ui')
}, require('./registry'));

if (window && !window.$) {
  window.$ = $;
}
if (window && !window.jQuery) {
  window.jQuery = $;
}
