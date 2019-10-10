// Test geo.markerFeature, geo.svg.markerFeature, and geo.webgl.markerFeature

var $ = require('jquery');
var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;
var destroyMap = require('../test-utils').destroyMap;
var mockWebglRenderer = geo.util.mockWebglRenderer;
var restoreWebglRenderer = geo.util.restoreWebglRenderer;
var vgl = require('vgl');
var waitForIt = require('../test-utils').waitForIt;

describe('geo.markerFeature', function () {
  'use strict';

  var testMarkers = [
    {x: 20, y: 10},
    {x: 25, y: 10, radius: 1, strokeWidth: 0.1, scaleWithZoom: geo.markerFeature.scaleMode.all},
    {x: 30, y: 10, radius: 2.5, scaleWithZoom: geo.markerFeature.scaleMode.fill},
    {x: 35, y: 10, strokeWidth: 0.1, scaleWithZoom: geo.markerFeature.scaleMode.stroke},
    {x: 40, y: 10, radius: 10, strokeWidth: 0.1, scaleWithZoom: geo.markerFeature.scaleMode.stroke}
  ];

  describe('create', function () {
    it('create function', function () {
      mockWebglRenderer();
      var map, layer, marker;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'webgl'});
      marker = geo.markerFeature.create(layer);
      expect(marker instanceof geo.markerFeature).toBe(true);
      destroyMap();
      restoreWebglRenderer();
    });
    it('direct create', function () {
      mockWebglRenderer();
      var map, layer, marker;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'webgl'});
      marker = geo.markerFeature({layer: layer});
      expect(marker instanceof geo.markerFeature).toBe(true);
      destroyMap();
      restoreWebglRenderer();
    });
  });

  describe('Public utility methods', function () {
    it('pointSearch', function () {
      mockWebglRenderer();
      var map, layer, marker, pt, p, data = testMarkers;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'webgl'});
      marker = layer.createFeature('marker', {selectionAPI: true});
      marker.data(data).style({
        radius: function (d) { return d.radius || 5; },
        strokeWidth: function (d) { return d.strokeWidth || 2; },
        scaleWithZoom: function (d) { return d.scaleWithZoom; }
      });
      pt = marker.pointSearch({x: 20, y: 10});
      expect(pt.index).toEqual([0]);
      expect(pt.found.length).toBe(1);
      expect(pt.found[0]).toEqual(data[0]);
      /* We should land on the marker if we are near the specified radius */
      var psTest = [
        // radius = 5, strokeWidth = 2
        {x: 20, y: 10, zoom3: 5, zoom4: 5},
        // radius = zoom * 1, strokeWidth = zoom * 0.1
        {x: 25, y: 10, zoom3: 8, zoom4: 16},
        // radius = zoom * (2.5 - 2), strokeWidth = 2
        {x: 30, y: 10, zoom3: 6, zoom4: 10},
        // radius = 5 - 0.1 + zoom * 0.1, strokeWidth = zoom * 0.1
        {x: 35, y: 10, zoom3: 5.7, zoom4: 6.5}
      ];
      [3, 4].forEach(function (zoomVal) {
        map.zoom(zoomVal);
        var zoomKey = 'zoom' + zoomVal;
        psTest.forEach(function (entry) {
          p = marker.featureGcsToDisplay(entry);
          pt = marker.pointSearch(map.displayToGcs({x: p.x, y: p.y}));
          expect(pt.found.length).toBe(1);
          pt = marker.pointSearch(map.displayToGcs({x: p.x, y: p.y + entry[zoomKey] - 0.5}));
          expect(pt.found.length).toBe(1);
          pt = marker.pointSearch(map.displayToGcs({x: p.x, y: p.y + entry[zoomKey] + 0.5}));
          expect(pt.found.length).toBe(0);
        });
      });
      /* If we have zero-length data, we get no matches */
      marker.data([]);
      pt = marker.pointSearch({x: 22, y: 10});
      expect(pt.found.length).toBe(0);
      /* Exceptions will be returned properly */
      marker.data(data).style('strokeWidth', function (d, idx) {
        throw new Error('no width');
      });
      expect(function () {
        marker.pointSearch({x: 20, y: 10});
      }).toThrow(new Error('no width'));
      /* Stop throwing the exception */
      marker.style('strokeWidth', 2);
      /* Test with an alternate gcs; pointSearch always uses the map's ingcs */
      marker.gcs(map.gcs());
      marker.data([{x: 2226390, y: 1118890}]);
      pt = marker.pointSearch({x: 20, y: 10});
      expect(pt.index).toEqual([0]);
      expect(pt.found.length).toBe(1);
      destroyMap();
      restoreWebglRenderer();
    });
    it('polygonSearch', function () {
      mockWebglRenderer();
      var map, layer, marker, result, data = testMarkers;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'webgl'});
      marker = layer.createFeature('marker', {selectionAPI: true});
      marker.data(data).style({
        radius: function (d) { return d.radius || 5; },
        strokeWidth: function (d) { return d.strokeWidth || 2; },
        scaleWithZoom: function (d) { return d.scaleWithZoom; }
      });
      result = marker.polygonSearch([{x: 19, y: 8}, {x: 27, y: 8}, {x: 27, y: 12}, {x: 19, y: 12}]);
      expect(result.index).toEqual([0, 1]);
      result = marker.polygonSearch([{x: 19, y: 10}, {x: 27, y: 10}]);
      expect(result.index).toEqual([]);
      result = marker.polygonSearch([{x: 20, y: 8}, {x: 27, y: 8}, {x: 27, y: 12}, {x: 20, y: 12}]);
      expect(result.index).toEqual([1]);
      result = marker.polygonSearch([{x: 35, y: 8}, {x: 35.01, y: 8}, {x: 35, y: 12}]);
      expect(result.index).toEqual([]);
      result = marker.polygonSearch([{x: 35, y: 8}, {x: 35.01, y: 8}, {x: 35, y: 12}], {partial: true});
      expect(result.index).toEqual([3]);
      destroyMap();
      restoreWebglRenderer();
    });
  });

  describe('Private utility methods', function () {
    it('_approximateMaxRadius', function () {
      mockWebglRenderer();
      var map, layer, marker;
      map = createMap();
      map.zoom(3);
      layer = map.createLayer('feature', {renderer: 'webgl'});
      marker = layer.createFeature('marker', {selectionAPI: true});
      marker.data(testMarkers).style({
        radius: function (d) { return d.radius || 5; },
        strokeWidth: function (d) { return d.strokeWidth || 2; },
        strokeOffset: function (d, i) { return i % 3 - 1; },
        scaleWithZoom: function (d) { return d.scaleWithZoom; }
      });
      marker.draw();
      expect(marker._approximateMaxRadius(map.zoom())).toBe(36);
      map.zoom(5);
      marker.draw();
      expect(marker._approximateMaxRadius(map.zoom())).toBe(144);
      map.zoom(6);
      marker.draw();
      expect(marker._approximateMaxRadius(map.zoom())).toBe(288);
      marker.style('strokeOffset', -1).draw();
      expect(marker._approximateMaxRadius(map.zoom())).toBe(160);
      destroyMap();
      restoreWebglRenderer();
    });
  });

  /* This is a basic integration test of geo.webgl.markerFeature. */
  describe('geo.webgl.markerFeature', function () {
    var map, layer, marker, marker2, glCounts;
    it('basic usage', function () {
      mockWebglRenderer();
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'webgl'});
      marker = layer.createFeature('marker');
      marker.data(testMarkers).style({
        radius: function (d) { return d.radius || 5; },
        strokeWidth: function (d) { return d.strokeWidth || 2; },
        scaleWithZoom: function (d) { return d.scaleWithZoom; },
        symbol: geo.markerFeature.symbols.arrow,
        symbolValue: function (d, i) { return i ? [1, 1, 1 / 5, true] : 0.5; }
      });
      glCounts = $.extend({}, vgl.mockCounts());
      marker.draw();
      expect(marker.verticesPerFeature()).toBe(1);
    });
    waitForIt('next render gl A', function () {
      return vgl.mockCounts().createProgram >= (glCounts.createProgram || 0) + 1;
    });
    it('other primitive shapes', function () {
      expect(marker.primitiveShape()).toBe(geo.markerFeature.primitiveShapes.auto);
      expect(marker.primitiveShape(undefined, true)).toBe(geo.markerFeature.primitiveShapes.sprite);
      marker2 = layer.createFeature('marker', {
        primitiveShape: geo.markerFeature.primitiveShapes.triangle
      }).data(testMarkers);
      expect(marker2.primitiveShape()).toBe(geo.markerFeature.primitiveShapes.triangle);
      expect(marker2.verticesPerFeature()).toBe(3);
      layer.deleteFeature(marker2);
      marker2 = layer.createFeature('marker', {
        primitiveShape: geo.markerFeature.primitiveShapes.square
      }).data(testMarkers);
      expect(marker2.verticesPerFeature()).toBe(6);
      glCounts = $.extend({}, vgl.mockCounts());
      marker2.draw();
    });
    waitForIt('next render gl B', function () {
      return vgl.mockCounts().drawArrays >= (glCounts.drawArrays || 0) + 1;
    });
    it('change primitive shapes', function () {
      expect(marker2.primitiveShape(geo.markerFeature.primitiveShapes.auto)).toBe(marker2);
      marker2.draw();
      expect(marker2.primitiveShape()).toBe(geo.markerFeature.primitiveShapes.auto);
      expect(marker2.primitiveShape(undefined, true)).toBe(geo.markerFeature.primitiveShapes.sprite);
      marker2.style('radius', 20000);
      marker2.draw();
      expect(marker2.primitiveShape()).toBe(geo.markerFeature.primitiveShapes.auto);
      expect(marker2.primitiveShape(undefined, true)).toBe(geo.markerFeature.primitiveShapes.triangle);
      marker2.style('radius', 20);
      marker2.draw();
      expect(marker2.primitiveShape()).toBe(geo.markerFeature.primitiveShapes.auto);
      expect(marker2.primitiveShape(undefined, true)).toBe(geo.markerFeature.primitiveShapes.sprite);
      expect(marker2.primitiveShape(geo.markerFeature.primitiveShapes.triangle)).toBe(marker2);
      marker2.draw();
      expect(marker2.primitiveShape()).toBe(geo.markerFeature.primitiveShapes.triangle);
      expect(marker2.primitiveShape(undefined, true)).toBe(geo.markerFeature.primitiveShapes.triangle);
    });
    it('_exit', function () {
      expect(marker.actors().length).toBe(1);
      layer.deleteFeature(marker);
      expect(marker.actors().length).toBe(0);
      marker.data(testMarkers);
      map.draw();
      destroyMap();
      restoreWebglRenderer();
    });
  });
});
