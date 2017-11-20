var $ = require('jquery');
var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;

describe('geo.gui.domWidget', function () {
  'use strict';

  describe('create', function () {
    it('direct create', function () {
      var map, layer, widget, widget2;
      map = createMap();
      layer = map.createLayer('ui');

      widget = geo.gui.domWidget({layer: layer});
      expect(widget instanceof geo.gui.domWidget).toBe(true);
      expect(widget.parent()).toBe(null);
      widget2 = geo.gui.domWidget({layer: layer, parent: widget});
      expect(widget2 instanceof geo.gui.domWidget).toBe(true);
      expect(widget2.parent()).toBe(widget);
    });
  });

  describe('Check private class methods', function () {
    var map, layer, widget, widget2;

    it('_init and _createCanvas', function () {
      map = createMap();
      layer = map.createLayer('ui');
      widget = geo.gui.domWidget({layer: layer});
      expect(widget._init()).toBe(widget);
      expect($(widget.canvas()).is('div')).toBe(true);
      widget2 = geo.gui.domWidget({layer: layer, parent: widget, el: 'span'});
      expect(widget2._init()).toBe(widget2);
      expect($(widget2.canvas()).is('div')).toBe(false);
      expect($(widget2.canvas()).is('span')).toBe(true);
    });
  });
});
