// Test geo.polygonFeature and geo.webgl.polygonFeature

var $ = require('jquery');
var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;
var destroyMap = require('../test-utils').destroyMap;
var mockWebglRenderer = geo.util.mockWebglRenderer;
var restoreWebglRenderer = geo.util.restoreWebglRenderer;
var vgl = require('../test-utils').vgl;
var waitForIt = require('../test-utils').waitForIt;
// var closeToArray = require('../test-utils').closeToArray;

describe('geo.polygonFeature', function () {
  'use strict';

  var testPolygons = [
    [{x: 0, y: 0}, {x: 10, y: 5}, {x: 5, y: 10}],
    {
      outer:
        [{x: 20, y: 10}, {x: 30, y: 0}, {x: 40, y: 10}, {x: 30, y: 20}],
      inner: [
        [{x: 25, y: 10}, {x: 30, y: 5}, {x: 35, y: 10}, {x: 30, y: 15}]
      ],
      fillOpacity: 0.5
    }, {
      outer:
        [{x: 50, y: 10}, {x: 60, y: 0}, {x: 70, y: 10}, {x: 60, y: 20}],
      inner: [
        [{x: 55, y: 10}, {x: 60, y: 15}, {x: 65, y: 10}, {x: 60, y: 5}]
      ],
      fillColor: '#FF8000',
      strokeColor: '#008'
    }, {
      outer:
        [{x: 50, y: 8}, {x: 70, y: 8}, {x: 70, y: 12}, {x: 50, y: 12}],
      inner: [
        [{x: 58, y: 10}, {x: 60, y: 15}, {x: 62, y: 10}, {x: 60, y: 5}],
        []  // degenerate hole should be ignored
      ],
      uniformPolygon: true
    }, {
      outer: []  // degenerate polygon should be ignored
    }
  ];
  var stylesVisited = [];
  var testStyle = {
    fillOpacity: function (d, idx, poly, polyidx) {
      stylesVisited.push({style: 'fillOpacity', params: [d, idx, poly, polyidx]});
      return poly.fillOpacity !== undefined ? poly.fillOpacity : 1;
    },
    fillColor: function (d, idx, poly, polyidx) {
      stylesVisited.push({style: 'fillColor', params: [d, idx, poly, polyidx]});
      return poly.fillColor !== undefined ? poly.fillColor : 'blue';
    },
    stroke: true,
    strokeColor: function (d, idx, poly, polyidx) {
      stylesVisited.push({style: 'strokeColor', params: [d, idx, poly, polyidx]});
      return poly.strokeColor !== undefined ? poly.strokeColor : 'red';
    },
    uniformPolygon: function (d) {
      stylesVisited.push({style: 'uniformPolygon', params: [d]});
      return d.uniformPolygon !== undefined ? d.uniformPolygon : false;
    }
  };
  var patternStyle = function (d, idx, poly, polyidx) {
    stylesVisited.push({style: 'pattern', params: [d, idx, poly, polyidx]});
    return {
      fillColor: '#0000FF40',
      strokeColor: '#FFFF00C0',
      strokeWidth: 1.25 / 16,
      strokeOffset: 1,
      radiusIncludesStroke: true,
      symbol: geo.markerFeature.symbols.star5,
      symbolValue: 0.6,
      rotation: -Math.PI / 2,
      scaleWithZoom: geo.markerFeature.scaleMode.all,
      rotateWithMap: false,
      radius: 30.25 / 32,
      spacing: -70 / 32,
      origin: [0, 0],
    };
  };

  describe('create', function () {
    it('create function', function () {
      mockWebglRenderer();
      var map, layer, polygon;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'webgl'});
      polygon = geo.polygonFeature.create(layer);
      expect(polygon instanceof geo.polygonFeature).toBe(true);
      destroyMap();
      restoreWebglRenderer();
    });
  });

  describe('Check class accessors', function () {
    var map, layer, polygon;
    var pos = [[[0, 0], [10, 5], [5, 10]]];
    it('position', function () {
      map = createMap();
      layer = map.createLayer('feature', {renderer: null});
      polygon = geo.polygonFeature({layer: layer});
      polygon._init();
      expect(polygon.position()('a')).toBe('a');
      polygon.position(pos);
      expect(polygon.position()).toEqual(pos);
      polygon.position(function () { return 'b'; });
      expect(polygon.position()('a')).toEqual('b');

      polygon = geo.polygonFeature({layer: layer});
      polygon._init({position: pos});
      expect(polygon.position()).toEqual(pos);
    });

    it('polygon', function () {
      map = createMap();
      layer = map.createLayer('feature', {renderer: null});
      polygon = geo.polygonFeature({layer: layer});
      polygon._init();
      expect(polygon.polygon()('a')).toBe('a');
      polygon.polygon(pos);
      expect(polygon.polygon()).toEqual(pos);
      polygon.polygon(function () { return 'b'; });
      expect(polygon.polygon()('a')).toEqual('b');

      polygon = geo.polygonFeature({layer: layer});
      polygon._init({polygon: pos});
      expect(polygon.polygon()).toEqual(pos);
    });

    it('data', function () {
      map = createMap();
      layer = map.createLayer('feature', {renderer: null});
      polygon = geo.polygonFeature({layer: layer});
      polygon._init();
      expect(polygon.data()).toEqual([]);
      polygon.data(pos);
      expect(polygon.data()).toEqual(pos);

      polygon = geo.polygonFeature({layer: layer});
      polygon._init({style: {data: pos}});
      expect(polygon.data()).toEqual(pos);
    });

    it('style', function () {
      mockWebglRenderer();
      map = createMap();
      // we have to use a valid renderer so that the stroke can be enabled.
      layer = map.createLayer('feature', {renderer: 'webgl'});
      polygon = geo.polygonFeature({layer: layer});
      polygon._init();
      expect(polygon.style().stroke).toBe(false);
      expect(polygon.dependentFeatures()).toEqual([]);
      polygon.style('stroke', true);
      expect(polygon.style().stroke).toBe(true);
      expect(polygon.dependentFeatures().length).toEqual(1);
      polygon.style({stroke: false});
      expect(polygon.style().stroke).toBe(false);
      expect(polygon.dependentFeatures()).toEqual([]);
      map.deleteLayer(layer);
      destroyMap();
      restoreWebglRenderer();
    });
  });

  describe('Public utility methods', function () {
    it('pointSearch', function () {
      mockWebglRenderer();
      var map, layer, polygon, data, pt;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'webgl'});
      polygon = geo.polygonFeature({layer: layer});
      polygon._init();
      data = testPolygons;
      polygon.data(data);
      pt = polygon.pointSearch({x: 5, y: 5});
      expect(pt.index).toEqual([0]);
      expect(pt.found.length).toBe(1);
      expect(pt.found[0][0]).toEqual(data[0][0]);
      pt = polygon.pointSearch({x: 21, y: 10});
      expect(pt.index).toEqual([1]);
      expect(pt.found.length).toBe(1);
      pt = polygon.pointSearch({x: 30, y: 10});
      expect(pt.index).toEqual([]);
      expect(pt.found.length).toBe(0);
      pt = polygon.pointSearch({x: 51, y: 10});
      expect(pt.index).toEqual([2, 3]);
      expect(pt.found.length).toBe(2);
      pt = polygon.pointSearch({x: 57, y: 10});
      expect(pt.index).toEqual([3]);
      expect(pt.found.length).toBe(1);
      /* If the inner hole extends past the outside, it doesn't make that
       * point in the polygon */
      pt = polygon.pointSearch({x: 60, y: 13});
      expect(pt.index).toEqual([]);
      expect(pt.found.length).toBe(0);

      // enable stroke and test very close, but outside, of an edge
      polygon.style({stroke: true, strokeWidth: 20});
      pt = polygon.pointSearch({x: 5, y: 2.499});
      expect(pt.index).toEqual([0]);
      restoreWebglRenderer();
    });
    it('polygonSearch', function () {
      mockWebglRenderer();
      var map, layer, polygon, data, result;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'webgl'});
      polygon = geo.polygonFeature({layer: layer});
      polygon._init();
      data = testPolygons;
      polygon.data(data);
      result = polygon.polygonSearch([{x: 19, y: -1}, {x: 41, y: -1}, {x: 41, y: 21}, {x: 19, y: 21}]);
      expect(result.index).toEqual([1]);
      result = polygon.polygonSearch([{x: 19, y: -1}, {x: 31, y: -1}, {x: 31, y: 21}, {x: 19, y: 21}]);
      expect(result.index).toEqual([]);
      result = polygon.polygonSearch([{x: 19, y: -1}, {x: 31, y: -1}, {x: 31, y: 21}, {x: 19, y: 21}], {partial: true});
      expect(result.index).toEqual([1]);
      result = polygon.polygonSearch([{x: 29, y: 9}, {x: 31, y: 9}, {x: 31, y: 11}, {x: 29, y: 31}]);
      expect(result.index).toEqual([]);
      result = polygon.polygonSearch([{x: 29, y: 9}, {x: 31, y: 9}, {x: 31, y: 11}, {x: 29, y: 31}], {partial: true});
      expect(result.index).toEqual([1]);
      result = polygon.polygonSearch([{x: 29, y: 10}, {x: 31, y: 10}], {partial: true});
      expect(result.index).toEqual([]);
      // selection entirely inside a polygon
      result = polygon.polygonSearch([{x: 1, y: 1}, {x: 9, y: 5}, {x: 5, y: 9}]);
      expect(result.index).toEqual([]);
      result = polygon.polygonSearch([{x: 1, y: 1}, {x: 9, y: 5}, {x: 5, y: 9}], {partial: true});
      expect(result.index).toEqual([0]);
      // enable stroke and test very close, but outside, of an edge
      polygon.style({stroke: true, strokeWidth: 20});
      result = polygon.polygonSearch([{x: 5, y: 2.499}, {x: 6, y: 2}, {x: 5, y: 2}]);
      expect(result.index).toEqual([]);
      result = polygon.polygonSearch([{x: 5, y: 2.499}, {x: 6, y: 2}, {x: 5, y: 2}], {partial: true});
      expect(result.index).toEqual([0]);
      result = polygon.polygonSearch([{x: 5, y: 2.499}, {x: 5, y: 3}, {x: 4, y: 3}]);
      expect(result.index).toEqual([]);
      result = polygon.polygonSearch([{x: 5, y: 2.499}, {x: 5, y: 3}, {x: 4, y: 3}], {partial: true});
      expect(result.index).toEqual([0]);
      restoreWebglRenderer();
    });

    it('polygonCoordinates', function () {
      mockWebglRenderer();
      var map, layer, polygon;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'webgl'});
      polygon = geo.polygonFeature({layer: layer});
      polygon._init();
      polygon.data(testPolygons);
      var result = polygon.polygonCoordinates();
      expect(result.length).toEqual(testPolygons.length);
      expect(result[0].outer.length).toBe(3);
      expect(result[0].inner.length).toBe(0);
      expect(result[1].outer.length).toBe(4);
      expect(result[1].inner.length).toBe(1);
      expect(result[1].inner[0].length).toBe(4);
      restoreWebglRenderer();
    });

    it('mouseOverOrderClosestBorder', function () {
      mockWebglRenderer();
      var map, layer, polygon, data;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'webgl'});
      polygon = geo.polygonFeature({layer: layer});
      polygon._init();
      // define some overlapping polygons for testing
      data = [{
        outer: [[29, 20], [35, 20], [32, 25]]
      }, {
        outer: [[29, 22], [35, 22], [32, 27]],
        inner: [[[30, 22.6], [34, 22.6], [32, 26]]]
      }, {
        outer: [[22, 30], [27, 32], [24, 35], [22, 35]]
      }, {
        outer: [[20, 30], [25, 32], [22, 35], [20, 35]]
      }];
      polygon.data(data).position(function (vertex) {
        return {x: vertex[0], y: vertex[1]};
      });

      var evt = {
        over: {index: [2, 3], found: []},
        feature: polygon,
        mouse: {geo: {x: 22.7, y: 34}}
      };
      expect(polygon.mouseOverOrderClosestBorder(evt)).toBe(undefined);
      expect(evt.over.index).toEqual([2, 3]);
      evt.mouse.geo = {x: 22.2, y: 34};
      polygon.mouseOverOrderClosestBorder(evt);
      expect(evt.over.index).toEqual([3, 2]);
      evt.over.index = [0, 1];
      evt.mouse.geo = {x: 32, y: 22.2};
      polygon.mouseOverOrderClosestBorder(evt);
      expect(evt.over.index).toEqual([0, 1]);
      evt.mouse.geo = {x: 30.5, y: 22.2};
      polygon.mouseOverOrderClosestBorder(evt);
      expect(evt.over.index).toEqual([1, 0]);
      evt.mouse.geo = {x: 30.7, y: 22.5};
      polygon.mouseOverOrderClosestBorder(evt);
      expect(evt.over.index).toEqual([0, 1]);

      restoreWebglRenderer();
    });

    describe('rdpSimplifyData', function () {
      function countPolygons(data) {
        var counts = {
          polygons: data.length,
          holes: 0,
          vertices: 0
        };
        data.forEach(function (poly) {
          if (poly.outer) {
            counts.vertices += poly.outer.length;
          } else {
            counts.vertices += poly.length;
          }
          if (poly.inner) {
            counts.holes += poly.inner.length;
            poly.inner.forEach(function (hole) {
              counts.vertices += hole.length;
            });
          }
        });
        return counts;
      }

      it('basic usage', function () {
        mockWebglRenderer();
        var map, layer, polygon, counts;

        map = createMap();
        layer = map.createLayer('feature', {renderer: 'webgl'});
        polygon = geo.polygonFeature({layer: layer});
        polygon._init();
        polygon.data(testPolygons);
        counts = countPolygons(polygon.data().map(polygon.style.get('polygon')));
        expect(counts).toEqual({polygons: 5, holes: 4, vertices: 27});
        polygon.rdpSimplifyData(testPolygons);
        counts = countPolygons(polygon.data().map(polygon.style.get('polygon')));
        expect(counts).toEqual({polygons: 5, holes: 3, vertices: 27});

        // use pixel space for ease of picking tolerance values in tests
        map.gcs('+proj=longlat +axis=enu');
        map.ingcs('+proj=longlat +axis=esu');
        polygon.rdpSimplifyData(testPolygons, 10);
        counts = countPolygons(polygon.data().map(polygon.style.get('polygon')));
        expect(counts).toEqual({polygons: 5, holes: 3, vertices: 24});
        polygon.rdpSimplifyData(testPolygons, 20);
        counts = countPolygons(polygon.data().map(polygon.style.get('polygon')));
        expect(counts).toEqual({polygons: 5, holes: 1, vertices: 8});
        polygon.rdpSimplifyData(testPolygons, 50);
        counts = countPolygons(polygon.data().map(polygon.style.get('polygon')));
        expect(counts).toEqual({polygons: 5, holes: 0, vertices: 0});
        polygon.rdpSimplifyData(testPolygons, 2, function (d) {
          return {x: d.x * 0.2, y: d.y * 0.2};
        });
        counts = countPolygons(polygon.data().map(polygon.style.get('polygon')));
        expect(counts).toEqual({polygons: 5, holes: 3, vertices: 24});
        restoreWebglRenderer();
      });
    });
    it('actors', function () {
      mockWebglRenderer();
      var map, layer, polygon;

      map = createMap();
      layer = map.createLayer('feature', {renderer: 'webgl'});
      polygon = geo.webgl.polygonFeature({layer: layer});
      expect(polygon.actors().length).toBe(1);
      restoreWebglRenderer();
    });
  });

  describe('Private utility methods', function () {
    describe('_init', function () {
      var map, layer;
      it('arg gets added to style', function () {
        var polygon;

        map = createMap();
        layer = map.createLayer('feature', {renderer: null});
        polygon = geo.polygonFeature({layer: layer});
        /* init is not automatically called on the geo.polygonFeature (it is on
         * geo.webgl.polygonFeature). */
        polygon._init({
          style: {fillColor: '#FFFFFF'}
        });
        expect(polygon.style('fillColor')).toBe('#FFFFFF');
      });
    });
  });

  /* This is a basic integration test of geo.webgl.polygonFeature. */
  describe('geo.webgl.polygonFeature', function () {
    var map, layer, polygons, glCounts, buildTime;
    it('basic usage', function () {
      stylesVisited.splice(0, stylesVisited.length);
      mockWebglRenderer();
      map = createMap();
      layer = map.createLayer('feature');
      polygons = layer.createFeature('polygon', {style: testStyle, data: testPolygons});
      buildTime = polygons.buildTime().timestamp();
      /* Trigger rerendering */
      polygons.data(testPolygons);
      map.draw();
      expect(buildTime).not.toEqual(polygons.buildTime().timestamp());
      glCounts = $.extend({}, vgl.mockCounts());
    });
    waitForIt('next render gl A', function () {
      return vgl.mockCounts().createProgram >= (glCounts.createProgram || 0) + 2;
    });
    it('check that styles were used', function () {
      $.each(stylesVisited, function (idx, val) {
        if (val.style === 'strokeColor') {
          expect(typeof val.params[3]).toBe('number');
          expect(val.params[3]).toBeLessThan(4);
        }
      });
    });
    it('update the style', function () {
      polygons.style('fillColor', function (d) {
        return 'red';
      });
      glCounts = $.extend({}, vgl.mockCounts());
      buildTime = polygons.buildTime().timestamp();
      polygons.draw();
    });
    waitForIt('next render gl B', function () {
      return vgl.mockCounts().bufferSubData >= (glCounts.bufferSubData || 0) + 1 &&
             buildTime !== polygons.buildTime().timestamp();
    });
    it('update the style B', function () {
      polygons.style('fillColor', function (d) {
        return '#ff0000';
      });
      glCounts = $.extend({}, vgl.mockCounts());
      buildTime = polygons.buildTime().timestamp();
      polygons.draw();
    });
    waitForIt('next render gl C', function () {
      return vgl.mockCounts().bufferSubData >= (glCounts.bufferSubData || 0) + 1 &&
             buildTime !== polygons.buildTime().timestamp();
    });
    it('update the style C', function () {
      polygons.style('fill', function (d, i) {
        return i % 2 > 0;
      });
      glCounts = $.extend({}, vgl.mockCounts());
      buildTime = polygons.buildTime().timestamp();
      polygons.draw();
    });
    waitForIt('next render gl D', function () {
      return vgl.mockCounts().bufferSubData >= (glCounts.bufferSubData || 0) + 1 &&
             buildTime !== polygons.buildTime().timestamp();
    });
    it('update to a pattern style', function () {
      polygons.style('pattern', patternStyle);
      glCounts = $.extend({}, vgl.mockCounts());
      buildTime = polygons.buildTime().timestamp();
      polygons.draw();
    });
    waitForIt('next render gl E', function () {
      return vgl.mockCounts().bufferSubData >= (glCounts.bufferSubData || 0) + 1 &&
             buildTime !== polygons.buildTime().timestamp();
    });
    it('poor data', function () {
      polygons.data([undefined, testPolygons[1]]);
      polygons.style('fill', true);
      glCounts = $.extend({}, vgl.mockCounts());
      buildTime = polygons.buildTime().timestamp();
      polygons.draw();
    });
    waitForIt('next render gl F', function () {
      return vgl.mockCounts().bufferData >= (glCounts.bufferData || 0) + 1 &&
             buildTime !== polygons.buildTime().timestamp();
    });
    it('_exit', function () {
      var buildTime = polygons.buildTime().timestamp();
      layer.deleteFeature(polygons);
      polygons.data(testPolygons);
      polygons._update();
      map.draw();
      expect(buildTime).toEqual(polygons.buildTime().timestamp());
      destroyMap();
      restoreWebglRenderer();
    });
  });
});
