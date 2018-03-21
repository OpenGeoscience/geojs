var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;

describe('geo.gui.svgWidget', function () {
  'use strict';

  describe('create', function () {
    it('direct create', function () {
      var map, layer, widget, widget2;
      map = createMap();
      layer = map.createLayer('ui');

      widget = geo.gui.svgWidget({layer: layer});
      expect(widget instanceof geo.gui.svgWidget).toBe(true);
      expect(widget.parent()).toBe(null);
      widget2 = geo.gui.svgWidget({layer: layer, parent: widget});
      expect(widget2 instanceof geo.gui.svgWidget).toBe(true);
      expect(widget2.parent()).toBe(widget);
    });
  });

  describe('Check private class methods', function () {
    var map, layer, widget, widget2;

    it('_init and _createCanvas', function () {
      map = createMap();
      layer = map.createLayer('ui');
      widget = geo.gui.svgWidget({layer: layer});
      expect(widget._init()).toBe(widget);
      widget2 = geo.gui.svgWidget({layer: layer, parent: widget});
      expect(widget2._init()).toBe(widget2);
    });

    it('_exit', function () {
      var count;
      map = createMap();
      layer = map.createLayer('ui');
      count = layer.node().children().length;
      widget = geo.gui.svgWidget({layer: layer});
      widget._init();
      expect(layer.node().children().length).toBe(count + 1);
      expect(widget._exit()).toBe(undefined);
      expect(layer.node().children().length).toBe(count);
    });
  });
});
