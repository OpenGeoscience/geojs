var geo = require('../test-utils').geo;
var $ = require('jquery');
var createMap = require('../test-utils').createMap;
var closeToEqual = require('../test-utils').closeToEqual;

describe('geo.gui.widget', function () {
  'use strict';

  describe('create', function () {
    it('direct create', function () {
      var map, layer, widget;
      map = createMap();
      layer = map.createLayer('ui');

      widget = geo.gui.widget();
      expect(widget instanceof geo.gui.widget).toBe(true);
      expect(widget.layer()).toBe(null);

      widget = geo.gui.widget({layer: layer});
      expect(widget instanceof geo.gui.widget).toBe(true);
      expect(widget.layer()).toBe(layer);
      expect(widget.parentCanvas()).toBe(layer.canvas());

      expect(function () {
        geo.gui.widget({layer: layer, parent: {}});
      }).toThrow(new Error('Parent must be of type geo.gui.widget'));

      widget = geo.gui.widget({parent: geo.gui.widget({layer: layer})});
      expect(widget instanceof geo.gui.widget).toBe(true);
      expect(widget.parentCanvas()).toBe(null);
    });
  });

  describe('Check private class methods', function () {
    var map, layer, widget;

    it('_init', function () {
      var modTime;

      map = createMap();
      layer = map.createLayer('ui');
      widget = geo.gui.widget({layer: layer});
      modTime = widget.getMTime();
      expect(widget._init()).toBe(widget);
      expect(widget.getMTime()).toBeGreaterThan(modTime);
    });
    it('_exit', function () {
      map = createMap();
      layer = map.createLayer('ui');
      widget = geo.gui.widget({layer: layer});
      widget._init();
      expect(widget._exit()).toBe(undefined);

      widget = geo.gui.widget({layer: layer});
      widget._init();
      var canvas = widget.canvas(document.createElement('div'));
      widget._appendCanvasToParent(canvas);
      expect(widget._exit()).toBe(undefined);
    });

    it('_createCanvas', function () {
      map = createMap();
      layer = map.createLayer('ui');
      widget = geo.gui.widget({layer: layer});
      widget._init();
      expect(function () {
        widget._createCanvas();
      }).toThrow(new Error('Must be defined in derived classes'));
    });
    it('_appendCanvasToParent', function () {
      map = createMap();
      layer = map.createLayer('ui');
      widget = geo.gui.widget({layer: layer});
      widget._init();
      var canvas = widget.canvas(document.createElement('div'));
      var children = $(widget.parentCanvas()).children();
      expect(widget._appendCanvasToParent(canvas)).toBe(undefined);
      expect($(widget.parentCanvas()).children().length).toBe(children.length + 1);
    });
  });

  describe('Check public class methods', function () {
    var map, layer, widget;

    it('layer', function () {
      map = createMap();
      layer = map.createLayer('ui');
      widget = geo.gui.widget({layer: layer});
      widget._init();
      expect(widget.layer()).toBe(layer);
    });
    it('canvas', function () {
      map = createMap();
      layer = map.createLayer('ui');
      widget = geo.gui.widget({layer: layer});
      expect(widget.canvas()).toBe(null);
      var div = document.createElement('div');
      expect(widget.canvas(div)).toBe(widget);
      expect(widget.canvas()).toBe(div);
    });
    it('parentCanvas', function () {
      map = createMap();
      layer = map.createLayer('ui');
      widget = geo.gui.widget({layer: layer});
      expect(widget.parentCanvas()).toBe(layer.canvas());
      var widget2 = geo.gui.widget({layer: layer, parent: widget});
      expect(widget2.parentCanvas()).toBe(null);
      var div = document.createElement('div');
      widget.canvas(div);
      expect(widget2.parentCanvas()).toBe(div);
    });
    it('position', function () {
      map = createMap();
      layer = map.createLayer('ui');
      widget = geo.gui.widget({layer: layer});
      expect(widget.position()).toEqual({left: 0, top: 0});
      expect(widget.position(undefined, true)).toEqual({left: 0, top: 0});
      expect(widget.position({right: '10px', bottom: '5px'})).toBe(widget);
      expect(widget.position()).toEqual({right: '10px', bottom: '5px'});
      expect(widget.position(undefined, true)).toEqual({right: '10px', bottom: '5px'});
      expect(widget.position({x: -3, y: 3})).toBe(widget);
      expect(closeToEqual(widget.position(), {left: 285.87, top: 145.85, right: null, bottom: null})).toBe(true);
      expect(widget.position(undefined, true)).toEqual({x: -3, y: 3});
      map.pan({x: -5, y: 20});
      expect(closeToEqual(widget.position(), {left: 280.87, top: 165.85, right: null, bottom: null})).toBe(true);
      expect(widget.position(undefined, true)).toEqual({x: -3, y: 3});
      /* test that position updates the canvas as we expect */
      var div = document.createElement('div');
      widget = geo.gui.widget({layer: layer});
      widget.canvas(div).reposition();
      expect(div.style.left).toBe('0px');
      expect(div.style.right).toBe('');
      widget.position({right: 10, bottom: 20});
      expect(div.style.left).toBe('');
      expect(div.style.right).toBe('10px');
      widget.position({right: '10%', bottom: 20});
      expect(div.style.left).toBe('');
      expect(div.style.right).toBe('10%');
    });
    it('reposition and repositionEvent', function () {
      map = createMap();
      layer = map.createLayer('ui');
      widget = geo.gui.widget({layer: layer});
      var div = document.createElement('div');
      widget.canvas(div);
      widget.position({right: '10px', bottom: '5px'});
      expect(widget.reposition()).toBe(widget);
      expect($(div).css('right')).toBe('10px');
      expect(widget.reposition({right: 20, bottom: 10})).toBe(widget);
      expect($(div).css('right')).toBe('20px');
      widget.position({x: -3, y: 3});
      expect(widget.reposition()).toBe(widget);
      expect($(div).css('left')).toBe('285.867px');
      // pan triggers repositionEvent
      map.pan({x: -5, y: 20});
      expect($(div).css('left')).toBe('280.867px');
    });
  });
});

describe('widget api', function () {
  'use strict';

  function makeMap() {
    var map;

    map = createMap({
      center: {
        x: -98.0,
        y: 39.5
      },
      zoom: 5
    }, {width: '500px', height: '400px'});

    var uiLayer = map.createLayer('ui');
    map.draw();
    return {map: map, uiLayer: uiLayer};
  }

  it('a widget should have the UI layer as its parent', function () {
    var widget = makeMap().uiLayer.createWidget('dom');

    expect(widget.parent()).toEqual(jasmine.any(geo.gui.uiLayer));
  });

  it('a widget stuck to albany shouldn\'t be in the viewport ' +
     'if we pan to moscow',
     function () {
       var o = makeMap(), widget = o.uiLayer.createWidget(
         'dom', {
           position: {
             x: -73.7572,
             y: 42.6525
           }
         }
       );

       o.map.center({x: 37.6167, y: 55.7500});
       expect(widget.isInViewport()).toBe(false);
     });

  it('a widget stuck to albany should be in the viewport if albany is', function () {
    var o = makeMap(),
        widget = o.uiLayer.createWidget('dom', {
          position: {
            x: -73.7572,
            y: 42.6525
          }
        });

    o.map.center({x: -73.7572, y: 42.6525});
    expect(widget.isInViewport()).toBe(true);

  });

  it('a widget stuck to the top left should always be in the viewport', function () {
    var o = makeMap(), widget = o.uiLayer.createWidget('dom');

    expect($(widget.canvas()).position()).toEqual({top: 0, left: 0});

    o.map.center({x: 37.6167, y: 55.7500});
    expect(widget.isInViewport()).toBe(true);
    expect($(widget.canvas()).position()).toEqual({top: 0, left: 0});
  });

  it('Widgets positions can be changed', function () {
    var o = makeMap(), widget = o.uiLayer.createWidget('dom', {
          position: {left: 15, top: 10}});

    expect($(widget.canvas()).position()).toEqual({top: 10, left: 15});
    widget.position({top: null, bottom: '20%', left: 10});
    expect(widget.position()).toEqual({top: null, bottom: '20%', left: 10});
    expect($(widget.canvas()).position()).toEqual({top: 320, left: 10});
  });

  it('nested widgets should be properly structured', function () {
    var o = makeMap();
    var domWidget = o.uiLayer.createWidget('dom');
    var svgWidget = o.uiLayer.createWidget('svg', {
      parent: domWidget
    });
    var widgetCount = $(o.uiLayer.canvas()).children().length;

    expect($(svgWidget.canvas()).parent()[0]).toBe($(domWidget.canvas())[0]);

    // Only top level widgets are children of the UI Layer
    // So removing the domWidget will also remove the svgWidget, but only
    // reduce the number of widgets the UILayer has as children by 1
    domWidget._exit();
    expect($(o.uiLayer.canvas()).children().length).toBe(widgetCount - 1);
  });
});
