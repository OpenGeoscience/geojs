describe('Contour Feature', function () {
  'use strict';

  var map, layer;
  var geo = require('../test-utils').geo;
  var createMap = require('../test-utils').createMap;
  var destroyMap = require('../test-utils').destroyMap;
  var mockVGLRenderer = geo.util.mockVGLRenderer;
  var restoreVGLRenderer = geo.util.restoreVGLRenderer;

  beforeEach(function () {
    mockVGLRenderer();
    map = createMap({
      'center': [0, 0],
      'zoom': 3
    }, {width: '500px', height: '300px'});
    layer = map.createLayer('feature', {'renderer': 'vgl'});
  });

  afterEach(function () {
    destroyMap();
    restoreVGLRenderer();
  });

  it('Create a contour', function () {
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
    var result = contour.createContours();
    expect(result.minValue).toBe(0);
    expect(result.maxValue).toBe(13);
    expect(result.elements.length).toBe(36); /* 6 sq. * 2 tri. * 3 pts. */
    expect(result.pos.length).toBe(42); /* 14 distinct points * 3 coor. */
  });

  it('Create a contour that will wrap and close', function () {
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
    var result = contour.createContours();
    expect(result.elements.length).toBe(42); /* 5 + 2 sq. * 2 tri. * 3 pts. */
    expect(result.pos.length).toBe(54); /* 12 + 6 distinct points * 3 coor. */
    expect(result.pos[48]).toBe(-30);  /* wrapped coordinate */
    expect(result.pos[51]).toBe(30);  /* wrapped coordinate */
  });

  it('Create a contour and ask it to not wrap', function () {
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
    var result = contour.createContours();
    expect(result.elements.length).toBe(30); /* 5 sq. * 2 tri. * 3 pts. */
    expect(result.pos.length).toBe(36); /* 12 distinct points * 3 coor. */
    expect(result.pos[33]).toBe(330);  /* unwrapped coordinate */
  });

  it('Create a contour that will wrap but not close', function () {
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
    var result = contour.createContours();
    expect(result.elements.length).toBe(36); /* 5 + 1 sq. * 2 tri. * 3 pts. */
    expect(result.pos.length).toBe(48); /* 12 + 4 distinct points * 3 coor. */
    expect(result.pos[45]).toBe(-55);  /* wrapped coordinate */
  });

});
