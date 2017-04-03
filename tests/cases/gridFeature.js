// Test geo.canvas.gridFeature
describe('canvas grid feature', function () {
  var geo = require('../test-utils').geo;
  var $ = require('jquery');

  beforeEach(function () {
    $('<div id="map-canvas-grid-feature"/>')
      .css({width: '500px', height: '400px'}).appendTo('body');
  });

  afterEach(function () {
    $('#map-canvas-grid-feature').remove();
  });

  describe('canvas grid feature', function () {
    'use strict';

    var mockAnimationFrame = require('../test-utils').mockAnimationFrame;
    var stepAnimationFrame = require('../test-utils').stepAnimationFrame;
    var unmockAnimationFrame = require('../test-utils').unmockAnimationFrame;

    var map, layer1, grid1, width = 800, height = 600;
    var clock;
    beforeEach(function () {
      clock = sinon.useFakeTimers();
    });
    afterEach(function () {
      clock.restore();
    });

    it('Setup map', function () {
      mockAnimationFrame();
      map = geo.map({node: '#map-canvas-grid-feature', center: [0, 0], zoom: 3});
      map.resize(0, 0, width, height);
    });

    it('Add grid to a layer', function () {
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
      var grid_data = Array([
        [1, 2, 3],
        [3, 4, 0],
        [5, 6, 100]
      ]);
      layer1 = map.createLayer('feature', layerOptions);
      grid1 = layer1.createFeature('grid', gridOptions);
      grid1.data(grid_data);
      grid1.draw();
      map.draw();
      stepAnimationFrame(new Date().getTime());
      expect(layer1.children().length).toBe(1);
    });

    it('Validate coords', function () {
      expect(grid1.upperLeft().x).toBe(-140);
      expect(grid1.upperLeft().y).toBe(45);
    });

    it('Validate cellsize', function () {
      expect(grid1.cellSize()).toBe(1);
    });

    it('Validate maximum intensity', function () {
      expect(grid1.maxIntensity()).toBe(100.0);
    });

    it('Validate minimum intensity', function () {
      expect(grid1.minIntensity()).toBe(0.0);
    });

    it('Remove a feature from a layer', function () {
      layer1.deleteFeature(grid1).draw();
      expect(layer1.children().length).toBe(0);
      // stop mocking animation frames
      unmockAnimationFrame();
    });
  });
});
