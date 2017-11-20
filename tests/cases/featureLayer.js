// Test geo.featureLayer

var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;

describe('geo.featureLayer', function () {
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
      layer = geo.featureLayer({map: map});
      expect(layer instanceof geo.featureLayer).toBe(true);
      expect(layer.initialized()).toBe(false);

      layer = map.createLayer('feature', {renderer: 'd3'});
      expect(layer instanceof geo.featureLayer).toBe(true);
      expect(layer.initialized()).toBe(true);
    });
  });
  describe('Check private class methods', function () {
    var map, layer;
    it('_init', function () {
      map = createMap();
      layer = geo.featureLayer({map: map});
      expect(layer.initialized()).toBe(false);
      layer._init();
      expect(layer.initialized()).toBe(true);
      layer._init();
      expect(layer.initialized()).toBe(true);
    });
    it('_exit', function () {
      layer = geo.featureLayer({map: map});
      layer._init();
      expect(layer.features().length).toBe(0);
      layer.addFeature(geo.feature({layer: layer}));
      expect(layer.features().length).toBe(1);
      layer._exit();
      expect(layer.features().length).toBe(0);
    });
    it('_update', function () {
      layer = map.createLayer('feature', {renderer: 'd3'});
      expect(layer._update()).toBe(layer);
      var feat = layer.createFeature('point');
      sinon.stub(feat, '_update', function () {});
      expect(layer._update()).toBe(layer);
      expect(feat._update.calledOnce).toBe(true);
    });
  });
  describe('Check public class methods', function () {
    var map, layer, feat1, feat2, feat3;
    it('createFeature', function () {
      map = createMap();
      layer = map.createLayer('feature', {renderer: 'd3'});

      feat1 = layer.createFeature('point');
      expect(feat1).not.toBe(null);
      expect(layer.features().length).toBe(1);
      feat2 = layer.createFeature('point');
      expect(feat2).not.toBe(null);
      expect(feat1).not.toBe(feat2);
      expect(layer.features().length).toBe(2);
      expect(layer.createFeature('none')).toBe(null);
      expect(layer.features().length).toBe(2);
    });
    it('addFeature', function () {
      layer.addFeature(feat1);
      expect(layer.features().length).toBe(2);
      expect(layer.features()).toEqual([feat2, feat1]);
      feat3 = geo.feature({layer: layer, renderer: layer.renderer()});
      layer.addFeature(feat3);
      expect(layer.features().length).toBe(3);
      expect(layer.features()).toEqual([feat2, feat1, feat3]);
    });
    it('removeFeature', function () {
      layer.removeFeature(feat3);
      expect(layer.features().length).toBe(2);
      layer.removeFeature(feat3);
      expect(layer.features().length).toBe(2);
      sinon.stub(feat2, '_exit', function () {});
      layer.removeFeature(feat2);
      expect(layer.features().length).toBe(1);
      expect(feat2._exit.calledOnce).toBe(false);
      feat2._exit.restore();
    });
    it('deleteFeature', function () {
      sinon.stub(feat1, '_exit', function () {});
      sinon.stub(feat2, '_exit', function () {});
      layer.deleteFeature(feat2);
      expect(layer.features().length).toBe(1);
      expect(feat2._exit.calledOnce).toBe(false);
      layer.deleteFeature(feat1);
      expect(layer.features().length).toBe(0);
      expect(feat1._exit.calledOnce).toBe(true);
    });
    it('features', function () {
      feat1 = layer.createFeature('point');
      expect(layer.features().length).toBe(1);
      expect(layer.features()).toEqual([feat1]);
      layer.features([feat2]);
      expect(layer.features().length).toBe(1);
      expect(layer.features()).toEqual([feat2]);
      layer.features([feat3, feat2]);
      expect(layer.features().length).toBe(2);
      expect(layer.features()).toEqual([feat3, feat2]);
      // feat1 was deleted when we changed features, so make a new one
      feat1 = geo.feature({layer: layer, renderer: layer.renderer()});
      layer.features([feat2, feat1]);
      expect(layer.features().length).toBe(2);
      expect(layer.features()).toEqual([feat2, feat1]);
    });
    it('visible', function () {
      expect(layer.visible()).toBe(true);
      expect(feat1.visible()).toBe(true);
      expect(feat1.visible(undefined, true)).toBe(true);
      expect(layer.visible(false)).toBe(layer);
      expect(layer.visible()).toBe(false);
      expect(feat1.visible()).toBe(false);
      expect(feat1.visible(undefined, true)).toBe(true);
      expect(layer.visible(true)).toBe(layer);
      expect(layer.visible()).toBe(true);
      expect(feat1.visible()).toBe(true);
      expect(feat1.visible(undefined, true)).toBe(true);
    });
    it('selectionAPI', function () {
      feat1.selectionAPI(true);
      expect(layer.selectionAPI()).toBe(true);
      expect(feat1.selectionAPI()).toBe(true);
      expect(feat1.selectionAPI(undefined, true)).toBe(true);
      expect(layer.selectionAPI(false)).toBe(layer);
      expect(layer.selectionAPI()).toBe(false);
      expect(feat1.selectionAPI()).toBe(false);
      expect(feat1.selectionAPI(undefined, true)).toBe(true);
      expect(layer.selectionAPI(true)).toBe(layer);
      expect(layer.selectionAPI()).toBe(true);
      expect(feat1.selectionAPI()).toBe(true);
      expect(feat1.selectionAPI(undefined, true)).toBe(true);
    });
    it('active', function () {
      expect(layer.active()).toBe(true);
      expect(layer.node().hasClass('active')).toBe(true);
      expect(layer.active(false)).toBe(layer);
      expect(layer.active()).toBe(false);
      expect(layer.node().hasClass('active')).toBe(false);
      expect(layer.active(true)).toBe(layer);
      expect(layer.active()).toBe(true);
      expect(layer.node().hasClass('active')).toBe(true);
    });
    it('draw', function () {
      sinon.stub(feat1, 'draw', function () {});
      expect(layer.draw()).toBe(layer);
      expect(feat1.draw.calledOnce).toBe(true);
    });
    it('clear', function () {
      var modTime = layer.getMTime();
      expect(layer.clear()).toBe(layer);
      expect(layer.features().length).toBe(0);
      expect(layer.getMTime()).toBeGreaterThan(modTime);
      modTime = layer.getMTime();
      expect(layer.clear()).toBe(layer);
      expect(layer.features().length).toBe(0);
      expect(layer.getMTime()).toBe(modTime);
    });
  });
});
