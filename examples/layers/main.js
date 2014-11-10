// Run after the DOM loads
$(function () {
  'use strict';

  // Create an svg layer and return a reference to its dom element.
  function getSvgLayer(map, opts) {

    opts.renderer = 'd3Renderer';
    var layer = map.createLayer('feature', opts);

    return {
      layer: layer,
      svg: layer.canvas()
    };
  }


  // Create a map object
  var map = geo.map({
    node: '#map',
    center: {
      x: -98.0,
      y: 39.5
    },
    zoom: 1
  });

  // Add a base layer
  map.createLayer('osm');



  // Make the map resize with the browser window
  $(window).resize(function () {
    map.resize(0, 0, map.node().width(), map.node().height());
  });

  // Draw the map
  map.draw();
});
