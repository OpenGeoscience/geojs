describe('Isoline Feature', function () {
  'use strict';

  var geo = require('../test-utils').geo;
  var createMap = require('../test-utils').createMap;
  var destroyMap = require('../test-utils').destroyMap;
  var closeToEqual = require('../test-utils').closeToEqual;
  var mockVGLRenderer = geo.util.mockVGLRenderer;
  var restoreVGLRenderer = geo.util.restoreVGLRenderer;
  var mockAnimationFrame = require('../test-utils').mockAnimationFrame;
  var stepAnimationFrame = require('../test-utils').stepAnimationFrame;
  var unmockAnimationFrame = require('../test-utils').unmockAnimationFrame;
  var map, layer, canvasLayer;
  var vertexList = [
    {x: 0, y: 0, z: 0},
    {x: 0, y: 1, z: 1},
    {x: 0, y: 3, z: 2},
    {x: 1, y: 0, z: 3},
    {x: 2, y: 2, z: 4},
    {x: 3, y: 3, z: 5},
    {x: 4, y: 0, z: null},
    {x: 4, y: 1, z: 7},
    {x: 4, y: 3, z: 8},
    {x: 5, y: 0, z: 7},
    {x: 5, y: 2, z: 6},
    {x: 5, y: 3, z: 5}
  ];
  var squareElements = [
    [1, 2, 5, 4], [0, 1, 4, 3],
    [3, 4, 7, 6], [4, 5, 8, 7],
    [6, 7, 10, 9], [7, 8, 11, 10]];
  var triangleElements = [
    [0, 1, 4], [1, 2, 5], [3, 4, 7], [4, 5, 8],
    [4, 3, 0], [5, 4, 1], [7, 6, 3], [8, 7, 4],
    [6, 7, 9], [10, 9, 7], [7, 8, 10], [11, 10, 8]];

  beforeEach(function () {
    mockVGLRenderer();
    mockAnimationFrame();
    map = createMap({
      'center': [2.5, 1.5],
      'zoom': 9
    }, {width: '500px', height: '300px'});
    layer = map.createLayer('feature', {'renderer': 'vgl'});
    canvasLayer = map.createLayer('feature', {'renderer': 'canvas'});
  });

  afterEach(function () {
    destroyMap();
    unmockAnimationFrame();
    restoreVGLRenderer();
  });

  describe('create', function () {
    it('direct create', function () {
      var isoline = geo.isolineFeature({layer: layer});
      expect(isoline instanceof geo.isolineFeature).toBe(true);
      expect(isoline instanceof geo.meshFeature).toBe(true);
      var mesh = geo.meshFeature({layer: layer});
      expect(mesh instanceof geo.meshFeature).toBe(true);
    });
  });

  describe('Check private class methods', function () {
    it('_addSegment', function () {
      var isoline = geo.isolineFeature({layer: layer});
      var chains = [];
      isoline._addSegment(chains, [0, 1], [2, 3]);
      expect(chains.length).toBe(1);
      expect(chains[0].length).toBe(2);
      expect(chains[0][0]).toEqual([0, 1]);
      expect(chains[0][1]).toEqual([2, 3]);
      isoline._addSegment(chains, [2, 3], [4, 5]);
      expect(chains.length).toBe(1);
      expect(chains[0].length).toBe(3);
      expect(chains[0][0]).toEqual([0, 1]);
      expect(chains[0][2]).toEqual([4, 5]);
      isoline._addSegment(chains, [6, 7], [0, 1]);
      expect(chains.length).toBe(1);
      expect(chains[0].length).toBe(4);
      expect(chains[0][0]).toEqual([6, 7]);
      expect(chains[0][3]).toEqual([4, 5]);
      isoline._addSegment(chains, [8, 9], [10, 11]);
      expect(chains.length).toBe(2);
      expect(chains[0].length).toBe(4);
      expect(chains[1].length).toBe(2);
      isoline._addSegment(chains, [12, 13], [8, 9]);
      expect(chains.length).toBe(2);
      expect(chains[0].length).toBe(4);
      expect(chains[1].length).toBe(3);
      isoline._addSegment(chains, [10, 11], [6, 7]);
      expect(chains.length).toBe(1);
      expect(chains[0].length).toBe(7);
      expect(chains[0][0]).toEqual([12, 13]);
      expect(chains[0][6]).toEqual([4, 5]);
      isoline._addSegment(chains, [4, 5], [12, 13]);
      expect(chains.length).toBe(1);
      expect(chains[0].length).toBe(8);
      expect(chains[0][0]).toEqual([4, 5]);
      expect(chains[0][7]).toEqual([4, 5]);
    });
    describe('_build', function () {
      it('vgl', function () {
        var isoline = layer.createFeature('isoline', {
          isoline: {elements: squareElements}}).data(vertexList);
        expect(layer.features().length).toBe(1);
        expect(layer.children().length).toBe(1);
        expect(isoline._build()).toBe(isoline);
        expect(layer.features().length).toBe(2);
        expect(layer.children().length).toBe(3);
        // number of lines
        expect(layer.features()[1].data().length).toBe(18);
        // number of labels
        expect(layer.children()[2].features()[0].data().length).toBe(10);
        isoline.draw();
        stepAnimationFrame();
        isoline.isoline('values', []);
        expect(isoline._build()).toBe(isoline);
        expect(layer.features()[1].data().length).toBe(0);
        expect(layer.children()[2].features()[0].data().length).toBe(0);
      });
      it('canvas', function () {
        var isoline = canvasLayer.createFeature('isoline', {
          isoline:{elements: squareElements}}).data(vertexList);
        expect(canvasLayer.features().length).toBe(1);
        expect(canvasLayer.children().length).toBe(1);
        expect(isoline._build()).toBe(isoline);
        expect(canvasLayer.features().length).toBe(3);
        expect(canvasLayer.children().length).toBe(3);
        // number of lines
        expect(canvasLayer.features()[1].data().length).toBe(18);
        // number of labels
        expect(canvasLayer.features()[2].data().length).toBe(10);
        isoline.draw();
        stepAnimationFrame();
        isoline.isoline('values', []);
        expect(isoline._build()).toBe(isoline);
        expect(canvasLayer.features()[1].data().length).toBe(0);
        expect(canvasLayer.features()[2].data().length).toBe(0);
      });
    });
    it('_chainVertex', function () {
      var isoline = geo.isolineFeature({layer: layer});
      expect(closeToEqual(isoline._chainVertex(
        {value: [10, 15], pos: [1, 2, 3, 5, 4, 1]}, {value: 11}, [0, 1]),
        {x: 1.8, y: 2.4, z: 2.6})).toBe(true);
      expect(closeToEqual(isoline._chainVertex(
        {value: [10, 15], pos: [1, 2, 3, 5, 4, 1]}, {value: 11}, [1, 0]),
        {x: 1.8, y: 2.4, z: 2.6})).toBe(true);
      expect(closeToEqual(isoline._chainVertex(
        {value: [15, 10], pos: [1, 2, 3, 5, 4, 1]}, {value: 11}, [0, 1]),
        {x: 4.2, y: 3.6, z: 1.4})).toBe(true);
      expect(closeToEqual(isoline._chainVertex(
        {value: [10, 15], pos: [1, 2, 3, 5, 4, 1]}, {value: 15}, [0, 1]),
        {x: 5, y: 4, z: 1})).toBe(true);
      expect(closeToEqual(isoline._chainVertex(
        {value: [10, 15], pos: [1, 2, 3, 5, 4, 1]}, {value: 15}, [1, 0]),
        {x: 5, y: 4, z: 1})).toBe(true);
    });
    describe('_createIsolines', function () {
      it('square mesh', function () {
        var isoline = layer.createFeature('isoline', {
          isoline: {elements: squareElements}}).data(vertexList);
        var result = isoline._createIsolines();
        expect(result.lines.length).toBe(18);
        expect(result.lines[10].length).toBe(2);
        expect(result.values.length).toBe(17);
        expect(result.values[2].value).toBe(1);
        expect(result.values[2].level).toBe(0);
        expect(result.values[5].level).toBe(1);
        expect(result.hasLabels).toBe(true);
      });
      it('triangle mesh', function () {
        var isoline = layer.createFeature('isoline', {
          isoline: {elements: triangleElements}}).data(vertexList);
        var result = isoline._createIsolines();
        expect(result.lines.length).toBe(18);
        expect(result.lines[10].length).toBe(4);
        expect(result.values.length).toBe(17);
        expect(result.values[2].value).toBe(1);
        expect(result.values[2].level).toBe(0);
        expect(result.values[5].level).toBe(1);
        expect(result.hasLabels).toBe(true);
      });
      it('no results', function () {
        var isoline = layer.createFeature('isoline', {isoline: {
          elements: squareElements,
          values: [-10, -20]
        }}).data(vertexList);
        var result = isoline._createIsolines();
        expect(result).toEqual({});
      });
    });
    it('_exit', function () {
      var isoline = layer.createFeature('isoline', {
        isoline: {elements: squareElements}}).data(vertexList);
      isoline._build();
      expect(layer.features().length).toBe(2);
      expect(layer.children().length).toBe(3);
      isoline._exit();
      expect(layer.features().length).toBe(1);
      expect(layer.children().length).toBe(1);
    });
    it('_getValueList', function () {
      var isoline = layer.createFeature('isoline', {
        isoline: {elements: squareElements}}).data(vertexList);
      expect(isoline._getValueList({})).toEqual([]);
      var mesh = isoline._createIsolines().mesh;
      var result;
      result = isoline._getValueList(mesh);
      expect(result.length).toBe(17);
      expect(result[0].position).toBe(0);
      expect(result[0].level).toBe(2);
      expect(result[1].level).toBe(0);
      expect(result[15].value).toBe(7.5);
      expect(result[15].position).toBe(15);
      expect(result[15].level).toBe(1);
      isoline.isoline({min: 10, max: 5});
      expect(isoline._getValueList(mesh)).toEqual([]);
      // restrictive max
      isoline.isoline({min: null, max: 5});
      result = isoline._getValueList(mesh);
      expect(result.length).toBe(11);
      expect(result[9].value).toBe(4.5);
      // non-restrictive max
      isoline.isoline({min: null, max: 20});
      result = isoline._getValueList(mesh);
      expect(result.length).toBe(17);
      expect(result[15].value).toBe(7.5);
      // position should be based on round numbers
      isoline.isoline({min: 1, max: 5});
      result = isoline._getValueList(mesh);
      expect(result.length).toBe(21);
      expect(result[0].position).toBe(5);
      expect(result[19].value).toBeCloseTo(4.8);
      expect(result[19].position).toBe(24);
      // autofit
      isoline.isoline('autofit', false);
      result = isoline._getValueList(mesh);
      expect(result.length).toBe(15);
      // count
      isoline.isoline('count', 50);
      result = isoline._getValueList(mesh);
      expect(result.length).toBe(50);
      // levels
      isoline.isoline({levels: [2, 3, 4], autofit: true});
      result = isoline._getValueList(mesh);
      expect(result[38].level).toBe(3);
      expect(result[14].level).toBe(3);
      expect(result[8].level).toBe(2);
      expect(result[6].level).toBe(1);
      expect(result[5].level).toBe(0);
      // spacing
      isoline.isoline({min: null, max: null, spacing: 0.2});
      result = isoline._getValueList(mesh);
      expect(result.length).toBe(41);
      expect(result[0].value).toBeCloseTo(0);
      expect(result[39].value).toBeCloseTo(7.8);
      // values
      isoline.isoline('values', [4, 3, 2, 2.5]);
      result = isoline._getValueList(mesh);
      expect(result.length).toBe(4);
      expect(result[0].value).toBe(4);
      expect(result[0].level).toBe(3);
      expect(result[3].value).toBe(2.5);
      expect(result[3].level).toBe(0);
      // values with some levels
      isoline.isoline('values', [{value: 4, level: 0}, {value: 3, level: 1}, {value: 2}, 2.5]);
      result = isoline._getValueList(mesh);
      expect(result.length).toBe(4);
      expect(result[0].value).toBe(4);
      expect(result[0].level).toBe(0);
      expect(result[1].level).toBe(1);
      expect(result[2].level).toBe(1);
      expect(result[3].value).toBe(2.5);
      expect(result[3].level).toBe(0);
    });
    it('_init', function () {
      var isoline = geo.isolineFeature({layer: layer});
      expect(isoline.isoline('count')).toBe(undefined);
      expect(isoline._init()).toBe(undefined);
      expect(isoline.isoline('count')).toBe(15);
      isoline._init({isoline: {count: 20}});
      expect(isoline.isoline('count')).toBe(20);
    });
    describe('_isolinesForValue', function () {
      it('marching squares', function () {
        var squares = {
          gridWidth: 18,
          x0: 0,
          y0: 0,
          dx: 2,
          dy: 2,
          values: [
            // this will exercise all conditions of marching squartes.
            0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1,
            0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
          ]
        };
        var isoline = layer.createFeature('isoline', {
          isoline: squares, style: {value: function (d) { return d; }}
        }).data(squares.values);
        var mesh = isoline._createIsolines().mesh;
        var result = isoline._isolinesForValue(mesh, {value: 0.5});
        // we slice each element of the result to ignore the properties that
        // are added to it.
        expect(result.map(function (d) { return d.slice(); })).toEqual([[
          {x: 5, y: 0, z: 0}, {x: 4, y: 1, z: 0}, {x: 3, y: 0, z: 0}
        ], [
          {x: 9, y: 2, z: 0}, {x: 8, y: 3, z: 0}, {x: 7, y: 2, z: 0},
          {x: 8, y: 1, z: 0}, {x: 9, y: 2, z: 0}
        ], [
          {x: 23, y: 0, z: 0}, {x: 23, y: 2, z: 0}, {x: 22, y: 3, z: 0},
          {x: 20, y: 3, z: 0}, {x: 18, y: 3, z: 0}, {x: 16, y: 3, z: 0},
          {x: 15, y: 2, z: 0}, {x: 14, y: 1, z: 0}, {x: 13, y: 2, z: 0},
          {x: 12, y: 3, z: 0}, {x: 11, y: 2, z: 0}, {x: 11, y: 0, z: 0}
        ], [
          {x: 17, y: 0, z: 0}, {x: 18, y: 1, z: 0}, {x: 19, y: 0, z: 0}
        ], [
          {x: 34, y: 1, z: 0}, {x: 33, y: 2, z: 0}, {x: 32, y: 3, z: 0},
          {x: 30, y: 3, z: 0}, {x: 29, y: 2, z: 0}, {x: 28, y: 1, z: 0},
          {x: 26, y: 1, z: 0}, {x: 25, y: 0, z: 0}
        ], [
          {x: 29, y: 0, z: 0}, {x: 30, y: 1, z: 0}, {x: 32, y: 1, z: 0},
          {x: 33, y: 0, z: 0}
        ]]);
        expect(result.map(function (d) { return d.closed; })).toEqual([
          false, true, false, false, false, false]);
      });
      it('marching triangles', function () {
        var vertices = [
          {x: 2, y: 2, value: 0},
          {x: 6, y: 2, value: 1},
          {x: 10, y: 2, value: 1},
          {x: 14, y: 2, value: 0},
          {x: 18, y: 2, value: 1},
          {x: 22, y: 2, value: 1},
          {x: 26, y: 2, value: 0},

          {x: 0, y: 0, value: 0},
          {x: 4, y: 0, value: 0},
          {x: 8, y: 0, value: 0},
          {x: 12, y: 0, value: 1},
          {x: 16, y: 0, value: 0},
          {x: 20, y: 0, value: 1},
          {x: 24, y: 0, value: 0},
          {x: 28, y: 0, value: 1}
          // :  0 1 1 0 1 1 0
          // : 0 0 0 1 0 1 0 1
        ];
        var elements = [
          [0, 8, 7], [0, 1, 8], [1, 9, 8], [1, 2, 9], [2, 10, 9], [2, 3, 10],
          [3, 11, 10], [3, 4, 11], [4, 12, 11], [4, 5, 12], [5, 13, 12],
          [5, 6, 13], [6, 14, 13]
        ];
        var isoline = layer.createFeature('isoline', {
          isoline: {elements: elements},
          style: {value: function (d) { return d.value; }}
        }).data(vertices);
        var mesh = isoline._createIsolines().mesh;
        var result = isoline._isolinesForValue(mesh, {value: 0.5});
        // we slice each element of the result to ignore the properties that
        // are added to it.
        expect(result.map(function (d) { return d.slice(); })).toEqual([[
          {x: 4, y: 2, z: 0}, {x: 5, y: 1, z: 0}, {x: 7, y: 1, z: 0},
          {x: 9, y: 1, z: 0}, {x: 10, y: 0, z: 0}
        ], [
          {x: 14, y: 0, z: 0}, {x: 13, y: 1, z: 0}, {x: 12, y: 2, z: 0}
        ], [
          {x: 16, y: 2, z: 0}, {x: 17, y: 1, z: 0}, {x: 18, y: 0, z: 0}
        ], [
          {x: 22, y: 0, z: 0}, {x: 23, y: 1, z: 0}, {x: 24, y: 2, z: 0}
        ], [
          {x: 27, y: 1, z: 0}, {x: 26, y: 0, z: 0}
        ]]);
      });
    });
    it('_update', function () {
      var updateTime, buildTime;
      var isoline = layer.createFeature('isoline', {
        isoline: {elements: squareElements}}).data(vertexList);
      isoline.modified();
      updateTime = isoline.updateTime().getMTime();
      buildTime = isoline.buildTime().getMTime();
      expect(isoline._update()).toBe(isoline);
      expect(isoline.updateTime().getMTime()).toBeGreaterThan(updateTime);
      expect(isoline.buildTime().getMTime()).toBeGreaterThan(buildTime);
      updateTime = isoline.updateTime().getMTime();
      buildTime = isoline.buildTime().getMTime();
      expect(isoline._update()).toBe(isoline);
      expect(isoline.updateTime().getMTime()).toBeGreaterThan(updateTime);
      expect(isoline.buildTime().getMTime()).toBe(buildTime);
    });
    it('_updateLabelPositions', function () {
      var isoline = layer.createFeature('isoline', {
        isoline: {elements: squareElements}}).data(vertexList);
      var labelPos;
      expect(isoline._updateLabelPositions()).toBe(isoline);
      expect(isoline.lastLabelPositions()).toEqual({});
      isoline._build();
      labelPos = isoline.lastLabelPositions();
      expect(labelPos).not.toEqual({});
      expect(isoline._updateLabelPositions()).toBe(isoline);
      expect(isoline.lastLabelPositions()).toEqual(labelPos);
      map.zoom(map.zoom() + 2);
      expect(isoline._updateLabelPositions()).toBe(isoline);
      expect(isoline.lastLabelPositions()).not.toEqual(labelPos);
      labelPos = isoline.lastLabelPositions();
      map.center({x: 2, y: 1.5});
      expect(isoline._updateLabelPositions()).toBe(isoline);
      expect(isoline.lastLabelPositions()).toEqual(labelPos);
      map.center({x: -80, y: 1.5});
      expect(isoline._updateLabelPositions()).toBe(isoline);
      expect(isoline.lastLabelPositions()).not.toEqual(labelPos);
    });
  });

  describe('Check public class methods', function () {
    it('isoline/mesh get and set', function () {
      var isoline = geo.isolineFeature({layer: layer});
      isoline._init();
      expect(isoline.isoline().labelSpacing).toEqual(200);
      expect(isoline.mesh().labelSpacing).toEqual(200);
      expect(isoline.isoline('labelSpacing')).toEqual(200);
      expect(isoline.isoline.get('labelSpacing')()).toEqual(200);
      expect(isoline.isoline.get().labelSpacing()).toEqual(200);
      expect(isoline.isoline('labelSpacing', 150)).toBe(isoline);
      expect(isoline.isoline('labelSpacing')).toEqual(150);
      expect(isoline.isoline({labelSpacing: 250})).toBe(isoline);
      expect(isoline.isoline('labelSpacing')).toEqual(250);
    });
    it('draw', function () {
      var isoline = layer.createFeature('isoline', {
        isoline: {elements: squareElements}}).data(vertexList);
      isoline._build();
      sinon.stub(layer.features()[1], 'draw', function () {});
      sinon.stub(layer.children()[2].features()[0], 'draw', function () {});
      isoline.draw();
      expect(layer.features()[1].draw.calledOnce).toBe(true);
      expect(layer.children()[2].features()[0].draw.calledOnce).toBe(true);
      layer.features()[1].draw.restore();
      layer.children()[2].features()[0].draw.restore();
    });
    it('labelPositions', function () {
      var isoline = layer.createFeature('isoline', {
        isoline: {elements: squareElements}}).data(vertexList);
      expect(isoline.labelPositions()).toBe(isoline);
      isoline._build();
      expect(isoline.labelPositions()).toBe(isoline);
      expect(layer.children()[2].features()[0].data().length).toBe(10);
      // make sure label positions are in map gcs
      expect(layer.children()[2].features()[0].data()[0].x).toBeCloseTo(96566.47);
      expect(layer.children()[2].features()[0].data()[0].y).toBeCloseTo(34205.96);
      isoline.isoline({labelSpacing: -1});
      expect(isoline.labelPositions()).toBe(isoline);
      expect(layer.children()[2].features()[0].data().length).toBe(0);
      isoline.isoline({labelSpacing: 50});
      expect(isoline.labelPositions()).toBe(isoline);
      expect(layer.children()[2].features()[0].data().length).toBe(46);
      isoline.isoline({labelSpacing: 5000});
      expect(isoline.labelPositions()).toBe(isoline);
      expect(layer.children()[2].features()[0].data().length).toBe(0);
    });
    it('lastLabelPositions', function () {
      var isoline = layer.createFeature('isoline', {
        isoline: {elements: squareElements}}).data(vertexList);
      expect(isoline.lastLabelPositions()).toEqual({});
      isoline._update();
      expect(isoline.lastLabelPositions()).not.toEqual({});
      expect(isoline.lastLabelPositions().zoom).toBe(9);
      map.zoom(10);
      expect(isoline.lastLabelPositions().zoom).toBe(9);
      isoline.labelPositions();
      expect(isoline.lastLabelPositions().zoom).toBe(10);
    });
    it('modified', function () {
      var isoline = layer.createFeature('isoline', {
        isoline: {elements: squareElements}}).data(vertexList);
      isoline._build();
      sinon.stub(layer.features()[1], 'modified', function () {});
      sinon.stub(layer.children()[2].features()[0], 'modified', function () {});
      isoline.modified();
      expect(layer.features()[1].modified.calledOnce).toBe(true);
      expect(layer.children()[2].features()[0].modified.calledOnce).toBe(true);
      layer.features()[1].modified.restore();
      layer.children()[2].features()[0].modified.restore();
    });
  });

  describe('Check public static methods', function () {
    it('rotationFunction', function () {
      map.rotation(1);
      expect(geo.isolineFeature.rotationFunction()({rotation: 2})).toBe(2);
      expect(geo.isolineFeature.rotationFunction('higher')({rotation: 1})).toBe(1);
      expect(geo.isolineFeature.rotationFunction('higher')({rotation: 2})).toBe(2);
      expect(geo.isolineFeature.rotationFunction('lower')({rotation: 1})).toBeCloseTo(1 + Math.PI);
      expect(geo.isolineFeature.rotationFunction('lower')({rotation: 2})).toBeCloseTo(2 + Math.PI);
      expect(geo.isolineFeature.rotationFunction('map')({rotation: 1})).toBe(1);
      expect(geo.isolineFeature.rotationFunction('map')({rotation: 2})).toBeCloseTo(2 + Math.PI);
      expect(geo.isolineFeature.rotationFunction('screen', map)({rotation: 1})).toBeCloseTo(1 + Math.PI);
      expect(geo.isolineFeature.rotationFunction('screen', map)({rotation: 2})).toBeCloseTo(2 + Math.PI);
    });
  });
});
