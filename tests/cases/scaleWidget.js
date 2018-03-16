var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;
var d3 = require('d3');

describe('geo.gui.scaleWidget', function () {
  'use strict';

  describe('create', function () {
    it('direct create', function () {
      var map, layer, widget;
      map = createMap();
      layer = map.createLayer('ui');

      widget = geo.gui.scaleWidget({layer: layer});
      expect(widget instanceof geo.gui.scaleWidget).toBe(true);
      expect(widget.parent()).toBe(null);
    });
  });

  describe('Check private class methods', function () {
    var map, layer, widget;

    it('_init and _vertical', function () {
      map = createMap();
      layer = map.createLayer('ui');
      widget = geo.gui.scaleWidget({layer: layer});
      expect(widget._init()).toBe(widget);
      expect(widget._vertical()).toBe(false);
      widget = geo.gui.scaleWidget({layer: layer, orientation: 'left'});
      expect(widget._init()).toBe(widget);
      expect(widget._vertical()).toBe(true);
    });

    it('_exit', function () {
      map = createMap();
      layer = map.createLayer('ui');
      widget = geo.gui.scaleWidget({layer: layer});
      widget._init();
      expect(widget._exit()).toBe(undefined);
    });

    it('_scaleValue', function () {
      var result;

      map = createMap();
      layer = map.createLayer('ui');
      widget = layer.createWidget('scale');

      result = widget._scaleValue(50, 200);
      expect(result.value).toBe(50);
      expect(result.html).toBe('50 m');
      expect(result.pixels).toBe(200);
      result = widget._scaleValue(40, 200);
      expect(result.value).toBe(30);
      expect(result.html).toBe('30 m');
      expect(result.pixels).toBe(150);
      result = widget._scaleValue(1.6e-5, 200);
      expect(result.value).toBe(1.5e-5);
      expect(result.html).toBe('15 &mu;m');
      expect(widget._scaleValue(1, 200, 'miles').html).toBe('3 ft');
      expect(widget._scaleValue(0.2, 200, 'miles').html).toBe('6 in');
      expect(widget._scaleValue(0.01, 200, 'miles').html).toBe('0.3 in');
      expect(widget._scaleValue(0.005, 200, 'miles').html).toBe('0.15 in');
      expect(widget._scaleValue(4000, 200, [{unit: 'NM', scale: 1852}]).html).toBe('2 NM');
    });

    it('_render', function () {
      map = createMap();
      layer = map.createLayer('ui');
      widget = layer.createWidget('scale');
      expect(widget._render()).toBe(undefined);
      expect(d3.select(widget.canvas()).select('text').html()).toBe('1500 km');
      expect(d3.select(widget.canvas()).select('polyline').attr('points').indexOf('1,10 1,1 ')).toBe(0);
      widget.options('maxWidth', 100);
      expect(d3.select(widget.canvas()).select('text').html()).toBe('800 km');
      expect(d3.select(widget.canvas()).select('polyline').attr('points').indexOf('1,10 1,1 ')).toBe(0);
      widget.options('orientation', 'top');
      expect(d3.select(widget.canvas()).select('text').html()).toBe('800 km');
      expect(d3.select(widget.canvas()).select('polyline').attr('points').indexOf('1,10 1,19 ')).toBe(0);
      widget.options('orientation', 'left');
      expect(d3.select(widget.canvas()).select('text').html()).toBe('150 km');
      expect(d3.select(widget.canvas()).select('polyline').attr('points').indexOf('90,1 99,1 99,')).toBe(0);
      widget.options('orientation', 'right');
      expect(d3.select(widget.canvas()).select('text').html()).toBe('150 km');
      expect(d3.select(widget.canvas()).select('polyline').attr('points').indexOf('10,1 1,1 1,')).toBe(0);
      widget.options({orientation: 'bottom', tickLength: 8, strokeWidth: 4});
      expect(d3.select(widget.canvas()).select('polyline').attr('points').indexOf('2,8 2,2 ')).toBe(0);
      // This exercises parts of the default distance function.
      map.gcs('+proj=longlat +axis=enu').ingcs('+proj=longlat +axis=esu');
      widget.options({maxWidth: 200, scale: 0.00001});
      expect(d3.select(widget.canvas()).select('text').html()).toBe('15 m');
      map.gcs('EPSG:3857').ingcs('EPSG:4326');
      widget.options('scale', 1);
      // Test with bad distance
      sinon.stub(console, 'warn', function () {});
      widget.options('distance', function () { return NaN; });
      expect(console.warn.calledOnce).toBe(true);
      console.warn.restore();
      // and with custom distance
      widget.options('distance', function (pt1, pt2, gcs) {
        return geo.transform.vincentyDistance(pt1, pt2, gcs).distance;
      });
      expect(d3.select(widget.canvas()).select('text').html()).toBe('1500 km');
    });

    it('_update', function () {
      map = createMap();
      layer = map.createLayer('ui');
      widget = layer.createWidget('scale');
      sinon.stub(widget, '_render', function () {});
      map.pan({x: 5, y: 0});
      expect(widget._render.calledOnce).toBe(true);
    });
  });

  describe('Check public class methods', function () {
    var map, layer, widget;

    it('options', function () {
      map = createMap();
      layer = map.createLayer('ui');
      widget = layer.createWidget('scale');

      expect(widget.options().orientation).toBe('bottom');
      expect(widget.options('orientation')).toBe('bottom');
      expect(widget.options('position')).toEqual({left: 0, top: 0});
      expect(widget.options('position', {right: 10, top: 10})).toEqual(widget);
      expect(widget.options('position')).toEqual({right: 10, top: 10});
      expect(widget.options('orientation', 'top')).toBe(widget);
      expect(widget.options('orientation')).toBe('top');
      expect(widget.options({orientation: 'right', maxWidth: 300})).toBe(widget);
      expect(widget.options('orientation')).toBe('right');
    });
  });
});
