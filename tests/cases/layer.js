// Test geo.layer

var $ = require('jquery');
var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;
var destroyMap = require('../test-utils').destroyMap;
var mockWebglRenderer = geo.util.mockWebglRenderer;
var restoreWebglRenderer = geo.util.restoreWebglRenderer;

describe('geo.layer', function () {
  'use strict';

  beforeEach(function () {
    sinon.stub(console, 'log', function () {});
  });
  afterEach(function () {
    console.log.restore();
  });

  describe('create', function () {
    it('create function', function () {
      var map, layer;

      map = createMap();
      layer = geo.layer({map: map});
      expect(layer instanceof geo.layer).toBe(true);
      expect(layer.initialized()).toBe(false);

      expect(function () {
        geo.layer({});
      }).toThrow(new Error('Layers must be initialized on a map.'));
    });
    it('direct create', function () {
      var map, layer, warn;

      map = createMap();
      layer = geo.layer.create(map, {renderer: 'canvas'});
      expect(layer instanceof geo.layer).toBe(true);
      expect(layer.initialized()).toBe(true);
      expect(layer.children().length).toBe(0);

      layer = geo.layer.create(map, {renderer: 'svg', features: [{type: 'point'}]});
      expect(layer instanceof geo.layer).toBe(true);
      expect(layer.initialized()).toBe(true);
      expect(layer.children().length).toBe(1);

      warn = sinon.stub(console, 'warn', function () {});
      layer = geo.layer.create(map, {renderer: 'notarenderer'});
      expect(warn.calledOnce).toBe(true);
      console.warn.restore();

      warn = sinon.stub(console, 'warn', function () {});
      layer = geo.layer.create(map, {type: 'notalayertype', renderer: 'canvas'});
      expect(warn.calledOnce).toBe(true);
      console.warn.restore();
    });
  });
  describe('Check private class methods', function () {
    var map, layer;
    it('_init', function () {
      map = createMap();
      layer = geo.layer({map: map});
      expect(layer.initialized()).toBe(false);
      layer._init();
      expect(layer.initialized()).toBe(true);
      layer._init();
      expect(layer.initialized()).toBe(true);
    });
    it('_init with events', function () {
      var count = 0;

      layer = geo.layer({map: map});
      map.addChild(layer);
      layer._update = function () { count += 1; };
      layer._init();
      map.size({width: 600});
      map.pan({x: 0, y: 1});
      map.rotation(1);
      map.zoom(1);
      expect(count).toBe(7);  // sie, rotation, zoom also trigger pan
      map.removeChild(layer);
    });
    it('_init without events', function () {
      var count = 0;

      layer = geo.layer({map: map});
      map.addChild(layer);
      layer._update = function () { count += 1; };
      layer._init(true);
      map.size({width: 640});
      map.pan({x: 0, y: 1});
      map.rotation(1);
      map.zoom(1);
      expect(count).toBe(0);
      map.removeChild(layer);
    });
    it('_exit', function () {
      layer = geo.layer({map: map});
      layer._init();
      expect(layer.renderer()).not.toBe(null);
      layer._exit();
      expect(layer.renderer()).toBe(null);
    });
    it('_update', function () {
      layer = geo.layer({map: map});
      expect(layer._update()).toBe(layer);
    });
  });
  describe('Check class (non-instance) methods', function () {
    it('newLayerId', function () {
      var id = geo.layer.newLayerId();
      expect(geo.layer.newLayerId()).toBeGreaterThan(id);
    });
  });
  describe('Check public class methods', function () {
    var map, layer;
    it('active', function () {
      map = createMap();
      layer = geo.layer({map: map});
      expect(layer.active()).toBe(true);
      expect(layer.active(false)).toBe(layer);
      expect(layer.active()).toBe(false);
      expect(layer.active(true)).toBe(layer);
      expect(layer.active()).toBe(true);
      layer = geo.layer({map: map, active: false});
      expect(layer.active()).toBe(false);
      expect(layer.active(true)).toBe(layer);
      expect(layer.active()).toBe(true);
    });
    it('attribution', function () {
      expect(layer.attribution()).toBe(null);
      layer = geo.layer({map: map, attribution: 'attribution1'});
      expect(layer.attribution()).toBe('attribution1');
      expect(layer.attribution('attribution2')).toBe(layer);
      expect(layer.attribution()).toBe('attribution2');
    });
    it('canvas', function () {
      layer = geo.layer({map: map});
      expect(layer.canvas()).toBe(null);
      layer._init();
      expect(layer.canvas()).not.toBe(null);
      expect(layer.canvas()).toBe(layer.renderer().canvas());
      var canvas = layer.canvas();
      var layer2 = geo.layer({map: map, canvas: canvas});
      layer2._init();
      expect(layer2.canvas()).toEqual(layer.canvas());
      var layer3 = geo.layer({map: map});
      layer2._init();
      expect(layer3.canvas()).not.toEqual(layer.canvas());
    });
    it('_canvas', function () {
      layer = geo.layer({map: map});
      expect(layer._canvas()).toBe(null);
      layer._init();
      expect(layer._canvas()).not.toBe(null);
      expect(layer._canvas()).toBe(layer.renderer().canvas());
      expect(layer._canvas('abc')).toBe(layer);
      expect(layer._canvas()).toBe('abc');
    });
    it('dataTime', function () {
      expect(layer.dataTime() instanceof geo.timestamp).toBe(true);
    });
    it('fromLocal', function () {
      expect(layer.fromLocal('abc')).toBe('abc');
    });
    it('height', function () {
      expect(layer.height()).toBe(map.node().height());
    });
    it('id', function () {
      var id;

      expect(layer.id()).toBeGreaterThan(0);
      id = layer.id();
      layer = geo.layer({map: map, id: 1});
      expect(layer.id()).toBe(1);
      expect(layer.id(5)).toBe(layer);
      expect(layer.id()).toBe(5);
      expect(layer.id(null)).toBe(layer);
      expect(layer.id()).toBeGreaterThan(id);
    });
    it('initialized', function () {
      layer = geo.layer({map: map});
      expect(layer.initialized()).toBe(false);
      layer._init();
      expect(layer.initialized()).toBe(true);
      expect(layer.initialized(false)).toBe(layer);
      expect(layer.initialized()).toBe(false);
    });
    it('map', function () {
      expect(layer.map()).toBe(map);
    });
    it('name', function () {
      expect(layer.name()).toBe('');
      layer = geo.layer({map: map, name: 'name1'});
      expect(layer.name()).toBe('name1');
      expect(layer.name('name2')).toBe(layer);
      expect(layer.name()).toBe('name2');
    });
    it('node', function () {
      expect(layer.node().attr('id')).toBe(layer.name());
    });
    it('opacity', function () {
      expect(layer.opacity()).toBe(1);
      layer = geo.layer({map: map, opacity: 0.5});
      expect(layer.opacity()).toBe(0.5);
      expect(layer.opacity(0.75)).toBe(layer);
      expect(layer.opacity()).toBe(0.75);
    });
    it('renderer', function () {
      layer = geo.layer({map: map});
      expect(layer.renderer()).toBe(null);
      layer._init();
      expect(layer.renderer() instanceof geo.renderer).toBe(true);
      var renderer = layer.renderer();
      var layer2 = geo.layer({map: map, renderer: renderer});
      layer2._init();
      expect(layer2.renderer()).toEqual(layer.renderer());
      var layer3 = geo.layer({map: map});
      layer2._init();
      expect(layer3.renderer()).not.toEqual(layer.renderer());
    });
    it('_renderer', function () {
      layer = geo.layer({map: map});
      expect(layer._renderer()).toBe(null);
      layer._init();
      expect(layer._renderer() instanceof geo.renderer).toBe(true);
      expect(layer._renderer('abc')).toBe(layer);
      expect(layer._renderer()).toBe('abc');
    });
    it('rendererName', function () {
      layer = geo.layer({map: map, renderer: 'canvas'});
      expect(layer.rendererName()).toBe('canvas');
    });
    it('selectionAPI', function () {
      expect(layer.selectionAPI()).toBe(true);
      expect(layer.selectionAPI(false)).toBe(layer);
      expect(layer.selectionAPI()).toBe(false);
      expect(layer.selectionAPI(true)).toBe(layer);
      expect(layer.selectionAPI()).toBe(true);
      layer = geo.layer({map: map, selectionAPI: false});
      expect(layer.selectionAPI()).toBe(false);
      expect(layer.selectionAPI(true)).toBe(layer);
      expect(layer.selectionAPI()).toBe(true);
    });
    it('sticky', function () {
      expect(layer.sticky()).toBe(true);
      layer = geo.layer({map: map, sticky: false});
      expect(layer.sticky()).toBe(false);
    });
    it('toLocal', function () {
      expect(layer.toLocal('abc')).toBe('abc');
    });
    it('updateTime', function () {
      expect(layer.updateTime() instanceof geo.timestamp).toBe(true);
    });
    it('visible', function () {
      expect(layer.visible()).toBe(true);
      expect(layer.visible(false)).toBe(layer);
      expect(layer.visible()).toBe(false);
      expect(layer.visible(true)).toBe(layer);
      expect(layer.visible()).toBe(true);
      layer = geo.layer({map: map, visible: false});
      expect(layer.visible()).toBe(false);
      expect(layer.visible(true)).toBe(layer);
      expect(layer.visible()).toBe(true);
    });
    it('width', function () {
      expect(layer.width()).toBe(map.node().width());
    });
    /* zIndex, moveUp, moveDown, moveToTop, and moveToBottom tested in
     * layerReorder.js */
  });
});

describe('geo.webgl.layer', function () {
  'use strict';
  describe('autoshareRenderer is false', function () {
    var map, layer1, layer2, layer3;
    it('_init', function (done) {
      mockWebglRenderer();
      sinon.stub(console, 'log', function () {});
      map = createMap();
      layer1 = map.createLayer('osm', {renderer: 'webgl', url: '/testdata/white.jpg', autoshareRenderer: false});
      layer2 = map.createLayer('osm', {renderer: 'webgl', url: '/testdata/weather.png', keepLower: false, autoshareRenderer: false});
      layer3 = map.createLayer('feature', {renderer: 'webgl', autoshareRenderer: false});
      layer3.createFeature('point', {}).data([{x: 2, y: 1}]);
      map.onIdle(function () {
        expect($('canvas', map.node()).length).toBe(3);
        done();
      });
    });
    it('visible', function () {
      layer1.visible(false);
      expect($('canvas', map.node()).length).toBe(3);
      layer1.visible(true);
      expect($('canvas', map.node()).length).toBe(3);
      layer2.visible(false);
      expect($('canvas', map.node()).length).toBe(3);
      layer2.visible(true);
      expect($('canvas', map.node()).length).toBe(3);
    });
    it('opacity', function () {
      layer1.opacity(0.5);
      expect($('canvas', map.node()).length).toBe(3);
      layer2.opacity(0.5);
      expect($('canvas', map.node()).length).toBe(3);
      layer1.opacity(1);
      expect($('canvas', map.node()).length).toBe(3);
      layer2.opacity(1);
      expect($('canvas', map.node()).length).toBe(3);
    });
    it('zIndex', function () {
      layer1.moveUp();
      expect($('canvas', map.node()).length).toBe(3);
      layer1.moveUp();
      expect($('canvas', map.node()).length).toBe(3);
      layer1.moveToBottom();
      expect($('canvas', map.node()).length).toBe(3);
    });
    it('cleanup', function () {
      console.log.restore();
      destroyMap();
      restoreWebglRenderer();
    });
  });
  describe('autoshareRenderer is true"', function () {
    var map, layer1, layer2, layer3;
    it('_init', function (done) {
      mockWebglRenderer();
      sinon.stub(console, 'log', function () {});
      map = createMap();
      layer1 = map.createLayer('osm', {renderer: 'webgl', url: '/testdata/white.jpg'});
      layer2 = map.createLayer('osm', {renderer: 'webgl', url: '/testdata/weather.png', keepLower: false});
      layer3 = map.createLayer('feature', {renderer: 'webgl'});
      layer3.createFeature('point', {}).data([{x: 2, y: 1}]);
      map.onIdle(function () {
        expect($('canvas', map.node()).length).toBe(1);
        done();
      });
    });
    it('visible', function () {
      layer1.visible(false);
      expect($('canvas', map.node()).length).toBe(1);
      layer1.visible(true);
      expect($('canvas', map.node()).length).toBe(1);
      layer2.visible(false);
      expect($('canvas', map.node()).length).toBe(1);
      layer2.visible(true);
      expect($('canvas', map.node()).length).toBe(1);
    });
    it('opacity', function () {
      layer1.opacity(0.5);
      expect($('canvas', map.node()).length).toBe(2);
      layer2.opacity(0.5);
      expect($('canvas', map.node()).length).toBe(3);
      layer1.opacity(1);
      expect($('canvas', map.node()).length).toBe(3);
      layer2.opacity(1);
      expect($('canvas', map.node()).length).toBe(1);
    });
    it('zIndex', function () {
      expect($('canvas', layer1.node()).length).toBe(1);
      expect($('canvas', layer2.node()).length).toBe(0);
      expect($('canvas', layer3.node()).length).toBe(0);
      layer1.moveUp();
      expect($('canvas', map.node()).length).toBe(1);
      expect($('canvas', layer1.node()).length).toBe(0);
      expect($('canvas', layer2.node()).length).toBe(1);
      expect($('canvas', layer3.node()).length).toBe(0);
      layer1.moveUp();
      expect($('canvas', map.node()).length).toBe(2);
      expect($('canvas', layer1.node()).length).toBe(1);
      expect($('canvas', layer2.node()).length).toBe(1);
      expect($('canvas', layer3.node()).length).toBe(0);
      layer1.moveToBottom();
      expect($('canvas', map.node()).length).toBe(1);
      expect($('canvas', layer1.node()).length).toBe(1);
      expect($('canvas', layer2.node()).length).toBe(0);
      expect($('canvas', layer3.node()).length).toBe(0);
    });
    it('cleanup', function () {
      console.log.restore();
      destroyMap();
      restoreWebglRenderer();
    });
  });
  describe('autoshareRenderer is "more"', function () {
    var map, layer1, layer2, layer3;
    it('_init', function (done) {
      mockWebglRenderer();
      sinon.stub(console, 'log', function () {});
      map = createMap();
      map.autoshareRenderer('more');
      layer1 = map.createLayer('osm', {renderer: 'webgl', url: '/testdata/white.jpg'});
      layer2 = map.createLayer('osm', {renderer: 'webgl', url: '/testdata/weather.png', keepLower: false});
      layer3 = map.createLayer('feature', {renderer: 'webgl'});
      layer3.createFeature('point', {}).data([{x: 2, y: 1}]);
      map.onIdle(function () {
        expect($('canvas', map.node()).length).toBe(1);
        done();
      });
    });
    it('visible', function () {
      layer1.visible(false);
      expect($('canvas', map.node()).length).toBe(1);
      layer1.visible(true);
      expect($('canvas', map.node()).length).toBe(1);
      layer2.visible(false);
      expect($('canvas', map.node()).length).toBe(1);
      layer2.visible(true);
      expect($('canvas', map.node()).length).toBe(1);
    });
    it('opacity', function () {
      layer1.opacity(0.5);
      expect($('canvas', map.node()).length).toBe(2);
      layer2.opacity(0.5);
      expect($('canvas', map.node()).length).toBe(2);
      layer1.opacity(1);
      expect($('canvas', map.node()).length).toBe(3);
      layer2.opacity(1);
      expect($('canvas', map.node()).length).toBe(1);
    });
    it('zIndex', function () {
      expect($('canvas', layer1.node()).length).toBe(1);
      expect($('canvas', layer2.node()).length).toBe(0);
      expect($('canvas', layer3.node()).length).toBe(0);
      layer1.moveUp();
      expect($('canvas', map.node()).length).toBe(1);
      expect($('canvas', layer1.node()).length).toBe(0);
      expect($('canvas', layer2.node()).length).toBe(1);
      expect($('canvas', layer3.node()).length).toBe(0);
      layer1.moveUp();
      expect($('canvas', map.node()).length).toBe(1);
      expect($('canvas', layer1.node()).length).toBe(0);
      expect($('canvas', layer2.node()).length).toBe(1);
      expect($('canvas', layer3.node()).length).toBe(0);
      layer1.moveToBottom();
      expect($('canvas', map.node()).length).toBe(1);
      expect($('canvas', layer1.node()).length).toBe(1);
      expect($('canvas', layer2.node()).length).toBe(0);
      expect($('canvas', layer3.node()).length).toBe(0);
    });
    it('cleanup', function () {
      console.log.restore();
      destroyMap();
      restoreWebglRenderer();
    });
  });
  describe('autoshareRenderer is mixed', function () {
    var map, layer1, layer2, layer3;
    it('_init', function (done) {
      mockWebglRenderer();
      sinon.stub(console, 'log', function () {});
      map = createMap();
      layer1 = map.createLayer('osm', {renderer: 'webgl', url: '/testdata/white.jpg', autoshareRenderer: 'more'});
      layer2 = map.createLayer('osm', {renderer: 'webgl', url: '/testdata/weather.png', keepLower: false, autoshareRenderer: false});
      layer3 = map.createLayer('feature', {renderer: 'webgl', autoshareRenderer: 'more'});
      layer3.createFeature('point', {}).data([{x: 2, y: 1}]);
      map.onIdle(function () {
        expect($('canvas', map.node()).length).toBe(3);
        done();
      });
    });
    it('zIndex', function () {
      expect($('canvas', layer1.node()).length).toBe(1);
      expect($('canvas', layer2.node()).length).toBe(1);
      expect($('canvas', layer3.node()).length).toBe(1);
      layer1.moveUp();
      expect($('canvas', map.node()).length).toBe(2);
      expect($('canvas', layer1.node()).length).toBe(1);
      expect($('canvas', layer2.node()).length).toBe(1);
      expect($('canvas', layer3.node()).length).toBe(0);
      layer1.moveUp();
      expect($('canvas', map.node()).length).toBe(2);
      expect($('canvas', layer1.node()).length).toBe(0);
      expect($('canvas', layer2.node()).length).toBe(1);
      expect($('canvas', layer3.node()).length).toBe(1);
      layer1.moveToBottom();
      expect($('canvas', map.node()).length).toBe(3);
      expect($('canvas', layer1.node()).length).toBe(1);
      expect($('canvas', layer2.node()).length).toBe(1);
      expect($('canvas', layer3.node()).length).toBe(1);
    });
    it('cleanup', function () {
      console.log.restore();
      destroyMap();
      restoreWebglRenderer();
    });
  });
  describe('manually share renderers', function () {
    var map, layer1, layer2, layer3;
    it('_init', function (done) {
      mockWebglRenderer();
      sinon.stub(console, 'log', function () {});
      map = createMap();
      layer1 = map.createLayer('osm', {renderer: 'webgl', url: '/testdata/white.jpg', autoshareRenderer: false});
      layer2 = map.createLayer('osm', {url: '/testdata/weather.png', keepLower: false, autoshareRenderer: false, renderer: layer1.renderer()});
      layer3 = map.createLayer('feature', {autoshareRenderer: false, renderer: layer1.renderer()});
      layer3.createFeature('point', {}).data([{x: 2, y: 1}]);
      map.onIdle(function () {
        expect($('canvas', map.node()).length).toBe(1);
        done();
      });
    });
    it('switchRenderers', function () {
      var r = geo.createRenderer('webgl', layer2);
      layer2.switchRenderer(r, true);
      expect($('canvas', map.node()).length).toBe(2);
      layer1.switchRenderer(r, true);
      expect($('canvas', map.node()).length).toBe(2);
      layer3.switchRenderer(r, true);
      expect($('canvas', map.node()).length).toBe(2);
      $('canvas', layer1.node()).remove();
      expect($('canvas', map.node()).length).toBe(1);
    });
    it('cleanup', function () {
      console.log.restore();
      destroyMap();
      restoreWebglRenderer();
    });
  });
});
