// Run after the DOM loads
$(function () {
  'use strict';

  var map = geo.map({
    node: '#map',
    center: {
      x: -98,
      y: 42
    },
    zoom: 3
  });
  var layer, grid;

  var layerOptions = {
    features: ['grid'],
    opacity: 0.75
  };
  var gridOptions = {
    minIntensity: 0,
    maxIntensity: 100,
    style: {
      color: {
        0.00: {r: 0, g: 0, b: 0, a: 0.0},
        0.25: {r: 0, g: 1, b: 0, a: 0.5},
        0.50: {r: 1, g: 1, b: 0, a: 0.5},
        1.00: {r: 1, g: 0, b: 0, a: 0.5}
      }
    },
    upperLeft: {
      x: -140,
      y: 45
    },
    cellSize: 1, // in degrees, approximately 5 miles
    rowCount: 10,
    updateDelay: 50
  };
  map.createLayer('osm');
  layer = map.createLayer('feature', layerOptions);
  grid = layer.createFeature('grid', gridOptions);
  grid.data(Array(100).fill(0).map(function (v, i) {
    return i;
  }));
  grid.draw();
  /* Make some values available in the global context so curious people can
   * play with them. */
  window.grid = {
    map: map,
    layer: layer,
    layerOptions: layerOptions,
    grid: grid,
    gridOptions: gridOptions
  };

});
