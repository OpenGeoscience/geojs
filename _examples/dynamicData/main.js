// Run after the DOM loads
$(function () {
  'use strict';

  // Create a map object
  var map = geo.map({node: '#map', zoom: 3});

  // Add and start a clock
  var clock = geo.clock();
  var omega = 10000;

  clock.object(map);
  clock.start(0)
    .step(1)
    .end(omega)
    .state('play');

  // Add an OSM layer
  map.createLayer('osm');

  // Add a feature layer with a D3 renderer.  We could, instead, ask for any
  // renderer that supports point features, like so:
  //  var features = map.createLayer('feature', {features: ['point']});
  var features = map.createLayer('feature', {renderer: 'd3'});

  var numberOfFeatures = 200;

  var alpha = 50.0;
  var beta = 10.0;
  var gamma = alpha / beta;

  // Update the features when value of the clock changes
  map.geoOn(geo.event.clock.change, function (evt) {
    features.clear();

    // Create the data for the features
    var currentTime = evt.current.valueOf();
    var theta = 2.0 * Math.PI * currentTime / omega;
    var positions = [];

    for (var i = 0; i < numberOfFeatures; ++i) {
      var t = theta + 2.0 * Math.PI * i / numberOfFeatures;
      var x = alpha * Math.cos(t) + beta * Math.cos(gamma * t);
      var y = alpha * Math.sin(t) + beta * Math.sin(gamma * t);

      positions.push({x: x, y: y});
    }

    // Create and draw the features
    var yellow = {r: 255, g: 255, b: 0};
    var red = {r: 255, g: 0, b: 0};

    features.createFeature('point')
      .data(positions)
      .position(function (data) {
        return {x: data.x, y: data.y};
      })
      .style('radius', 5)
      .style('fillColor', yellow)
      .style('strokeColor', red)
      .style('strokeWidth', 1)
      .draw();
  });

});
