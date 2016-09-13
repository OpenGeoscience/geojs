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
    maxIntensity: 1,
    style: {
      color: {
        0.00: {r: 0, g: 0, b: 0, a: 0.0},
        0.25: {r: 0, g: 1, b: 0, a: 0.5},
        0.50: {r: 1, g: 1, b: 0, a: 0.8},
        1.00: {r: 1, g: 0, b: 0, a: 1.0}
      }
    },
    upperLeft: {
      x: 0,
      y: 0
    },
    cellSize: 1E-2, //degrees
    rowCount: 316,
    updateDelay: 50
  };
  map.createLayer('osm');
  layer = map.createLayer('feature', layerOptions);
  grid = layer.createFeature('grid', gridOptions)
  grid.data(Array(1E5).fill(0).map(function () {
    return Math.random()
  }))
  grid.draw()
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
