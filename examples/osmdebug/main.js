/* Many parameters can be adjusted via url query parameters:
 *  debug: 'true' to show tile labels when using the html renderer.  'border'
 *      to draw borders on each tile when using the html renderer.  'all' to
 *      show both labels and borders.  These options just add a class to the
 *      #map element to invoke special css rules.
 *  lower: 'true' (default) or 'false'.  Keep all lower-level tiles if true.
 *      'false' was the old behavior where fewer tiles are rendered, and
 *      panning shows blank areas.
 *  opacity: a css opacity value (typically a float from 0 to 1).
 *  renderer: 'vgl' (default), 'd3', 'null', or 'html'.  This picks the
 *      renderer for map tiles.  null or html uses the html renderer.
 *  url: url to use for the map files.  Placeholders are allowed.  Default is
 *      http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png
 *  x: map center x
 *  y: map center y
 *  zoom: starting zoom level
 */

var osmDebug = {};

// Run after the DOM loads
$(function () {
  'use strict';

  // parse query parameters into an object for ease of access
  var query = document.location.search.replace(/(^\?)/, '').split(
    '&').map(function (n) {
      n = n.split('=');
      this[n[0]] = decodeURIComponent(n[1]);
      return this;
    }.bind({}))[0];

  // Create a map object
  var map = geo.map({
    node: '#map',
    center: {
      x: query.x !== undefined ? parseFloat(query.x) : -98.0,
      y: query.y !== undefined ? parseFloat(query.y) : 39.5
    },
    zoom: query.zoom !== undefined ? parseFloat(query.zoom) : 3
  });

  $('#map').toggleClass('query.debug-label', (
      query.debug === 'true' || query.debug === 'all'))
    .toggleClass('query.debug-border', (
      query.debug === 'border' || query.debug === 'all'));
  var params = {
    renderer: query.renderer || 'vgl',
    keepLower: query.lower === 'false' ? false : true,
    opacity: query.opacity || '1'
  };
  if (params.renderer === 'null' || params.renderer === 'html') {
    params.renderer = null;
  }
  if (query.url) {
    params.url = query.url;
  } else {
    params.baseUrl = 'http://otile1.mqcdn.com/tiles/1.0.0/map/';
  }
  // Add the osm layer with a custom tile url
  var osmLayer = map.createLayer('osm', params);
  // Make variables available as a global for easier debug
  osmDebug.map = map;
  osmDebug.params = params;
  osmDebug.osmLayer = osmLayer;
});
