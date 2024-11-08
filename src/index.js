// License headers that will be preserved in distributed bundles.
/**
 * GeoJS
 * @copyright 2013-2022, Kitware, Inc.
 * @license Apache-2.0
 * @namespace geo
 */
/*
 * Bundled with the following libraries:
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
/* jQuery 3.5 made a change that breaks some aspect of our library.  Until
 * tutorials and examples upgrade to Bootstrap 4 and dependencies are checked,
 * apply the recommended workaround (see https://jquery.com/upgrade-guide/3.5).
 */
var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi;
$.htmlPrefilter = function (html) {
  return html.replace(rxhtmlTag, '<$1></$2>');
};

require('./main.styl');

module.exports = Object.assign({
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
  isolineFeature: require('./isolineFeature'),
  geojsonReader: require('./geojsonReader'),
  gridFeature: require('./gridFeature'),
  layer: require('./layer'),
  lineFeature: require('./lineFeature'),
  map: require('./map'),
  mapInteractor: require('./mapInteractor'),
  markerFeature: require('./markerFeature'),
  meshFeature: require('./meshFeature'),
  object: require('./object'),
  osmLayer: require('./osmLayer'),
  pathFeature: require('./pathFeature'),
  pointFeature: require('./pointFeature'),
  polygonFeature: require('./polygonFeature'),
  quadFeature: require('./quadFeature'),
  pixelmapFeature: require('./pixelmapFeature'),
  pixelmapLayer: require('./pixelmapLayer'),
  renderer: require('./renderer'),
  sceneObject: require('./sceneObject'),
  textFeature: require('./textFeature'),
  tile: require('./tile'),
  tileCache: require('./tileCache'),
  tileLayer: require('./tileLayer'),
  timestamp: require('./timestamp'),
  trackFeature: require('./trackFeature'),
  transform: require('./transform'),
  typedef: require('./typedef'),
  vectorFeature: require('./vectorFeature'),
  inherit: require('./inherit'),
  version: require('./version'),
  sha: require('./sha'),

  annotation: require('./annotation'),
  util: require('./util'),
  jQuery: $,
  canvas: require('./canvas'),
  svg: require('./svg'),
  vtkjs: require('./vtkjs'),
  webgl: require('./webgl'),
  gui: require('./ui'),
  vgl: require('./vgl')
}, require('./registry'));

if (window && !window.$) {
  window.$ = $;
}
if (window && !window.jQuery) {
  window.jQuery = $;
}
if (window && !window.geojsMap) {
  window.geojsMap = () => {
    const maps = $('.geojs-map').map((idx, m) => $(m).data('data-geojs-map'));
    return maps.length === 0 ? undefined : maps.length === 1 ? maps[0] : maps;
  };
}
