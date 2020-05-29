// Test geo.trackFeature, geo.svg.trackFeature, and geo.webgl.trackFeature

// var $ = require('jquery');
var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;
var destroyMap = require('../test-utils').destroyMap;
var mockWebglRenderer = geo.util.mockWebglRenderer;
var restoreWebglRenderer = geo.util.restoreWebglRenderer;
// var vgl = require('vgl');
// var waitForIt = require('../test-utils').waitForIt;

describe('geo.trackFeature', function () {
  'use strict';

  var testTracks = [
    {
      id: 'AAL1221',
      x: [-75.0789, -75.0384, -74.9988, -74.9605, -74.9235, -74.8836, -74.8436, -74.802, -74.7533],
      y: [40.1137, 40.1467, 40.1791, 40.2103, 40.2403, 40.2703, 40.2991, 40.3284, 40.3669],
      t: [1570129579, 1570129609, 1570129640, 1570129670, 1570129699, 1570129730, 1570129759, 1570129790, 1570129830]
    }, {
      id: 'UPS2424',
      x: [-75.1656, -75.1997, -75.2477],
      y: [39.968, 39.993, 40.0253],
      t: [1570129759, 1570129790, 1570129830]
    }, {
      id: 'N316JS',
      x: [-74.9619, -74.9875, -75.0146, -75.0392, -75.0623, -75.0936, -75.1188, -75.1447, -75.1764],
      y: [40.1677, 40.1695, 40.1716, 40.1736, 40.1755, 40.1783, 40.1804, 40.1826, 40.1852],
      t: [1570129579, 1570129609, 1570129640, 1570129670, 1570129699, 1570129730, 1570129759, 1570129790, 1570129830]
    }, {
      id: 'RPA4550',
      x: [-75.1074, -75.075, -75.0871, -75.1157, -75.1437, -75.1729, -75.2044, -75.2371, -75.2812],
      y: [39.8434, 39.8172, 39.7799, 39.7508, 39.72, 39.685, 39.6484, 39.6097, 39.558],
      t: [1570129579, 1570129609, 1570129640, 1570129670, 1570129699, 1570129730, 1570129759, 1570129790, 1570129830]
    }, {
      id: 'N913CR',
      x: [-74.8837, -74.8696, -74.8693, -74.8703, -74.8769, -74.8826, -74.8994, -74.9209, -74.9501],
      y: [39.8171, 39.857, 39.8732, 39.9092, 39.9312, 39.9497, 39.9557, 39.9511, 39.9422],
      t: [1570129579, 1570129609, 1570129640, 1570129670, 1570129699, 1570129730, 1570129759, 1570129790, 1570129830]
    }, {
      id: 'JBU623',
      x: [-75.1583, -75.2288, -75.3011, -75.3711, -75.4414, -75.5162, -75.5847, -75.6578, -75.7545],
      y: [40.149, 40.1432, 40.1371, 40.1311, 40.1251, 40.1186, 40.1127, 40.1063, 40.0977],
      t: [1570129579, 1570129609, 1570129640, 1570129670, 1570129699, 1570129730, 1570129759, 1570129790, 1570129830]
    }, {
      id: 'SWA865',
      x: [-74.7815, -74.7381, -74.6956, -74.652, -74.611, -74.5693, -74.5282, -74.4869, -74.4348],
      y: [40.0032, 40.0335, 40.0631, 40.0936, 40.1225, 40.1513, 40.1795, 40.2087, 40.25],
      t: [1570129579, 1570129609, 1570129640, 1570129670, 1570129699, 1570129730, 1570129759, 1570129790, 1570129830]
    }, {
      id: 'AAL341',
      x: [],
      y: [],
      t: []
    }, {
      id: 'UPS2424',
      x: [-75.2145, -75.1835],
      y: [39.876, 39.8802],
      t: [1570129609, 1570129640]
    }, {
      id: 'GAJ834',
      x: [-75.2399],
      y: [39.895],
      t: [1570129579]
    }
  ];

  describe('create', function () {
    it('direct', function () {
      var map, layer, track;
      map = createMap();
      layer = map.createLayer('feature', {features: ['track']});
      track = geo.trackFeature({layer: layer});
      expect(track instanceof geo.trackFeature).toBe(true);
      destroyMap();
    });
    it('svg', function () {
      var map, layer, track;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'svg'});
      track = layer.createFeature('track');
      expect(track instanceof geo.svg.trackFeature).toBe(true);
      destroyMap();
    });
    it('canvas', function () {
      var map, layer, track;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      track = layer.createFeature('track');
      expect(track instanceof geo.canvas.trackFeature).toBe(true);
      destroyMap();
    });
    it('webgl', function () {
      mockWebglRenderer();
      var map, layer, track;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'webgl'});
      track = layer.createFeature('track');
      expect(track instanceof geo.webgl.trackFeature).toBe(true);
      destroyMap();
      restoreWebglRenderer();
    });
  });

  describe('Public utility methods', function () {
    var map, layer, track;
    it('setup', function () {
      // the marker feature needs webgl
      mockWebglRenderer();
      map = createMap();
      layer = map.createLayer('feature', {features: ['track']});
    });
    it('calculateTimePosition', function () {
      track = layer.createFeature('track')
        .data(testTracks)
        .track(function (d) { return d.t; })
        .position(function (d, i, t, j) { return {x: testTracks[j].x[i], y: testTracks[j].y[i]}; })
        .time(function (d, i, t, j) { return d; });
      var ctp = track.calculateTimePosition(1570129640);
      expect(ctp.length).toBe(10);
      expect(ctp[0]).toEqual({x: -74.9988, y: 40.1791, z: 0, posidx: 2, angidx0: 1, angidx1: 3});
      ctp = track.calculateTimePosition(1570129640, undefined, true);
      expect(ctp[0].angle).toBeCloseTo(0.6847);
      ctp = track.calculateTimePosition(1570129635);
      expect(ctp[0].x).toBeCloseTo(-75.0052);
      ctp = track.calculateTimePosition(1570129570);
      expect(ctp[0].x).toBe(-75.0789);
      ctp = track.calculateTimePosition(1570129840);
      expect(ctp[0].x).toBe(-74.7533);
    });
    it('modified', function () {
      layer = map.createLayer('feature', {features: ['track']});
      track = layer.createFeature('track')
        .data(testTracks)
        .track(function (d) { return d.t; })
        .position(function (d, i, t, j) { return {x: testTracks[j].x[i], y: testTracks[j].y[i]}; })
        .time(function (d, i, t, j) { return d; })
        .style('text', function (d, i) { return i % 2 ? testTracks[i].id : undefined; });
      track._build();
      sinon.stub(layer.features()[1], 'modified', function () {});
      track.modified();
      expect(layer.features()[1].modified.calledOnce).toBe(true);
      layer.features()[1].modified.restore();
    });
    it('draw', function () {
      sinon.stub(layer.features()[1], 'draw', function () {});
      track.draw();
      expect(layer.features()[1].draw.calledOnce).toBe(true);
      layer.features()[1].draw.restore();
    });
    it('cleanup', function () {
      destroyMap();
      restoreWebglRenderer();
    });
  });

  describe('Check class accessors', function () {
    var map, layer, track, track2;
    it('setup', function () {
      // the marker feature needs webgl
      mockWebglRenderer();
      map = createMap();
      layer = map.createLayer('feature', {features: ['track']});
      track = layer.createFeature('track', {
        track: function (d) { return d.t; }
      })
        .data(testTracks)
        .position(function (d, i, t, j) { return {x: testTracks[j].x[i], y: testTracks[j].y[i]}; })
        .time(function (d, i, t, j) { return d; })
        .style('text', function (d, i) { return i % 2 ? testTracks[i].id : undefined; });
      track2 = layer.createFeature('track');
    });
    it('styles', function () {
      expect(track.style().opacity).toBe(1);
      expect(track.style('opacity')).toBe(1);
      expect(track.style.get('opacity')()).toBe(1);
      expect(track.style('opacity', 0.5)).toBe(track);
      expect(track.style().opacity).toBe(0.5);
      expect(track.style({opacity: 1})).toBe(track);
      expect(track.style().opacity).toBe(1);
      expect(track.pastStyle().strokeOpacity).toBe(0.25);
      expect(track.currentStyle().strokeOpacity).toBe(undefined);
      expect(track.futureStyle().strokeOpacity).toBe(0.25);
      expect(track.markerStyle().rotateWithMap).toBe(true);
      expect(track.textStyle().rotateWithMap).toBe(true);
      expect(track.currentStyle('strokeOpacity', 0.5)).toBe(track);
      expect(track.currentStyle().strokeOpacity).toBe(0.5);
      expect(track.style('strokeOpacity', 1, 'currentStyle')).toBe(track);
      expect(track.currentStyle().strokeOpacity).toBe(1);
      expect(track.style('strokeOpacity', undefined, 'currentStyle')).toBe(1);
    });
    it('track', function () {
      let oldfunc = track.track();
      expect(track.track()({t: 'x'})).toBe('x');
      expect(track.track(function (d) { return d; })).toBe(track);
      expect(track.track()('y')).toBe('y');
      expect(track.track(oldfunc)).toBe(track);
      expect(track.track()({t: 'x'})).toBe('x');
      expect(track2.track()('z')).toBe('z');
    });
    it('position', function () {
      let oldfunc = track.position();
      expect(track.position()(0, 0, 0, 0).x).toBe(-75.0789);
      expect(track.position(function (d) { return d; })).toBe(track);
      expect(track.position()('y')).toBe('y');
      expect(track.position(oldfunc)).toBe(track);
      expect(track.position()(0, 0, 0, 0).x).toBe(-75.0789);
      expect(track2.position()('z')).toBe('z');
    });
    it('time', function () {
      let oldfunc = track.time();
      expect(track.time()('x')).toBe('x');
      expect(track.time(function (d) { return d + 'a'; })).toBe(track);
      expect(track.time()('y')).toBe('ya');
      expect(track.time(oldfunc)).toBe(track);
      expect(track.time()('x')).toBe('x');
      expect(track2.time()('z', 'c')).toBe('c');
      expect(track2.time()({t: 'b'})).toBe('b');
    });
    it('timeRange', function () {
      track._build();
      expect(track.timeRange()).toEqual({
        startTime: null,
        endTime: null,
        duration: null,
        start: 1570129579,
        end: 1570129830,
        minimum: 1570129579,
        maximum: 1570129830
      });
      // start only
      expect(track.timeRange({startTime: 1570129600})).toBe(track);
      expect(track.timeRange().start).toBe(1570129600);
      expect(track.timeRange().end).toBe(1570129830);
      // start and end
      expect(track.timeRange({endTime: 1570129800})).toBe(track);
      expect(track.timeRange().start).toBe(1570129600);
      expect(track.timeRange().end).toBe(1570129800);
      // start, end, and duration
      expect(track.timeRange({duration: 120})).toBe(track);
      expect(track.timeRange().start).toBe(1570129600);
      expect(track.timeRange().end).toBe(1570129800);
      // end and duration
      expect(track.timeRange({startTime: null})).toBe(track);
      expect(track.timeRange().start).toBe(1570129680);
      expect(track.timeRange().end).toBe(1570129800);
      // start and duration
      expect(track.timeRange({endTime: null, startTime: 1570129600})).toBe(track);
      expect(track.timeRange().start).toBe(1570129600);
      expect(track.timeRange().end).toBe(1570129720);
      // duration only
      expect(track.timeRange({startTime: null})).toBe(track);
      expect(track.timeRange().start).toBe(1570129710);
      expect(track.timeRange().end).toBe(1570129830);
      // end only
      expect(track.timeRange({endTime: 1570129800, duration: null})).toBe(track);
      expect(track.timeRange().start).toBe(1570129579);
      expect(track.timeRange().end).toBe(1570129800);
      // none
      expect(track.timeRange({endTime: null})).toBe(track);
      expect(track.timeRange().start).toBe(1570129579);
      expect(track.timeRange().end).toBe(1570129830);
    });
    it('startTime', function () {
      expect(track.startTime()).toBe(null);
      expect(track.startTime(1570129600)).toBe(track);
      expect(track.startTime()).toBe(1570129600);
      expect(track.startTime(null)).toBe(track);
      expect(track.startTime()).toBe(null);
    });
    it('endTime', function () {
      expect(track.endTime()).toBe(null);
      expect(track.endTime(1570129800)).toBe(track);
      expect(track.endTime()).toBe(1570129800);
      expect(track.endTime(null)).toBe(track);
      expect(track.endTime()).toBe(null);
    });
    it('duration', function () {
      expect(track.duration()).toBe(null);
      expect(track.duration(120)).toBe(track);
      expect(track.duration()).toBe(120);
      expect(track.duration(null)).toBe(track);
      expect(track.duration()).toBe(null);
    });
    it('pointSearch', function () {
      var pt;
      track.pastStyle({strokeOpacity: 0});
      map.zoom(6);
      pt = track.pointSearch({x: -74.9875, y: 40.1695});
      expect(pt.found.length).toBe(2);
      expect(pt.index[1]).toEqual(2);
      expect(pt.extra[2]).toEqual(0);
      pt = track.pointSearch({x: -75.0011, y: 40.17055});
      expect(pt.found.length).toBe(2);
      expect(pt.index[1]).toEqual(2);
      expect(pt.extra[2]).toEqual(0);
      track.startTime(1570129750);
      pt = track.pointSearch({x: -74.9875, y: 40.1695});
      expect(pt.found.length).toBe(0);
      track.startTime(null);
      track.endTime(1570129580);
      pt = track.pointSearch({x: -74.9875, y: 40.1695});
      expect(pt.found.length).toBe(2);
      expect(pt.index[0]).toEqual(2);
      expect(pt.extra[0].where).toEqual('marker');
      track.endTime(null);
    });
    it('polygonSearch', function () {
      var pt;
      pt = track.polygonSearch([{x: -75.03, y: 40.16}, {x: -75.03, y: 40.20}, {x: -75.05, y: 40.18}]);
      expect(pt.found.length).toBe(0);
      pt = track.polygonSearch([{x: -75.03, y: 40.16}, {x: -75.03, y: 40.20}, {x: -75.05, y: 40.18}], {partial: true});
      expect(pt.found.length).toBe(2);
      expect(pt.index[1]).toEqual(2);
    });
    it('cleanup', function () {
      destroyMap();
      restoreWebglRenderer();
    });
  });

  describe('Private utility methods', function () {
    var map, layer, track;
    /* Only private utility methods that weere not completely covered by
     * public methods and accessors are included here. */
    it('setup', function () {
      // the marker feature needs webgl
      mockWebglRenderer();
      map = createMap();
      layer = map.createLayer('feature', {features: ['track']});
      track = layer.createFeature('track')
        .data(testTracks)
        .track(function (d) { return d.t; })
        .position(function (d, i, t, j) { return {x: testTracks[j].x[i], y: testTracks[j].y[i]}; })
        .time(function (d, i, t, j) { return d; })
        .style('text', function (d, i) { return i % 2 ? testTracks[i].id : undefined; });
    });
    it('_updateTimeAndPosition', function () {
      // don't fail if _build was never called.
      expect(track._updateTimeAndPosition()).toBe(undefined);
    });
    it('cleanup', function () {
      destroyMap();
      restoreWebglRenderer();
    });
  });

  describe('geo.svg.trackFeature', function () {
    it('basic usage', function () {
      var map, layer, track;
      mockWebglRenderer();
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'svg'});
      track = layer.createFeature('track')
        .data(testTracks)
        .track(function (d) { return d.t; })
        .position(function (d, i, t, j) { return {x: testTracks[j].x[i], y: testTracks[j].y[i]}; })
        .time(function (d, i, t, j) { return d; })
        .style('text', function (d, i) { return i % 2 ? testTracks[i].id : undefined; });
      track.draw();
      expect(layer.children().length).toBe(6);
      expect(layer.children()[4].features()[0] instanceof geo.webgl.markerFeature).toBe(true);
      expect(layer.children()[5].features()[0] instanceof geo.canvas.textFeature).toBe(true);
      layer.deleteFeature(track);
      expect(layer.children().length).toBe(0);
      destroyMap();
      restoreWebglRenderer();
    });
  });

  describe('geo.canvas.trackFeature', function () {
    it('basic usage', function () {
      var map, layer, track;
      mockWebglRenderer();
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'canvas'});
      track = layer.createFeature('track')
        .data(testTracks)
        .track(function (d) { return d.t; })
        .position(function (d, i, t, j) { return {x: testTracks[j].x[i], y: testTracks[j].y[i]}; })
        .time(function (d, i, t, j) { return d; })
        .style('text', function (d, i) { return i % 2 ? testTracks[i].id : undefined; });
      track.draw();
      expect(layer.children().length).toBe(6);
      expect(layer.children()[4].features()[0] instanceof geo.webgl.markerFeature).toBe(true);
      expect(layer.children()[5] instanceof geo.canvas.textFeature).toBe(true);
      layer.deleteFeature(track);
      expect(layer.children().length).toBe(0);
      destroyMap();
      restoreWebglRenderer();
    });
  });

  describe('geo.webgl.trackFeature', function () {
    it('basic usage', function () {
      var map, layer, track;
      mockWebglRenderer();
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'webgl'});
      track = layer.createFeature('track')
        .data(testTracks)
        .track(function (d) { return d.t; })
        .position(function (d, i, t, j) { return {x: testTracks[j].x[i], y: testTracks[j].y[i]}; })
        .time(function (d, i, t, j) { return d; })
        .style('text', function (d, i) { return i % 2 ? testTracks[i].id : undefined; });
      track.draw();
      expect(layer.children().length).toBe(6);
      expect(layer.children()[4] instanceof geo.webgl.markerFeature).toBe(true);
      expect(layer.children()[5].features()[0] instanceof geo.canvas.textFeature).toBe(true);
      layer.deleteFeature(track);
      expect(layer.children().length).toBe(0);
      destroyMap();
      restoreWebglRenderer();
    });
  });
});
