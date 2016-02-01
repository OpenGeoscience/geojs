$(function(){
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
    'feature',
    {
      renderer: 'd3'
    }
  );

  var data = [{origin: [-74.0059, 40.7127]}, {origin: [-118.25, 34.05]}];

  var vector = layer.createFeature('vector')
    .data(data)
    .origin(function(d){
      return {x: d.origin[0], y: d.origin[1]};
    });
  var i = 0;
  var r = 5;

  function tick(){
    var theta = -6*i % 360 * (Math.PI/180) + Math.PI/2;
    var y2 = Math.sin(theta) * r;
    var x2 = Math.cos(theta) * r;
    vector.delta(function(d){
      return {
        x: x2,
        y: y2
      }
    });
    i++;
    vector.draw();
  }
  tick();
  //setInterval(tick, 1000);

  map.draw();
});
