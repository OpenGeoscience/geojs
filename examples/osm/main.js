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

  // Add the osm layer with a custom tile url
  map.createLayer(
    'osm',
    {
      baseUrl: 'http://tile.stamen.com/toner-lite/'
    }
  );
});
