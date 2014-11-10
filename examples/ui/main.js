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
    zoom: 1
  });

  // Add the osm layer
  map.createLayer('osm');

  // Add a layer for the ui elements and create a zoom slider
  map.createLayer('ui')
    .createWidget('slider');

  // Make the map resize with the browser window
  $(window).resize(function () {
    map.resize(0, 0, map.node().width(), map.node().height());
  });

  // Draw the map
  map.draw();
});
