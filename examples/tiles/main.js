// This example should be tried with different query strings.

/* Many parameters can be adjusted via url query parameters:
 *  attribution: override the layer attribution text.
 *  clampBoundsX: 'true' to clamp movement in the horizontal direction.
 *  clampBoundsY: 'true' to clamp movement in the vertical direction.
 *  clampZoom: 'true' to clamp zooming out smaller than the window.
 *  controls: 'false' to hide controls.
 *  debug: 'true' to show tile labels when using the html renderer.  'border'
 *      to draw borders on each tile when using the html renderer.  'all' to
 *      show both labels and borders.  These options just add a class to the
 *      #map element to invoke special css rules.
 *  discrete: 'true' to use discrete zoom.
 *  fade: 'true' to enable image fade in on the html renderer.
 *  h: height of a tiled image (at max zoom).
 *  lower: 'true' (default) or 'false'.  Keep all lower-level tiles if true.
 *      'false' was the old behavior where fewer tiles are rendered, and
 *      panning shows blank areas.
 *  min: minimum zoom level (default is 0).
 *  max: maximum zoom level (default is 16 for maps, or the entire image for
 *      images).
 *  opacity: a css opacity value (typically a float from 0 to 1).
 *  projection: 'parallel' or 'projection' for the camera projection.
 *  renderer: 'vgl' (default), 'd3', 'null', or 'html'.  This picks the
 *      renderer for map tiles.  null or html uses the html renderer.
 *  round: 'round' (default), 'floor', 'ceil'.
 *  subdomains: a comma-separated string of subdomains to use in the {s} part
 *      of the url parameter.  If there are no commas in the string, each letter
 *      is used by itself (e.g., 'abc' is the same as 'a,b,c').
 *  url: url to use for the map files.  Placeholders are allowed.  Default is
 *      http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png .  Other useful
 *      urls are are: /data/tilefancy.png
 *      http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
 *  w: width of a tiled image (at max zoom).  If w and h are specified, a
 *      variety of other changes are made to make this served in image
 *      coordinates.
 *  wrapX: 'true' to wrap the tiles in the horizontal direction.
 *  wrapY: 'true' to wrap the tiles in the vertical direction.
 *  x: map center x
 *  y: map center y
 *  zoom: starting zoom level
 */

var tileDebug = {};

// Run after the DOM loads
$(function () {
  'use strict';

  // Parse query parameters into an object for ease of access
  var query = document.location.search.replace(/(^\?)/, '').split(
    '&').map(function (n) {
      n = n.split('=');
      if (n[0]) {
        this[decodeURIComponent(n[0])] = decodeURIComponent(n[1]);
      }
      return this;
    }.bind({}))[0];

  // hide the controls if requested
  $('#controls').toggleClass('no-controls', query.controls === 'false');
  // populate the controls with the current settings
  $.each(query, function (key, value) {
    if (key.indexOf('"') < 0) {
      var ctl = $('#controls [param-name="' + key + '"]');
      if (ctl.is('[type="checkbox"]')) {
        ctl.prop('checked', value === 'true');
      } else {
        ctl.val(value);
      }
    }
  });
  $('#controls').on('change', change_controls);

  // Set map defaults to use our named node and have a reasonable center and
  // zoom level
  var mapParams = {
    node: '#map',
    center: {
      x: -98.0,
      y: 39.5
    },
    zoom: query.zoom !== undefined ? parseFloat(query.zoom) : 3
  };
  // Set the tile layer defaults to use the specified renderer and opacity
  var layerParams = {
    renderer: query.renderer || 'vgl',
    opacity: query.opacity || '1'
  };
  if (layerParams.renderer === 'null' || layerParams.renderer === 'html') {
    layerParams.renderer = null;
  }
  // Allow a custom tile url, including subdomains.
  if (query.url) {
    layerParams.url = query.url;
  } else {
    layerParams.baseUrl = 'http://otile1.mqcdn.com/tiles/1.0.0/map/';
  }
  if (query.subdomains) {
    if (query.subdomains.indexOf(',') >= 0) {
      layerParams.subdomains = query.subdomains.split(',');
    } else {
      layerParams.subdomains = query.subdomains;
    }
  }
  // For image tile servers, where we know the maximum width and height, use
  // a pixel coordinate system.
  if (query.w && query.h) {
    var w = parseInt(query.w), h = parseInt(query.h);
    // Set a pixel coordinate system where 0, 0 is the upper left and w, h is
    // the lower-right.
    /* If both ingcs and gcs are set to an empty string '', the coordinates
     * will stay at pixel values, but the y values will from from [0, -h).  If
     * '+proj=longlat +axis=esu', '+proj=longlat +axis=enu' are used instead,
     * the y coordinate will be reversed.  It would be better to install a new
     * 'inverse-y' projection into proj4, but this works without that change.
     * The 'longlat' projection functionally is a no-op in this case. */
    mapParams.ingcs = '+proj=longlat +axis=esu';
    mapParams.gcs = '+proj=longlat +axis=enu';
    /* mapParams.ingcs = mapParams.gcs = ''; */
    mapParams.maxBounds = {left: 0, top: 0, right: w, bottom: h};
    mapParams.center = {x: w / 2, y: h / 2};
    mapParams.max = Math.ceil(Math.log(Math.max(w, h) / 256) / Math.log(2));
    mapParams.clampBoundsX = mapParams.clampBoundsY = true;
    // unitsPerPixel is at zoom level 0.  We want each pixel to be 1 at the
    // maximum zoom
    mapParams.unitsPerPixel = Math.pow(2, mapParams.max);
    layerParams.maxLevel = mapParams.max;
    layerParams.wrapX = layerParams.wrapY = false;
    layerParams.tileOffset = function () {
      return {x: 0, y: 0};
    };
    layerParams.attribution = '';
    layerParams.tileRounding = Math.ceil;
  }
  // Parse additional query options
  if (query.x !== undefined) {
    mapParams.center.x = parseFloat(query.x);
  }
  if (query.y !== undefined) {
    mapParams.center.y = parseFloat(query.y);
  }
  if (query.min !== undefined) {
    mapParams.min = parseFloat(query.min);
  }
  if (query.max !== undefined) {
    mapParams.max = parseFloat(query.max);
  }
  // allow a generous max tile level so it is never the limit
  if (!layerParams.maxLevel) {
    layerParams.maxLevel = 25;
  }
  if (query.attribution !== undefined) {
    layerParams.attribution = query.attribution;
  }
  if (query.round) {
    layerParams.tileRounding = Math[query.round];
  }
  // Populate boolean flags for the map
  $.each({
      clampBoundsX: 'clampBoundsX',
      clampBoundsY: 'clampBoundsY',
      clampZoom: 'clampZoom',
      discrete: 'discreteZoom'
    }, function (qkey, mkey) {
      if (query[qkey] !== undefined) {
        mapParams[mkey] = query[qkey] === 'true';
      }
    });
  // Populate boolean flags for the tile layer
  $.each({
      lower: 'keepLower',
      wrapX: 'wrapX',
      wrapY: 'wrapY'
    }, function (qkey, lkey) {
      if (query[qkey] !== undefined) {
        layerParams[lkey] = query[qkey] === 'true';
      }
    });
  // Create a map object
  var map = geo.map(mapParams);
  // Set the projection.  This has to be set on the camera, not in the map
  // parameters
  if (query.projection) {
    map.camera().projection = query.projection;
  }
  // Enable debug classes, if requested.
  $('#map').toggleClass('debug-label', (
      query.debug === 'true' || query.debug === 'all'))
    .toggleClass('debug-border', (
      query.debug === 'border' || query.debug === 'all'))
    .toggleClass('fade-image', (query.fade === 'true'));
  // Add the tile layer with the specified parameters
  var osmLayer = map.createLayer('osm', layerParams);
  // Make variables available as a global for easier debug
  tileDebug.map = map;
  tileDebug.mapParams = mapParams;
  tileDebug.layerParams = layerParams;
  tileDebug.osmLayer = osmLayer;

  /**
   * Handle changes to our controls.
   * @param evt jquery evt that triggered this call.
   */
  function change_controls(evt) {
    var ctl = $(evt.target),
        param = ctl.attr('param-name'),
        value = ctl.val();
    if (ctl.is('[type="checkbox"]')) {
      value = ctl.is(':checked') ? 'true' : 'false';
    }
    if (value === '' && ctl.attr('placeholder')) {
      value = ctl.attr('placeholder');
    }
    if (!param || value === query[param]) {
      return;
    }
    var processedValue = (ctl.is('[type="checkbox"]') ?
        (value === 'true') : value);
    switch (param) {
      case 'debug':
        $('#map').toggleClass('debug-label', (
            value === 'true' || value === 'all'))
          .toggleClass('debug-border', (
            value === 'border' || value === 'all'));
        break;
      case 'discrete':
        mapParams.discreteZoom = processedValue;
        map.discreteZoom(processedValue);
        break;
      case 'fade':
        $('#map').toggleClass('fade-image', processedValue);
        break;
      case 'lower':
        layerParams.keepLower = (value === 'true');
        break;
      case 'max': case 'min':
        mapParams[param] = processedValue = parseFloat(value);
        map.zoomRange(mapParams);
        break;
      case 'projection':
        map.camera().projection = value;
        break;
      case 'renderer':
        layerParams[param] = value;
        if (layerParams.renderer === 'html') {
          layerParams.renderer = null;
        }
        map.deleteLayer(osmLayer);
        osmLayer = map.createLayer('osm', layerParams);
        tileDebug.osmLayer = osmLayer;
        break;
      case 'round':
        layerParams.tileRounding = Math[value];
        break;
      case 'x': case 'y':
        var coord = map.center();
        coord[param] = mapParams[param] = parseFloat(value);
        map.center(coord);
        break;
      case 'zoom':
        mapParams[param] = processedValue = parseFloat(value);
        map.zoom(processedValue);
        break;
      default:
        if (ctl.is('.layerparam')) {
          layerParams[param] = processedValue;
          if (param === 'url' && layerParams.baseUrl) {
            delete layerParams.baseUrl;
          }
          if (osmLayer[param]) {
            osmLayer[param](processedValue);
          }
        } else if (ctl.is('.mapparam')) {
          mapParams[param] = processedValue;
          if (map[param]) {
            map[param](processedValue);
          }
        } else {
          return;
        }
        break;
    }
    if (ctl.is('.layerparam') && ctl.attr('reload') === 'true') {
      map.deleteLayer(osmLayer);
      osmLayer = map.createLayer('osm', layerParams);
    }
    // update the url to reflect the changes
    query[param] = value;
    if (value === '' || (ctl.attr('placeholder') &&
        value === ctl.attr('placeholder'))) {
      delete query[param];
    }
    var newurl = window.location.protocol + '//' + window.location.host +
        window.location.pathname + '?' + $.param(query);
    window.history.replaceState(query, '', newurl);
  }
});
