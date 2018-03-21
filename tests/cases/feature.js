// Test geo.feature

var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;

describe('geo.feature', function () {
  'use strict';

  beforeEach(function () {
    sinon.stub(console, 'warn', function () {});
  });
  afterEach(function () {
    console.warn.restore();
  });

  describe('create', function () {
    it('create function', function () {
      var map, layer, feat;
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'd3'});

      feat = geo.feature.create();
      expect(feat).toBeNull();
      expect(console.warn.calledOnce).toBe(true);
      expect(console.warn.calledWith('Invalid layer')).toBe(true);
      console.warn.reset();

      feat = geo.feature.create(layer);
      expect(feat).toBeNull();
      expect(console.warn.calledOnce).toBe(true);
      expect(console.warn.calledWith('Invalid spec')).toBe(true);
      console.warn.reset();

      feat = geo.feature.create(layer, {type: 'no_feature'});
      expect(feat).toBeNull();
      expect(console.warn.calledOnce).toBe(true);
      expect(console.warn.calledWith(
        'Could not create feature type "no_feature"')).toBe(true);
      console.warn.reset();

      feat = geo.feature.create(layer, {type: 'point'});
      expect(feat).not.toBeNull();
      layer.deleteFeature(feat);

      feat = geo.feature({layer: layer});
      expect(feat.layer()).toBe(layer);
      expect(feat.renderer()).toBe(null);
    });
  });
  describe('Check private class methods', function () {
    var map, layer, feat, points = {index: [], found: []}, box = [],
        events = {};
    it('_init', function () {
      map = createMap();
      layer = map.createLayer('feature', {renderer: null});
      expect(function () {
        geo.feature();
      }).toThrow(new Error('Feature requires a valid layer'));
      feat = geo.feature({layer: layer});
      expect(feat.style('opacity')).toBe(1);
      expect(feat.selectionAPI()).toBe(false);
    });
    it('_exit', function () {
      feat = geo.feature({layer: layer});
      feat._exit();
      expect(feat.style('opacity')).toBe(undefined);
    });
    it('empty functions', function () {
      feat = geo.feature({layer: layer});
      expect(feat._build()).toBe(undefined);
      expect(feat._update()).toBe(undefined);
    });
    it('_bindMouseHandlers', function () {
      feat = geo.feature({layer: layer, selectionAPI: true});
      layer.addFeature(feat);  /* needed to propagate interactions */
      feat.pointSearch = function () {
        return points;
      };
      feat.boxSearch = function () {
        return box;
      };
      points.index = [1];
      feat.geoOn(geo.event.feature.mouseover, function (evt) { events.mouseover = evt; });
      feat.geoOn(geo.event.feature.mouseout, function (evt) { events.mouseout = evt; });
      feat.geoOn(geo.event.feature.mousemove, function (evt) { events.mousemove = evt; });
      feat.geoOn(geo.event.feature.mouseon, function (evt) { events.mouseon = evt; });
      feat.geoOn(geo.event.feature.mouseoff, function (evt) { events.mouseoff = evt; });
      feat.geoOn(geo.event.feature.mouseclick, function (evt) { events.mouseclick = evt; });
      feat.geoOn(geo.event.feature.brush, function (evt) { events.brush = evt; });
      feat.geoOn(geo.event.feature.brushend, function (evt) { events.brushend = evt; });
      map.interactor().simulateEvent('mousemove', {map: {x: 20, y: 20}});
      expect(events.mouseover.index).toBe(1);
    });
    it('_unbindMouseHandlers', function () {
      feat._unbindMouseHandlers();
      events = {};
      points.index = [2];
      map.interactor().simulateEvent('mousemove', {map: {x: 20, y: 21}});
      expect(events.mouseover).toBe(undefined);
      feat._bindMouseHandlers();
      points.index = [3];
      map.interactor().simulateEvent('mousemove', {map: {x: 20, y: 22}});
      expect(events.mouseover.index).toBe(3);
    });
    it('_handleMousemove', function () {
      points.index = [3];
      events = {};
      feat._handleMousemove();
      /* since the selected points didn't change, we should only have a move event */
      expect(Object.getOwnPropertyNames(events)).toEqual(['mousemove']);
      points.index = [];
      events = {};
      feat._handleMousemove();
      expect(Object.getOwnPropertyNames(events).sort()).toEqual(['mouseoff', 'mouseout']);
      events = {};
      feat._handleMousemove();
      expect(Object.getOwnPropertyNames(events)).toEqual([]);
      points.index = [4, 5];
      events = {};
      feat._handleMousemove();
      expect(Object.getOwnPropertyNames(events).sort()).toEqual(['mousemove', 'mouseon', 'mouseover']);
      points.index = [5, 4];
      events = {};
      feat._handleMousemove();
      expect(Object.getOwnPropertyNames(events).sort()).toEqual(['mousemove', 'mouseoff', 'mouseon']);
    });
    it('_handleMouseclick', function () {
      points.index = [];
      events = {};
      feat._handleMouseclick({buttonsDown: {left: true}});
      expect(Object.getOwnPropertyNames(events)).toEqual([]);
      points.index = [6];
      events = {};
      feat._handleMouseclick({buttonsDown: {left: true}});
      expect(Object.getOwnPropertyNames(events)).toEqual(['mouseclick']);
      expect(events.mouseclick.index).toEqual(6);
      expect(events.mouseclick.mouse.buttonsDown.left).toBe(true);
    });
    it('_handleBrush', function () {
      box = [7, 8];
      events = {};
      feat._handleBrush({gcs: {}});
      expect(Object.getOwnPropertyNames(events)).toEqual(['brush']);
      expect(events.brush.index).toEqual(8);
    });
    it('_handleBrushend', function () {
      box = [9];
      events = {};
      feat._handleBrushend({gcs: {}});
      expect(Object.getOwnPropertyNames(events)).toEqual(['brushend']);
      expect(events.brushend.index).toEqual(9);
    });
    it('_clearSelectedFeatures', function () {
      points.index = [];
      events = {};
      feat._handleMousemove();
      points.index = [4, 5];
      events = {};
      feat._handleMousemove();
      expect(Object.getOwnPropertyNames(events).sort()).toEqual(['mousemove', 'mouseon', 'mouseover']);
      // moving again shouldn't report a mouseon or mouseover
      feat._handleMousemove();
      expect(Object.getOwnPropertyNames(events).sort()).toEqual(['mousemove', 'mouseon', 'mouseover']);
      expect(feat._clearSelectedFeatures()).toBe(feat);
      // moving again should now report a mouseon and mouseover
      feat._handleMousemove();
      expect(Object.getOwnPropertyNames(events).sort()).toEqual(['mousemove', 'mouseon', 'mouseover']);
    });
  });
  describe('Check public class methods', function () {
    var map, layer, feat;
    it('pointSearch', function () {
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'd3'});
      feat = geo.feature({layer: layer, renderer: layer.renderer()});
      expect(feat.pointSearch()).toEqual({index: [], found: []});
    });
    it('boxSearch', function () {
      expect(feat.boxSearch()).toEqual([]);
    });
    it('featureGcsToDisplay', function () {
      var pos = feat.featureGcsToDisplay({x: -24.6094, y: 13.0688});
      expect(pos.x).toBeCloseTo(40);
      expect(pos.y).toBeCloseTo(30);
      feat.gcs('EPSG:3857');
      pos = feat.featureGcsToDisplay({x: -2739503, y: 1467591});
      expect(pos.x).toBeCloseTo(40);
      expect(pos.y).toBeCloseTo(30);
    });
    it('visible', function () {
      expect(feat.visible()).toBe(true);
      var modTime = feat.getMTime();
      expect(feat.visible(false)).toBe(feat);
      expect(feat.visible()).toBe(false);
      expect(feat.getMTime()).toBeGreaterThan(modTime);

      expect(feat.visible(true)).toBe(feat);
      var depFeat = geo.feature({layer: layer, renderer: layer.renderer()});
      feat.dependentFeatures([depFeat]);
      modTime = depFeat.getMTime();
      expect(feat.visible(false)).toBe(feat);
      expect(feat.visible()).toBe(false);
      expect(depFeat.visible()).toBe(false);
      expect(depFeat.getMTime()).toBeGreaterThan(modTime);
      feat.dependentFeatures([]);
      expect(feat.visible(true)).toBe(feat);
      expect(depFeat.visible()).toBe(false);

      // the layer can control the visibility
      expect(feat.visible()).toBe(true);
      expect(feat.visible(undefined, true)).toBe(true);
      layer.visible(false);
      expect(feat.visible()).toBe(false);
      expect(feat.visible(undefined, true)).toBe(true);
      expect(feat.visible(false, true)).toBe(feat);
      expect(feat.visible()).toBe(false);
      expect(feat.visible(undefined, true)).toBe(false);
      layer.visible(true);
      expect(feat.visible()).toBe(false);
      expect(feat.visible(true, true)).toBe(feat);
      expect(feat.visible()).toBe(true);
    });
    it('updateStyleFromArray', function () {
      var count = 0;
      feat.draw = function () {
        count += 1;
      };
      feat._subfeatureStyles.opacity = true;
      feat.data([1, 2, 3, 4]);
      feat.style({radius: 10, strokeColor: 'white', opacity: 0.5});
      feat.style('radius', 10);
      expect(feat.style.get('radius')(2, 1)).toBe(10);
      expect(feat.style.get('strokeColor')(2, 1)).toEqual({r: 1, g: 1, b: 1});
      expect(feat.style.get('opacity')(0, 0, 2, 1)).toBe(0.5);
      expect(feat.updateStyleFromArray('radius', [11, 12, 13, 14])).toBe(feat);
      expect(feat.style.get('radius')(2, 1)).toBe(12);
      feat.updateStyleFromArray({radius: [21, 22, 23, 24]});
      expect(feat.style.get('radius')(2, 1)).toBe(22);
      feat.updateStyleFromArray('strokeColor', [{r: 1, g: 0, b: 0}]);
      expect(feat.style.get('strokeColor')(1, 0)).toEqual({r: 1, g: 0, b: 0});
      expect(feat.style.get('strokeColor')(2, 1)).toEqual({r: 0, g: 0, b: 0});
      feat.updateStyleFromArray('opacity', [0.1, 0.2, 0.3, 0.4]);
      expect(feat.style.get('opacity')(0, 0, 2, 1)).toBe(0.2);
      expect(feat.style.get('opacity')(0, 1, 2, 1)).toBe(0.2);
      feat.updateStyleFromArray('opacity', [[0.11, 0.12], [0.21, 0.22], [0.31, 0.32], [0.41, 0.42]]);
      expect(feat.style.get('opacity')(0, 0, 2, 1)).toBe(0.21);
      expect(feat.style.get('opacity')(0, 1, 2, 1)).toBe(0.22);
      expect(feat.updateStyleFromArray('opacity', 0.5)).toBe(feat);
      expect(feat.style.get('opacity')(0, 0, 2, 1)).toBe(0.21);
      expect(count).toBe(0);
      feat.updateStyleFromArray('opacity', [0.1, 0.2, 0.3, 0.4], true);
      expect(count).toBe(1);
      feat.visible(false);
      feat.updateStyleFromArray('radius', [11, 12, 13, 14], true);
      expect(count).toBe(1);
    });
  });
  describe('Check class accessors', function () {
    var map, layer, feat;
    it('style', function () {
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'd3'});
      feat = geo.feature({layer: layer, renderer: layer.renderer()});
      expect(feat.style()).toEqual({opacity: 1});
      expect(feat.style('opacity')).toBe(1);
      expect(feat.style('radius')).toBe(undefined);
      expect(feat.style('radius', 10)).toBe(feat);
      expect(feat.style('radius')).toBe(10);
      expect(feat.style({radius: 5})).toBe(feat);
      expect(feat.style('radius')).toBe(5);
      expect(feat.style.get('radius')()).toBe(5);
      var all = feat.style.get();
      expect(Object.getOwnPropertyNames(all).sort()).toEqual(['opacity', 'radius']);
      expect(all.radius()).toBe(5);
      feat.style('strokeColor', 'red');
      expect(feat.style.get('strokeColor')()).toEqual({r: 1, g: 0, b: 0});
      feat.style('strokeColor', function () { return 'lime'; });
      expect(feat.style.get('strokeColor')()).toEqual({r: 0, g: 1, b: 0});
    });
    it('layer', function () {
      expect(feat.layer()).toBe(layer);
    });
    it('renderer', function () {
      expect(feat.renderer()).toBe(layer.renderer());
    });
    it('gcs', function () {
      expect(feat.gcs()).toBe(map.ingcs());
      expect(feat.gcs('EPSG:3857')).toBe(feat);
      expect(feat.gcs()).toBe('EPSG:3857');
    });
    it('dependentFeatures', function () {
      expect(feat.dependentFeatures()).toEqual([]);
      var depFeat = geo.feature({layer: layer, renderer: layer.renderer()});
      expect(feat.dependentFeatures([depFeat])).toBe(feat);
      expect(feat.dependentFeatures()).toEqual([depFeat]);
    });
    it('bin', function () {
      expect(feat.bin()).toBe(0);
      expect(feat.bin(5)).toBe(feat);
      expect(feat.bin()).toBe(5);
    });
    it('dataTime', function () {
      var ts = geo.timestamp();
      expect(feat.dataTime() instanceof geo.timestamp).toBe(true);
      expect(feat.dataTime()).not.toBe(ts);
      expect(feat.dataTime(ts)).toBe(feat);
      expect(feat.dataTime()).toBe(ts);
    });
    it('buildTime', function () {
      var ts = geo.timestamp();
      expect(feat.buildTime() instanceof geo.timestamp).toBe(true);
      expect(feat.buildTime()).not.toBe(ts);
      expect(feat.buildTime(ts)).toBe(feat);
      expect(feat.buildTime()).toBe(ts);
    });
    it('updateTime', function () {
      var ts = geo.timestamp();
      expect(feat.updateTime() instanceof geo.timestamp).toBe(true);
      expect(feat.updateTime()).not.toBe(ts);
      expect(feat.updateTime(ts)).toBe(feat);
      expect(feat.updateTime()).toBe(ts);
    });
    it('data', function () {
      expect(feat.data()).toEqual([]);
      expect(feat.data([1])).toBe(feat);
      expect(feat.data()).toEqual([1]);
      expect(feat.style('data')).toEqual([1]);
    });
    it('selectionAPI', function () {
      expect(feat.selectionAPI()).toBe(false);
      feat = geo.feature({layer: layer, renderer: layer.renderer(), selectionAPI: true});
      expect(feat.selectionAPI()).toBe(true);
      expect(feat.selectionAPI(false)).toBe(feat);
      expect(feat.selectionAPI()).toBe(false);
      expect(feat.selectionAPI('not false')).toBe(feat);
      expect(feat.selectionAPI()).toBe(true);
      expect(feat.selectionAPI(0)).toBe(feat);
      expect(feat.selectionAPI()).toBe(false);

      // the layer can control the visibility
      feat.selectionAPI(true);
      expect(feat.selectionAPI()).toBe(true);
      expect(feat.selectionAPI(undefined, true)).toBe(true);
      layer.selectionAPI(false);
      expect(feat.selectionAPI()).toBe(false);
      expect(feat.selectionAPI(undefined, true)).toBe(true);
      expect(feat.selectionAPI(false, true)).toBe(feat);
      expect(feat.selectionAPI()).toBe(false);
      expect(feat.selectionAPI(undefined, true)).toBe(false);
      layer.selectionAPI(true);
      expect(feat.selectionAPI()).toBe(false);
      expect(feat.selectionAPI(true, true)).toBe(feat);
      expect(feat.selectionAPI()).toBe(true);
    });
  });
});
