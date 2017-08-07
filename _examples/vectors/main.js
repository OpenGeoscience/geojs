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
    'feature', {features: ['vector']}
  );

  var routes = [
    [[-74.0059, 40.7127], [-118.25, 34.05]],
    [[-98, 38.5], [-87.6847, 41.8369]],
    [[-60.0059, 39.7127], [-58.25, 35.05]],
    [[-80, 33.5], [-27.6847, 25.8369]]
  ];

  layer.createFeature('vector')
    .data(routes)
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
      strokeColor: function (cities, i) {
        return i % 2 ? 'red' : 'blue';
      },
      strokeWidth: 2.0,
      originStyle: function (cities, i) {
        return i % 2 ? 'point' : 'none';
      },
      endStyle: function (cities, i) {
        return i % 2 ? 'bar' : 'arrow';
      }
    });

  var secondaryRoutes = [
    [[-65.0059, 39.7127], [-100.25, 35.05]],
    [[-90, 38.5], [-87.6847, 25.8369]]
  ];

  layer.createFeature('vector')
    .data(secondaryRoutes)
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
      strokeColor: function (cities, i) {
        return i % 2 ? 'orange' : 'purple';
      },
      strokeWidth: 2.0,
      originStyle: function (cities, i) {
        return 'bar';
      },
      endStyle: function (cities, i) {
        return i % 2 ? 'wedge' : 'arrow';
      }
    });

  /* We could draw the two features as we create them.  Instead, this ensures
   * that all features get drawn. */
  map.draw();
});
