/* Many parameters can be adjusted via url query parameters:
 *  debug: 'true' to show tile labels when using the html renderer.  'border'
 *      to draw borders on each tile when using the html renderer.  'all' to
 *      show both labels and borders.  These options just add a class to the
 *      #map element to invoke special css rules.
 *  renderer: 'vgl' (default), 'd3', 'null', or 'html'.  This picks the
 *      renderer for map tiles.  null or html uses the html renderer.
 *  lower: 'true' (default) or 'false'.  Keep all lower-level tiles if true.
 *      'false' was the old behavior where fewer tiles are rendered, and
 *      panning shows blank areas.
 *  url: url to use for the map files.  Placeholders are allowed.  Default is
 *      http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png
 */

// Run after the DOM loads
$(function () {
  'use strict';

  // Create a map object
  var map = geo.map({
    node: '#map',
    center: {
      x: -98.0,
      y: 39.5
    },
    zoom: 3
  });

  var debug = (location.search.match(/[?&]debug=([^&]+)(&|$)/) || [])[1];
  $('#map').toggleClass('debug-label', (debug === 'true' || debug === 'all'))
    .toggleClass('debug-border', (debug === 'border' || debug === 'all'));
  var params = {
    renderer: (location.search.match(/[?&]renderer=([^&]+)(&|$)/
      ) || [])[1] || 'vgl',
    keepLower: (location.search.match(/[?&]lower=([^&]+)(&|$)/
      ) || [])[1] === 'false' ? false : true
  };
  if (params.renderer === 'null' || params.renderer === 'html') {
    params.renderer = null;
  }
  var url = (location.search.match(/[?&]url=([^&]+)(&|$)/) || [])[1];
  if (url) {
    params.url = decodeURIComponent(url);
  } else {
    params.baseUrl = 'http://otile1.mqcdn.com/tiles/1.0.0/map/';
  }
  // Add the osm layer with a custom tile url
  map.createLayer('osm', params);
});
