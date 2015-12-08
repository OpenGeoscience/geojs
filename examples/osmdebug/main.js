/* Many parameters can be adjusted via url query parameters:
 *  debug: 'true' to show tile labels when using the html renderer.  'border'
 *      to draw borders on each tile when using the html renderer.  'all' to
 *      show both labels and borders.  These options just add a class to the
 *      #map element to invoke special css rules.
 *  discrete: 'true' to use discrete zoom.
 *  h: height of a tiled image (at max zoom).
 *  lower: 'true' (default) or 'false'.  Keep all lower-level tiles if true.
 *      'false' was the old behavior where fewer tiles are rendered, and
 *      panning shows blank areas.
 *  opacity: a css opacity value (typically a float from 0 to 1).
 *  renderer: 'vgl' (default), 'd3', 'null', or 'html'.  This picks the
 *      renderer for map tiles.  null or html uses the html renderer.
 *  url: url to use for the map files.  Placeholders are allowed.  Default is
 *      http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png .  Other useful
 *      urls are are: /data/tilefancy.png
 *      http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
 *  w: width of a tiled image (at max zoom).  If iw and h are specified, a
 *      variety of other changes are made to make this served in image
 *      coordinates.
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
  var mapParams = {
    node: '#map',
    center: {
      x: query.x !== undefined ? parseFloat(query.x) : -98.0,
      y: query.y !== undefined ? parseFloat(query.y) : 39.5
    },
    zoom: query.zoom !== undefined ? parseFloat(query.zoom) : 3,
    discreteZoom: query.discrete === 'true' ? true : false
  };
  var layerParams = {
    renderer: query.renderer || 'vgl',
    keepLower: query.lower === 'false' ? false : true,
    opacity: query.opacity || '1'
  };
  if (layerParams.renderer === 'null' || layerParams.renderer === 'html') {
    layerParams.renderer = null;
  }
  if (query.url) {
    layerParams.url = query.url;
  } else {
    layerParams.baseUrl = 'http://otile1.mqcdn.com/tiles/1.0.0/map/';
  }
  /* For image tile servers, where we know the maximum width and height, use
   * a pixel coordinate system. */
  if (query.w && query.h) {
    var w = parseInt(query.w), h = parseInt(query.h);
    /* If both ingcs and gcs are set to an empty string '', the coordinates
     * will stay at pixel values, but the y values will from from [0, -h).  If
     * '+proj=longlat +axis=esu', '+proj=longlat +axis=enu' are used instead,
     * the y coordinate will be reversed.  It would be better to install a new
     * 'inverse-y' projection into proj4, but this works without that change.
     * The 'longlat' projection functionally is a no-op in this case. */
    mapParams.ingcs = '+proj=longlat +axis=esu';
    mapParams.gcs = '+proj=longlat +axis=enu';
    //mapParams.ingcs = mapParams.gcs = '';
    mapParams.maxBounds = {left: 0, top: 0, right: w, bottom: h};
    mapParams.center = {x: w / 2, y: h / 2};
    mapParams.max = Math.ceil(Math.log(Math.max(w, h) / 256) / Math.log(2));
    /* unitsPerPixel is at zoom level 0.  We want each pixel to be 1 at the
     * maximum zoom */
    mapParams.unitsPerPixel = Math.pow(2, mapParams.max);
    layerParams.maxLevel = mapParams.max;
    layerParams.wrapX = layerParams.wrapY = false;
    layerParams.tileOffset = function () {
      return {x: 0, y: 0};
    };
    layerParams.attribution = '';
  }
  var map = geo.map(mapParams);
  $('#map').toggleClass('debug-label', (
      query.debug === 'true' || query.debug === 'all'))
    .toggleClass('debug-border', (
      query.debug === 'border' || query.debug === 'all'));
  // Add the osm layer with a custom tile url
  var osmLayer = map.createLayer('osm', layerParams);
  // Make variables available as a global for easier debug
  osmDebug.map = map;
  osmDebug.mapParams = mapParams;
  osmDebug.layerParams = layerParams;
  osmDebug.osmLayer = osmLayer;
});
