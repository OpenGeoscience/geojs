$(function () {
  'use strict';

  // Create a map object with the OpenStreetMaps base layer.
  var map = geo.map({
    node: '#map',
    center: {
      x: -75.965,
      y: 39.482
    },
    zoom: 4
  });

  // Add the osm layer
  map.createLayer(
    'osm'
  );

  // Create a gl feature layer
  var layer = map.createLayer(
    'feature', { renderer: 'd3' }
  );

  var domesticRoutes = [
    [[-74.0059, 40.7127], [-118.25, 34.05]],
    [[-98, 38.5], [-87.6847, 41.8369]]
  ];

  var intlRoutes = [
    [[-84.6847, 41], [2.3508, 48.8567]]
  ];

  var domestic = layer.createFeature('vector')
    .data(domesticRoutes)
    .origin(function (cities) {
      var origin = cities[0];
      return {x: origin[0], y: origin[1]};
    })
    .delta(function (cities) {
      var origin = cities[0];
      var destination = cities[1];
      var dx = destination[0] - origin[0];
      var dy = destination[1] - origin[1];
      return {
        x: dx,
        y: dy
      };
    })
    .style({
      strokeColor: 'red',
      strokeWidth: 2.0,
      originStyle: 'point',
      endStyle: 'arrow'
    });

  var international = layer.createFeature('vector')
    .data(intlRoutes)
    .origin(function (cities) {
      var origin = cities[0];
      return {x: origin[0], y: origin[1]};
    })
    .delta(function (cities) {
      var origin = cities[0];
      var destination = cities[1];
      var dx = destination[0] - origin[0];
      var dy = destination[1] - origin[1];
      return {
        x: dx,
        y: dy
      };
    })
    .style({
      strokeColor: 'blue',
      strokeWidth: 2.0,
      originStyle: 'bar',
      endStyle: 'wedge'
    });

  international.draw();
  domestic.draw();
  map.draw();
});
