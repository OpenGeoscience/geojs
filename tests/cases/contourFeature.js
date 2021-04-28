describe('Contour Feature', function () {
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
      var contour = geo.contourFeature({layer: layer});
      expect(contour instanceof geo.contourFeature).toBe(true);
      expect(contour instanceof geo.meshFeature).toBe(true);
      var mesh = geo.meshFeature({layer: layer});
      expect(mesh instanceof geo.meshFeature).toBe(true);
    });
  });

  describe('Check public class methods', function () {
    it('contour/mesh get and set', function () {
      var contour = geo.contourFeature({layer: layer});
      expect(contour.contour().minColor).toEqual('black');
      expect(contour.mesh().minColor).toEqual('black');
      expect(contour.contour('minColor')).toEqual('black');
      expect(contour.contour.get('minColor')()).toEqual('black');
      expect(contour.contour.get().minColor()).toEqual('black');
      expect(contour.contour('minColor', 'white')).toBe(contour);
      expect(contour.contour('minColor')).toEqual('white');
      expect(contour.contour({minColor: 'red'})).toBe(contour);
      expect(contour.contour('minColor')).toEqual('red');
    });
    it('contour gridWidth and gridHeight', function () {
      var contour = geo.contourFeature({layer: layer});
      contour.data(new Array(400));
      expect(contour.contour.get('gridWidth')()).toBe(20);
      expect(contour.contour.get('gridHeight')()).toBe(20);
      delete contour.contour().gridHeight;
      contour.contour({gridWidth: 40});
      expect(contour.contour.get('gridWidth')()).toBe(40);
      expect(contour.contour.get('gridHeight')()).toBe(10);
      delete contour.contour().gridWidth;
      contour.contour({gridHeight: 5});
      expect(contour.contour.get('gridWidth')()).toBe(80);
      expect(contour.contour.get('gridHeight')()).toBe(5);
      contour.data(new Array(200));
      expect(contour.contour.get('gridWidth')()).toBe(40);
      expect(contour.contour.get('gridHeight')()).toBe(5);
    });
    it('actors', function () {
      var contour = geo.webgl.contourFeature({layer: layer});
      expect(contour.actors().length).toBe(1);
    });
  });

  describe('Create contours', function () {
    var vertexList = [
      {x: 0, y: 0, z: 0},
      {x: 0, y: 1, z: 1},
      {x: 0, y: 3, z: 2},
      {x: 1, y: 0, z: 3},
      {x: 2, y: 2, z: 4},
      {x: 3, y: 3, z: 5},
      {x: 4, y: 0, z: null},
      {x: 4, y: 1, z: 7},
      {x: 4, y: 3, z: 8}
    ];

    it('simple', function () {
      var contour1 = {
        gridWidth: 7,
        gridHeight: 2,
        x0: -30,
        y0: -30,
        dx: 6,
        dy: 6,
        values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
      };
      var contour = layer.createFeature('contour').data(
        contour1.values).contour(contour1).style({
        value: function (d) { return d; }});
      var result = contour._createContours();
      expect(result.minValue).toBe(0);
      expect(result.maxValue).toBe(13);
      expect(result.elements.length).toBe(36); /* 6 sq. * 2 tri. * 3 pts. */
      expect(result.pos.length).toBe(42); /* 14 distinct points * 3 coor. */
    });

    it('wrap and close', function () {
      var contour1 = {
        gridWidth: 6,
        gridHeight: 2,
        x0: 30,
        y0: -30,
        dx: 60,
        dy: 60,
        values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      };
      var contour = layer.createFeature('contour').data(
        contour1.values).contour(contour1).style({
        value: function (d) { return d; }});
      var result = contour._createContours();
      expect(result.elements.length).toBe(42); /* 5 + 2 sq. * 2 tri. * 3 pts. */
      expect(result.pos.length).toBe(54); /* 12 + 6 distinct points * 3 coor. */
      expect(result.pos[48]).toBe(-30);  /* wrapped coordinate */
      expect(result.pos[51]).toBe(30);  /* wrapped coordinate */
    });

    it('short data', function () {
      var contour1 = {
        gridWidth: 6,
        gridHeight: 3,
        x0: 30,
        y0: -30,
        dx: -60,
        dy: 60,
        values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
      };
      var contour = layer.createFeature('contour').data(
        contour1.values).contour(contour1).style({
        value: function (d) { return d; }});
      var result = contour._createContours();
      /* This will appear to have only two rows */
      expect(result.elements.length).toBe(42); /* 5 + 2 sq. * 2 tri. * 3 pts. */
      expect(result.pos.length).toBe(54); /* 12 + 6 distinct points * 3 coor. */
      expect(result.pos[48]).toBe(90);
      expect(result.pos[51]).toBe(30);
    });

    it('without wrap', function () {
      var contour1 = {
        gridWidth: 6,
        gridHeight: 2,
        x0: 30,
        y0: -30,
        dx: 60,
        dy: 60,
        values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        wrapLongitude: false
      };
      var contour = layer.createFeature('contour').data(
        contour1.values).contour(contour1).style({
        value: function (d) { return d; }});
      var result = contour._createContours();
      expect(result.elements.length).toBe(30); /* 5 sq. * 2 tri. * 3 pts. */
      expect(result.pos.length).toBe(36); /* 12 distinct points * 3 coor. */
      expect(result.pos[33]).toBe(330);  /* unwrapped coordinate */
    });

    it('wrap but not close', function () {
      var contour1 = {
        gridWidth: 6,
        gridHeight: 2,
        x0: 55,
        y0: -25,
        dx: 50,
        dy: 50,
        values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      };
      var contour = layer.createFeature('contour').data(
        contour1.values).contour(contour1).style({
        value: function (d) { return d; }});
      var result = contour._createContours();
      expect(result.elements.length).toBe(36); /* 5 + 1 sq. * 2 tri. * 3 pts. */
      expect(result.pos.length).toBe(48); /* 12 + 4 distinct points * 3 coor. */
      expect(result.pos[45]).toBe(-55);  /* wrapped coordinate */
    });

    it('empty contour', function () {
      var contour1 = {
        gridWidth: 7,
        gridHeight: 1,
        x0: -30,
        y0: -30,
        dx: 6,
        dy: 6,
        values: [0, 1, 2, 3, 4, 5, 6]
      };
      var contour = layer.createFeature('contour').data(
        contour1.values).contour(contour1).style({
        value: function (d) { return d; }});
      var result = contour._createContours();
      expect(result.elements.length).toBe(0);
      expect(result.pos.length).toBe(21);
    });

    it('no range', function () {
      var contour1 = {
        gridWidth: 7,
        gridHeight: 2,
        x0: -30,
        y0: -30,
        dx: 6,
        dy: 6,
        rangeValues: [1, -1, 1, -1, 1, -1, 1, -1, 1, -1],
        values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
      };
      var contour = layer.createFeature('contour', {
        contour: contour1, style: {value: 0}}).data(contour1.values);
      var result = contour._createContours();
      expect(result.rangeValues).toBe(null);
      expect(result.factor).toBe(1);
    });

    it('square mesh', function () {
      var contour = layer.createFeature('contour').data(vertexList);
      var result = contour._createContours();
      expect(result.minValue).toBe(0);
      expect(result.maxValue).toBe(8);
      expect(result.elements.length).toBe(18); /* 3 sq. * 2 tri. * 3 pts. */
      expect(result.pos.length).toBe(24); /* 8 distinct points * 3 coor. */
    });

    it('square elements each as an array', function () {
      var contour = layer.createFeature('contour', {contour: {
        elements: [[1, 2, 5, 4], [0, 1, 4, 3], [3, 4, 7, 6], [4, 5, 8, 7]]
      }}).data(vertexList);
      var result = contour._createContours();
      expect(result.minValue).toBe(0);
      expect(result.maxValue).toBe(8);
      expect(result.elements.length).toBe(18); /* 3 sq. * 2 tri. * 3 pts. */
      expect(result.pos.length).toBe(24); /* 8 distinct points * 3 coor. */
    });

    it('square elements in a single array', function () {
      var contour = layer.createFeature('contour', {contour: {
        elements: [1, 2, 5, 4, 0, 1, 4, 3, 3, 4, 7, 6, 4, 5, 8, 7],
        elementPacking: 'square'
      }}).data(vertexList);
      var result = contour._createContours();
      expect(result.minValue).toBe(0);
      expect(result.maxValue).toBe(8);
      expect(result.elements.length).toBe(18); /* 3 sq. * 2 tri. * 3 pts. */
      expect(result.pos.length).toBe(24); /* 8 distinct points * 3 coor. */
    });

    it('triangle elements each as an array', function () {
      var contour = layer.createFeature('contour', {contour: {
        elements: [
          [0, 1, 4], [1, 2, 5], [3, 4, 7], [4, 5, 8],
          [4, 3, 0], [5, 4, 1], [7, 6, 3], [8, 7, 4]]
      }}).data(vertexList);
      var result = contour._createContours();
      expect(result.minValue).toBe(0);
      expect(result.maxValue).toBe(8);
      expect(result.elements.length).toBe(21); /* 7 tri. * 3 pts. */
      expect(result.pos.length).toBe(24); /* 8 distinct points * 3 coor. */
    });

    it('triangle elements in a single array', function () {
      var contour = layer.createFeature('contour', {contour: {
        elements: [
          0, 1, 4, 1, 2, 5, 3, 4, 7, 4, 5, 8,
          4, 3, 0, 5, 4, 1, 7, 6, 3, 8, 7, 4],
        elementPacking: 'triangle'
      }}).data(vertexList);
      var result = contour._createContours();
      expect(result.minValue).toBe(0);
      expect(result.maxValue).toBe(8);
      expect(result.elements.length).toBe(21); /* 7 tri. * 3 pts. */
      expect(result.pos.length).toBe(24); /* 8 distinct points * 3 coor. */
    });

    it('stepped range and color', function () {
      var contour1 = {
        gridWidth: 7,
        gridHeight: 2,
        x0: -30,
        y0: -30,
        dx: 6,
        dy: 6,
        colorRange: ['red', 'black', 'blue'],
        rangeValues: [0, 6, 12, 15],
        values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        stepped: true
      };
      var contour = layer.createFeature('contour', {
        contour: contour1, style: {value: 0}}).data(contour1.values);
      var result = contour._createContours();
      expect(result.rangeValues.length).toBe(4);
      expect(result.factor).toBe(0.2);
    });

    it('continuous range and color', function () {
      var contour1 = {
        gridWidth: 7,
        gridHeight: 2,
        x0: -30,
        y0: -30,
        dx: 6,
        dy: 6,
        colorRange: ['red', 'black', 'blue'],
        rangeValues: [0, 6, 15],
        values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        stepped: false
      };
      var contour = layer.createFeature('contour', {
        contour: contour1, style: {value: 0}}).data(contour1.values);
      var result = contour._createContours();
      expect(result.rangeValues.length).toBe(3);
      expect(result.factor).toBe(0.2);
    });
  });
});
