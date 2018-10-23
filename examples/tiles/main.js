// This example should be tried with different query strings.

/* Many parameters can be adjusted via url query parameters:
 *  allowRotation: 'true' to allow map rotation, 'false' to prevent it, or
 *      allowable rotations in degrees.
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
 *  maxBoundsBottom: maximum bounds bottom value.
 *  maxBoundsLeft: maximum bounds left value.
 *  maxBoundsRight: maximum bounds right value.
 *  maxBoundsTop: maximum bounds top value.
 *  opacity: a css opacity value (typically a float from 0 to 1).
 *  projection: 'parallel' or 'projection' for the camera projection.
 *  renderer: 'vgl' (default), 'canvas', 'd3', 'null', or 'html'.  This picks
 *      the renderer for map tiles.  null or html uses the html renderer.
 *      'default' uses the default renderer for the user's platform.
 *  round: 'round' (default), 'floor', 'ceil'.
 *  subdomains: a comma-separated string of subdomains to use in the {s} part
 *      of the url parameter.  If there are no commas in the string, each letter
 *      is used by itself (e.g., 'abc' is the same as 'a,b,c').
 *  unitsPerPixel: set the units per pixel at zoom level 0.
 *  url: url to use for the map files.  Placeholders are allowed.  Default is
 *      https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png .  Other useful
 *      urls are are: /data/tilefancy.png
 *      http://tile.stamen.com/toner-lite/{z}/{x}/{y}.png
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
  // When a text input is altered, wait a short time then process the change.
  // This allows the web page to be responsive without showing too many partial
  // values.
  var throttledInputEventTimer = null;
  $('#controls').on('input', function (evt) {
    if (throttledInputEventTimer) {
      window.clearTimeout(throttledInputEventTimer);
    }
    throttledInputEventTimer = window.setTimeout(function () {
      change_controls(evt);
    }, 1000);
  });

  // Set map defaults to use our named node and have a reasonable center and
  // zoom level
  var mapParams = {
    node: '#map',
    center: {
      x: -98.0,
      y: 39.5
    },
    maxBounds: {}
  };
  // Set the tile layer defaults to use the specified renderer and opacity
  var layerParams = {
    renderer: query.renderer && query.renderer !== 'default' ? query.renderer : undefined,
    opacity: query.opacity || '1',
    /* Always use a larger cache so if keepLower is changed, we still have a
     * big enough cache. */
    cacheSize: 600,
    attribution: $('#url-list [value="' + $('#layer-url').val() + '"]').attr(
      'credit')
  };
  if (layerParams.renderer === 'null' || layerParams.renderer === 'html') {
    layerParams.renderer = null;
  }
  // Default values for spring-back
  var springEnabled = {spring: {enabled: true, springConstant: 0.00005}},
      springDisabled = {spring: {enabled: false}};
  // Allow a custom tile url, including subdomains.
  if (query.url) {
    layerParams.url = query.url;
  } else {
    layerParams.url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
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
    var pixelParams = geo.util.pixelCoordinateParams(
      '#map', parseInt(query.w, 10), parseInt(query.h, 10),
      layerParams.tileWidth || 256, layerParams.tileHeight || 256);
    $.extend(mapParams, pixelParams.map);
    $.extend(layerParams, pixelParams.layer);
  }
  mapParams.zoom = query.zoom !== undefined ? parseFloat(query.zoom) : 3;
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
  if (query.maxBoundsLeft !== undefined) {
    mapParams.maxBounds.left = parseFloat(query.maxBoundsLeft);
  }
  if (query.maxBoundsRight !== undefined) {
    mapParams.maxBounds.right = parseFloat(query.maxBoundsRight);
  }
  if (query.maxBoundsTop !== undefined) {
    mapParams.maxBounds.top = parseFloat(query.maxBoundsTop);
  }
  if (query.maxBoundsBottom !== undefined) {
    mapParams.maxBounds.bottom = parseFloat(query.maxBoundsBottom);
  }
  if (query.allowRotation) {
    mapParams.allowRotation = get_allow_rotation(query.allowRotation);
  }
  if (query.attribution !== undefined) {
    layerParams.attribution = query.attribution;
  }
  if (query.round) {
    layerParams.tileRounding = Math[query.round];
  }
  if (query.tileWidth) {
    layerParams.tileWidth = parseInt(query.tileWidth, 10);
  }
  if (query.tileHeight) {
    layerParams.tileHeight = parseInt(query.tileHeight, 10);
  }
  if (query.max !== undefined) {
    mapParams.max = parseFloat(query.max);
  }
  if (query.minLevel !== undefined) {
    layerParams.minLevel = parseInt(query.minLevel, 10);
  }
  if (query.maxLevel !== undefined) {
    layerParams.maxLevel = parseInt(query.maxLevel, 10);
  }
  // allow a generous max tile level so it is never the limit
  if (!layerParams.maxLevel) {
    layerParams.maxLevel = 25;
  }
  if (query.unitsPerPixel !== undefined) {
    mapParams.unitsPerPixel = parseFloat(query.unitsPerPixel);
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
  // Set the spring back.  This is set on the map interactor.
  if (query.spring) {
    map.interactor().options(springEnabled);
  }
  // Compute default values for zoom animation, then set the map interactor
  var zoomAnimationDefault = map.interactor().options().zoomAnimation,
      zoomAnimationEnabled = {zoomAnimation: $.extend(
        {}, zoomAnimationDefault, {enabled: true})},
      zoomAnimationDisabled = {zoomAnimation: {enabled: false}};
  map.interactor().options(query.animateZoom !== 'false' ?
    zoomAnimationEnabled : zoomAnimationDisabled);
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
      case 'allowRotation':
        mapParams.allowRotation = get_allow_rotation(value);
        map.allowRotation(mapParams.allowRotation);
        break;
      case 'animateZoom':
        map.interactor().options(
          value === 'true' ? zoomAnimationEnabled : zoomAnimationDisabled);
        break;
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
        mapParams[param] = parseFloat(value);
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
        if (layerParams.renderer === 'default') {
          layerParams.renderer = undefined;
        }
        map.deleteLayer(osmLayer);
        osmLayer = map.createLayer('osm', layerParams);
        tileDebug.osmLayer = osmLayer;
        break;
      case 'round':
        layerParams.tileRounding = Math[value];
        break;
      case 'spring':
        map.interactor().options(
          value === 'true' ? springEnabled : springDisabled);
        break;
      case 'url':
        var url = processedValue;
        layerParams[param] = processedValue;
        osmLayer.url(url);
        osmLayer.attribution($('#url-list [value="' + value + '"]').attr(
          'credit'));
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
    if (ctl.is('.layerparam,.cameraparam') && ctl.attr('reload') === 'true') {
      map.deleteLayer(osmLayer);
      osmLayer = map.createLayer('osm', layerParams);
      tileDebug.osmLayer = osmLayer;
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

  /* Return the value to set for the allowRotation parameter.
   * @param value the value in the query string.
   * @returns true, false, or a function.
   */
  function get_allow_rotation(value) {
    if (!parseFloat(value)) {
      return value !== 'false';
    }
    return function (rotation) {
      var factor = 180 / Math.PI / parseFloat(value);
      return Math.round(rotation * factor) / factor;
    };
  }
});
