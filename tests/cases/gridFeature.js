describe('Grid Feature', function () {
  'use strict';

  var map, layer;
  var geo = require('../test-utils').geo;
  var createMap = require('../test-utils').createMap;
  var destroyMap = require('../test-utils').destroyMap;
  var mockWebglRenderer = geo.util.mockWebglRenderer;
  var restoreWebglRenderer = geo.util.restoreWebglRenderer;

  beforeEach(function () {
    mockWebglRenderer();
    map = createMap({
      'center': [0, 0],
      'zoom': 3
    }, {width: '500px', height: '300px'});
    layer = map.createLayer('feature', {'renderer': 'webgl'});
  });

  afterEach(function () {
    destroyMap();
    restoreWebglRenderer();
  });

  describe('create', function () {
    it('direct create', function () {
      var grid = geo.gridFeature({layer: layer});
      expect(grid instanceof geo.gridFeature).toBe(true);
      expect(grid instanceof geo.meshFeature).toBe(true);
      var mesh = geo.meshFeature({layer: layer});
      expect(mesh instanceof geo.meshFeature).toBe(true);
    });
  });

  describe('Check public class methods', function () {
    it('grid/mesh get and set', function () {
      var grid = geo.gridFeature({layer: layer});
      expect(grid.grid().minColor).toEqual('black');
      expect(grid.mesh().minColor).toEqual('black');
      expect(grid.grid('minColor')).toEqual('black');
      expect(grid.grid.get('minColor')()).toEqual('black');
      expect(grid.grid.get().minColor()).toEqual('black');
      expect(grid.grid('minColor', 'white')).toBe(grid);
      expect(grid.grid('minColor')).toEqual('white');
      expect(grid.grid({minColor: 'red'})).toBe(grid);
      expect(grid.grid('minColor')).toEqual('red');
    });
    it('grid gridWidth and gridHeight', function () {
      var grid = geo.gridFeature({layer: layer});
      grid.data(new Array(400));
      expect(grid.grid.get('gridWidth')()).toBe(20);
      expect(grid.grid.get('gridHeight')()).toBe(20);
      delete grid.grid().gridHeight;
      grid.grid({gridWidth: 40});
      expect(grid.grid.get('gridWidth')()).toBe(40);
      expect(grid.grid.get('gridHeight')()).toBe(10);
      delete grid.grid().gridWidth;
      grid.grid({gridHeight: 5});
      expect(grid.grid.get('gridWidth')()).toBe(80);
      expect(grid.grid.get('gridHeight')()).toBe(5);
      grid.data(new Array(200));
      expect(grid.grid.get('gridWidth')()).toBe(40);
      expect(grid.grid.get('gridHeight')()).toBe(5);
    });
    it('actors', function () {
      var grid = geo.webgl.gridFeature({layer: layer});
      expect(grid.actors().length).toBe(1);
    });
  });

  describe('Create grids', function () {
    it('simple', function () {
      var grid1 = {
        gridWidth: 8,
        gridHeight: 3,
        x0: -30,
        y0: -30,
        dx: 6,
        dy: 6,
        values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
      };
      var grid = layer.createFeature('grid').data(
        grid1.values).grid(grid1).style({
        value: function (d) { return d; }});
      var result = grid._createGrids();
      expect(result.minValue).toBe(0);
      expect(result.maxValue).toBe(13);
      expect(result.elements.length).toBe(84); /* 14 sq. * 2 tri. * 3 pts. */
      expect(result.pos.length).toBe(72); /* 24 distinct points * 3 coor. */
    });

    it('empty values', function () {
      var grid1 = {
        gridWidth: 8,
        gridHeight: 3,
        x0: -30,
        y0: -30,
        dx: 6,
        dy: 6,
        values: [0, 1, null, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, null]
      };
      var grid = layer.createFeature('grid', {grid: grid1}).data(grid1.values);
      var result = grid._createGrids();
      expect(result.minValue).toBe(0);
      expect(result.maxValue).toBe(12);
      expect(result.elements.length).toBe(72); /* 12 sq. * 2 tri. * 3 pts. */
      expect(result.pos.length).toBe(69); /* 23 distinct points * 3 coor. */
    });

    it('short data', function () {
      var grid1 = {
        gridWidth: 6,
        gridHeight: 3,
        x0: 30,
        y0: -30,
        dx: -60,
        dy: 60,
        values: [0, 1, 2, 3, 4, 5, 6, 7, 8]
      };
      var grid = layer.createFeature('grid').data(
        grid1.values).grid(grid1).style({
        value: function (d) { return d; }});
      var result = grid._createGrids();
      /* This will appear to have only two rows */
      expect(result.elements.length).toBe(42); /* 5 + 2 sq. * 2 tri. * 3 pts. */
      expect(result.pos.length).toBe(54); /* 12 + 6 distinct points * 3 coor. */
      expect(result.pos[48]).toBe(90);
      expect(result.pos[51]).toBe(30);
    });
  });
});
