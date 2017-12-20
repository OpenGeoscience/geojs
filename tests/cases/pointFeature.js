// Test geo.pointFeature, geo.d3.pointFeature, and geo.gl.pointFeature

var $ = require('jquery');
var mockAnimationFrame = require('../test-utils').mockAnimationFrame;
var stepAnimationFrame = require('../test-utils').stepAnimationFrame;
var unmockAnimationFrame = require('../test-utils').unmockAnimationFrame;
var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;
var destroyMap = require('../test-utils').destroyMap;
var mockVGLRenderer = geo.util.mockVGLRenderer;
var restoreVGLRenderer = geo.util.restoreVGLRenderer;
var vgl = require('vgl');
var waitForIt = require('../test-utils').waitForIt;

describe('geo.pointFeature', function () {
  'use strict';

  var testPoints = [
    {x: 20, y: 10}, {x: 25, y: 10}, {x: 30, y: 10}, {x: 35, y: 12},
    {x: 32, y: 15}, {x: 30, y: 20}, {x: 35, y: 22}, {x: 32, y: 25},
    {x: 30, y: 30}, {x: 35, y: 32}, {x: 32, y: 35}, {x: 30, y: 30},
    {x: 40, y: 20, radius: 10}, {x: 42, y: 20, radius: 5},
    {x: 44, y: 20, radius: 2}, {x: 46, y: 20, radius: 2},
    {x: 50, y: 10}, {x: 50, y: 10}, {x: 60, y: 10}
  ];

  describe('create', function () {
    it('create function', function () {
      var map, layer, point;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'd3'});
      point = geo.pointFeature.create(layer);
      expect(point instanceof geo.pointFeature).toBe(true);
    });
  });

  describe('Check class accessors', function () {
    var map, layer, point;
    var pos = [[0, 0], [10, 5], [5, 10]];
    it('position', function () {
      map = createMap();
      layer = map.createLayer('feature', {renderer: null});
      point = geo.pointFeature({layer: layer});
      point._init();
      expect(point.position()('a')).toBe('a');
      point.position(pos);
      expect(point.position()('a')).toEqual(pos);
      point.position(function () { return pos; });
      expect(point.position()('a')).toEqual(pos);
      point.position(function () { return 'b'; });
      expect(point.position()('a')).toEqual('b');

      point = geo.pointFeature({layer: layer, position: pos});
      point._init({position: pos});
      expect(point.position()('a')).toEqual(pos);
    });

    it('data', function () {
      map = createMap();
      layer = map.createLayer('feature', {renderer: null});
      point = geo.pointFeature({layer: layer});
      point._init();
      expect(point.data()).toEqual([]);
      expect(point.data(pos)).toBe(point);
      expect(point.data()).toEqual(pos);
    });

    it('clustering', function () {
      var count = 0;
      map = createMap();
      layer = map.createLayer('feature', {renderer: null});
      point = geo.pointFeature({layer: layer});
      point._init();
      point.data(pos);
      point._handleZoom = function () {
        count += 1;
      };
      expect(point.clustering()).toBe(undefined);
      expect(point.clustering(true)).toBe(point);
      expect(point.clustering()).toBe(true);
      expect(count).toBe(1);
      expect(point.clustering(true)).toBe(point);
      expect(count).toBe(1);
      expect(point.clustering({radius: 1})).toBe(point);
      expect(point.clustering()).toEqual({radius: 1});
      expect(count).toBe(2);
      expect(point.clustering(false)).toBe(point);
      expect(point.clustering()).toBe(false);
      expect(count).toBe(2);
    });
  });

  describe('Public utility methods', function () {
    it('pointSearch', function () {
      var map, layer, point, pt, p, data = testPoints;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'd3'});
      point = layer.createFeature('point', {selectionAPI: true});
      point.data(data)
           .style({
             strokeWidth: 2,
             radius: function (d) {
               return d.radius ? d.radius : 5;
             }
           });
      pt = point.pointSearch({x: 20, y: 10});
      expect(pt.index).toEqual([0]);
      expect(pt.found.length).toBe(1);
      expect(pt.found[0]).toEqual(data[0]);
      /* We should land on the point if we are near the specified radius */
      p = point.featureGcsToDisplay({x: 25, y: 10});
      pt = point.pointSearch(map.displayToGcs({x: p.x, y: p.y}));
      expect(pt.found.length).toBe(1);
      pt = point.pointSearch(map.displayToGcs({x: p.x, y: p.y + 6.95}));
      expect(pt.found.length).toBe(1);
      pt = point.pointSearch(map.displayToGcs({x: p.x, y: p.y + 7.05}));
      expect(pt.found.length).toBe(0);
      /* Variable radius should be handled */
      p = point.featureGcsToDisplay({x: 40, y: 20});
      pt = point.pointSearch(map.displayToGcs({x: p.x, y: p.y + 11.95}));
      expect(pt.found.length).toBe(1);
      pt = point.pointSearch(map.displayToGcs({x: p.x, y: p.y + 12.05}));
      expect(pt.found.length).toBe(0);
      p = point.featureGcsToDisplay({x: 46, y: 20});
      pt = point.pointSearch(map.displayToGcs({x: p.x, y: p.y + 3.95}));
      expect(pt.found.length).toBe(1);
      pt = point.pointSearch(map.displayToGcs({x: p.x, y: p.y + 4.05}));
      expect(pt.found.length).toBe(0);
      /* We should match two coincident pointss */
      pt = point.pointSearch({x: 50, y: 10});
      expect(pt.found.length).toBe(2);
      /* If we have zero-length data, we get no matches */
      point.data([]);
      pt = point.pointSearch({x: 22, y: 10});
      expect(pt.found.length).toBe(0);
      /* Exceptions will be returned properly */
      point.data(data).style('strokeWidth', function (d, idx) {
        throw new Error('no width');
      });
      expect(function () {
        point.pointSearch({x: 20, y: 10});
      }).toThrow(new Error('no width'));
      /* Stop throwing the exception */
      point.style('strokeWidth', 2);
      /* Test with an alternate gcs; pointSearch always uses the map's ingcs */
      point.gcs(map.gcs());
      point.data([{x: 2226390, y: 1118890}]);
      pt = point.pointSearch({x: 20, y: 10});
      expect(pt.index).toEqual([0]);
      expect(pt.found.length).toBe(1);
    });
    it('boxSearch', function () {
      var map, layer, point, data = testPoints, idx;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'd3'});
      point = layer.createFeature('point', {selectionAPI: true});
      point.data(data);
      idx = point.boxSearch({x: 19, y: 9}, {x: 26, y: 11});
      expect(idx).toEqual([0, 1]);
      idx = point.boxSearch({x: 19, y: 9}, {x: 24, y: 11});
      expect(idx).toEqual([0]);
      idx = point.boxSearch({x: 19, y: 9}, {x: 18, y: 11});
      expect(idx.length).toBe(0);
    });
  });

  describe('Private utility methods', function () {
    it('_clusterData', function () {
      var map, layer, point, data = testPoints, count = 0;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'd3'});
      point = layer.createFeature('point');
      point.data(data);
      var s_handleZoom = point._handleZoom;
      point._handleZoom = function () {
        count += 1;
        return s_handleZoom.apply(point, arguments);
      };
      point._clusterData();
      expect(count).toBe(0);
      expect(point.data().length).toBe(data.length);
      point.clustering(true);
      point._clusterData();
      expect(count).toBeGreaterThan(1);
      var dataLen = point.data().length;
      expect(dataLen).toBeLessThan(data.length);
      map.zoom(0);
      expect(point.data().length).toBeLessThan(dataLen);
    });
    it('_handleZoom', function () {
      var map, layer, point, data = testPoints;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'd3'});
      point = layer.createFeature('point');
      point.data(data);
      expect(point.data().length).toBe(data.length);
      point._handleZoom(4);
      expect(point.data().length).toBe(data.length);
      point.clustering(true);
      var dataLen = point.data().length;
      expect(dataLen).toBeLessThan(data.length);
      point._handleZoom(0);
      expect(point.data().length).toBeLessThan(dataLen);
    });
    it('_updateRangeTree', function () {
      var map, layer, point, data = testPoints.slice();
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'd3'});
      point = layer.createFeature('point');
      point.data(data);
      expect(point.pointSearch({x: 20, y: 10}).index.length).toBe(1);
      expect(point.pointSearch({x: -20, y: 10}).index.length).toBe(0);
      data[0] = {x: -20, y: 10};
      // now we can't find the point at either locations
      expect(point.pointSearch({x: 20, y: 10}).index.length).toBe(0);
      expect(point.pointSearch({x: -20, y: 10}).index.length).toBe(0);
      // this won't do anything, since we dont think the data is modified
      point._updateRangeTree();
      expect(point.pointSearch({x: 20, y: 10}).index.length).toBe(0);
      expect(point.pointSearch({x: -20, y: 10}).index.length).toBe(0);
      // now we should find the point in the new location
      point.dataTime().modified();
      point._updateRangeTree();
      expect(point.pointSearch({x: 20, y: 10}).index.length).toBe(0);
      expect(point.pointSearch({x: -20, y: 10}).index.length).toBe(1);
    });
  });

  /* This is a basic integration test of geo.d3.pointFeature. */
  describe('geo.d3.pointFeature', function () {
    var map, layer, point;
    it('basic usage', function () {
      mockAnimationFrame();
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'd3'});
      point = layer.createFeature('point', {
        style: {
          strokeWidth: 2,
          radius: function (d) {
            return d.radius ? d.radius : 5;
          }
        }
      }).data(testPoints);
      point.draw();
      stepAnimationFrame();
      var circles = layer.node().find('circle');
      expect(circles.length).toBe(19);
      expect(circles.eq(0).attr('r')).toBe('5');
      expect(circles.eq(12).attr('r')).toBe('10');
      unmockAnimationFrame();
    });
  });

  /* This is a basic integration test of geo.gl.pointFeature. */
  describe('geo.gl.pointFeature', function () {
    var map, layer, point, point2, glCounts, i, count = 0;
    var array1 = new Array(testPoints.length),
        array2 = new Array(testPoints.length),
        array3 = new Array(testPoints.length);
    for (i = 0; i < testPoints.length; i += 1) {
      array1[i] = i + 1;
      array2[i] = i % 2 ? true : false;
      array3[i] = {r: 0.5, g: 0.5, b: 0.5};
    }
    it('basic usage', function () {
      mockVGLRenderer();
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'vgl'});
      point = layer.createFeature('point', {
        style: {
          strokeWidth: 2,
          radius: function (d) {
            return d.radius ? d.radius : 5;
          }
        }
      }).data(testPoints);
      glCounts = $.extend({}, vgl.mockCounts());
      point.draw();
      expect(point.verticesPerFeature()).toBe(1);
    });
    waitForIt('next render gl A', function () {
      return vgl.mockCounts().createProgram >= (glCounts.createProgram || 0) + 1;
    });
    it('other primitive shapes', function () {
      point2 = layer.createFeature('point', {
        primitiveShape: 'triangle'
      }).data(testPoints);
      expect(point2.verticesPerFeature()).toBe(3);
      layer.deleteFeature(point2);
      point2 = layer.createFeature('point', {
        primitiveShape: 'square'
      }).data(testPoints);
      expect(point2.verticesPerFeature()).toBe(6);
      glCounts = $.extend({}, vgl.mockCounts());
      point2.draw();
    });
    waitForIt('next render gl B', function () {
      return vgl.mockCounts().drawArrays >= (glCounts.drawArrays || 0) + 1;
    });
    it('updateStyleFromArray single', function () {
      point.draw = function () {
        count += 1;
      };
      glCounts = $.extend({}, vgl.mockCounts());
      point.updateStyleFromArray('radius', array1, true);
      expect(count).toBe(0);
    });
    waitForIt('next render gl C', function () {
      return vgl.mockCounts().drawArrays >= (glCounts.drawArrays || 0) + 1;
    });
    it('updateStyleFromArray multiple', function () {
      glCounts = $.extend({}, vgl.mockCounts());
      point.updateStyleFromArray({stroke: array2, strokeColor: array3}, null, true);
      expect(count).toBe(0);
    });
    waitForIt('next render gl D', function () {
      return vgl.mockCounts().drawArrays >= (glCounts.drawArrays || 0) + 1;
    });
    it('updateStyleFromArray non-optimized', function () {
      point.updateStyleFromArray('unknown', array1, true);
      expect(count).toBe(1);
      // a different length array will trigger a slow draw, too.
      point.data(testPoints.slice(0, 18));
      point.updateStyleFromArray('radius', array1, true);
      expect(count).toBe(2);
    });
    it('_exit', function () {
      expect(point.actors().length).toBe(1);
      layer.deleteFeature(point);
      expect(point.actors().length).toBe(0);
      point.data(testPoints);
      map.draw();
      destroyMap();
      restoreVGLRenderer();
    });
  });
});
