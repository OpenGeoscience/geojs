// Test geo.polygonFeature and geo.gl.polygonFeature

var geo = require('../test-utils').geo;
var $ = require('jquery');
var vgl = require('vgl');
var mockVGLRenderer = require('../test-utils').mockVGLRenderer;
var restoreVGLRenderer = require('../test-utils').restoreVGLRenderer;
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
      fillColor: '#FF8000'
    }, {
      outer:
        [{x: 50, y: 8}, {x: 70, y: 8}, {x: 70, y: 12}, {x: 50, y: 12}],
      inner: [
        [{x: 58, y: 10}, {x: 60, y: 15}, {x: 62, y: 10}, {x: 60, y: 5}]
      ],
      uniformPolygon: true
    }
  ];
  var testStyle = {
    fillOpacity: function (d, idx, poly, polyidx) {
      return poly.fillOpacity !== undefined ? poly.fillOpacity : 1;
    },
    fillColor: function (d, idx, poly, polyidx) {
      return poly.fillColor !== undefined ? poly.fillColor : 'blue';
    },
    uniformPolygon: function (d) {
      return d.uniformPolygon !== undefined ? d.uniformPolygon : false;
    }
  };

  function create_map(opts) {
    var node = $('<div id="map"/>').css({width: '640px', height: '360px'});
    $('#map').remove();
    $('body').append(node);
    opts = $.extend({}, opts);
    opts.node = node;
    return geo.map(opts);
  }

  describe('create', function () {
    it('create function', function () {
      mockVGLRenderer();
      var map, layer, polygon;
      map = create_map();
      layer = map.createLayer('feature', {renderer: 'vgl'});
      polygon = geo.polygonFeature.create(layer);
      expect(polygon instanceof geo.polygonFeature).toBe(true);
      restoreVGLRenderer();
    });
  });

  describe('Check class accessors', function () {
    var map, layer, polygon;
    var pos = [[[0, 0], [10, 5], [5, 10]]];
    it('position', function () {
      map = create_map();
      layer = map.createLayer('feature', {renderer: null});
      polygon = geo.polygonFeature({layer: layer});
      polygon._init();
      expect(polygon.position()('a')).toBe('a');
      polygon.position(pos);
      expect(polygon.position()).toEqual(pos);
      polygon.position(function () { return 'b'; });
      expect(polygon.position()('a')).toEqual('b');

      polygon = geo.polygonFeature({layer: layer, position: pos});
      polygon._init();
      expect(polygon.position()).toEqual(pos);
    });

    it('polygon', function () {
      map = create_map();
      layer = map.createLayer('feature', {renderer: null});
      polygon = geo.polygonFeature({layer: layer});
      polygon._init();
      expect(polygon.polygon()('a')).toBe('a');
      polygon.polygon(pos);
      expect(polygon.polygon()).toEqual(pos);
      polygon.polygon(function () { return 'b'; });
      expect(polygon.polygon()('a')).toEqual('b');

      polygon = geo.polygonFeature({layer: layer, polygon: pos});
      polygon._init();
      expect(polygon.polygon()).toEqual(pos);
    });

    it('data', function () {
      map = create_map();
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
  });

  describe('Public utility methods', function () {
    describe('pointSearch', function () {
      it('basic usage', function () {
        var map, layer, polygon, data, pt;
        map = create_map();
        layer = map.createLayer('feature', {renderer: null});
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
      });
    });
  });

  describe('Private utility methods', function () {
    describe('_init', function () {
      var map, layer;
      it('arg gets added to style', function () {
        var polygon;

        map = create_map();
        layer = map.createLayer('feature', {renderer: null});
        polygon = geo.polygonFeature({layer: layer});
        /* init is not automatically called on the geo.polygonFeature (it is on
         * geo.gl.polygonFeature). */
        polygon._init({
          style: {fillColor: '#FFFFFF'}
        });
        expect(polygon.style('fillColor')).toBe('#FFFFFF');
      });
    });
  });

  /* This is a basic integration test of geo.gl.polygonFeature. */
  describe('geo.gl.polygonFeature', function () {
    var map, layer, polygons, glCounts, buildTime;
    it('basic usage', function () {

      mockVGLRenderer();
      map = create_map();
      layer = map.createLayer('feature');
      polygons = layer.createFeature('polygon', {style: testStyle, data: testPolygons});
      buildTime = polygons.buildTime().getMTime();
      /* Trigger rerendering */
      polygons.data(testPolygons);
      map.draw();
      expect(buildTime).not.toEqual(polygons.buildTime().getMTime());
      glCounts = $.extend({}, vgl.mockCounts());
    });
    waitForIt('next render gl A', function () {
      return vgl.mockCounts().createProgram === (glCounts.createProgram || 0) + 2;
    });
    it('update the style', function () {
      polygons.style('fillColor', function (d) {
        return 'red';
      });
      glCounts = $.extend({}, vgl.mockCounts());
      buildTime = polygons.buildTime().getMTime();
      polygons.draw();
    });
    waitForIt('next render gl B', function () {
      return vgl.mockCounts().bufferData >= (glCounts.bufferData || 0) + 1 &&
             buildTime !== polygons.buildTime().getMTime();
    });
    it('update the style', function () {
      polygons.style('fillColor', function (d) {
        return '#ff0000';
      });
      glCounts = $.extend({}, vgl.mockCounts());
      buildTime = polygons.buildTime().getMTime();
      polygons.draw();
    });
    waitForIt('next render gl C', function () {
      return vgl.mockCounts().bufferData >= (glCounts.bufferData || 0) + 1 &&
             buildTime !== polygons.buildTime().getMTime();
    });
    it('_exit', function () {
      var buildTime = polygons.buildTime().getMTime();
      layer.deleteFeature(polygons);
      polygons.data(testPolygons);
      map.draw();
      expect(buildTime).toEqual(polygons.buildTime().getMTime());
      restoreVGLRenderer();
    });
  });
});
