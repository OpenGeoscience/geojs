/* globals utils */

var debug = {};

// Run after the DOM loads
$(function () {
  'use strict';

  // Get the query parameters and set controls appropriately.  The query takes:
  //   map: the png file used for the pixel map.
  //   json: the json file for the starting state.
  var query = utils.getQuery();
  var pixelmapUrl = query.map || 'pixelmap.png';
  var pixelmapJSON = query.json === undefined ? 'pixelmap.json' : query.json;
  var map, mapParams, osm, osmParams, layer, pixelmap, pixelmapParams;
  // Center the map on the United States
  mapParams = {
    node: '#map',
    center: {x: -98.58333, y: 39.83333},
    zoom: 4,
    discreteZoom: false
  };
  map = geo.map(mapParams);
  // Add a tile layer to the map
  osm = map.createLayer('osm', osmParams);
  // Create a feature layer that supports the pixelmap feature.  This can be
  // overridden to use a specific renderer
  layer = map.createLayer('feature', {
    renderer: query.renderer ? (query.renderer === 'html' ? null : query.renderer) : undefined,
    features: query.renderer ? undefined : ['pixelmap'],
    opacity: 0.65
  });
  // Our default pixelmap covers a known geographic region
  pixelmapParams = {
    selectionAPI: true,
    url: pixelmapUrl,
    position: {ul: {x: -180, y: 71.471178}, lr: {x: -60, y: 13.759032}},
    color: function (d, idx) {
      // Always set index 0 to transparent.  Other indicies are set based on
      // the data value
      var color = {r: 0, g: 0, b: 0, a: 0};
      if (idx && d && d.value) {
        color = d.value === 'R' ? 'red' : 'blue';
      }
      return color;
    }
  };
  pixelmap = layer.createFeature('pixelmap', pixelmapParams);
  layer.draw();
  // When the user left clicks, cycle through three states.  A right click
  // clears the state.
  pixelmap.geoOn(geo.event.feature.mouseclick, function (evt) {
    var data = pixelmap.data();
    if (!data) {
      return;
    }
    if (data[evt.index] === undefined) {
      data[evt.index] = {};
    }
    var val = data[evt.index].value;
    if (evt.mouse.buttonsDown.left) {
      var cycle = {'D': 'R', 'R': '', '': 'D'};
      val = cycle[cycle[val] !== undefined ? val : ''];
    } else if (evt.mouse.buttonsDown.right) {
      val = '';
    }
    if (val !== data[evt.index].value) {
      data[evt.index].value = val;
      pixelmap.data(data).draw();
    }
  });
  // Load the JSON file
  if (pixelmapJSON) {
    $.ajax({url: pixelmapJSON}).done(function (resp) {
      pixelmap.data(resp);
      pixelmap.draw();
    });
  }

  // Expose some internal to make it easier to play with the example from the
  // browser console.
  debug.map = map;
  debug.mapParams = mapParams;
  debug.osm = osm;
  debug.osmParams = osmParams;
  debug.layer = layer;
  debug.pixelmap = pixelmap;
  debug.pixelmapParams = pixelmapParams;
});
