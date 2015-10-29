window.startTest = function (done) {
  'use strict';

  var mapOptions = { center : { y: 0, x: 0 }, zoom: 2 };

  var map = window.geoTests.createOsmMap(mapOptions, null, true);

  var l1 = map.children()[0],
      l2 = map.createLayer('feature'),
      l3 = map.createLayer('feature', {renderer: 'd3'}),
      layers = [l1, l2, l3];


  l2.createFeature('point')
    .data([{x: -20, y: 0}, {x: 0, y: 0}])
    .style({
      stroke: false,
      fillColor: 'red',
      radius: 15,
      fillOpacity: 1
    });

  l3.createFeature('point')
    .data([{x: 20, y: 0}, {x: 0, y: 0}])
    .style({
      stroke: false,
      fillColor: 'blue',
      radius: 15,
      fillOpacity: 1
    });

  // set the layer order
  window.layerOrder = function (z1, z2, z3) {
    l1.zIndex(z1);
    l2.zIndex(z2);
    l3.zIndex(z3);
  };

  window.moveUp = function (layer, n) {
    layers[layer].moveUp(n);
  };

  window.moveDown = function (layer, n) {
    layers[layer].moveDown(n);
  };

  map.draw();
  map.onIdle(done);
};
