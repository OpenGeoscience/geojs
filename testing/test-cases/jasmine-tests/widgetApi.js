/*global describe, it, expect, geo, xit, jasmine*/

describe('widget api', function () {
  'use strict';

  var map, width = 800, height = 800;

  map = geo.map({
    node: '#map',
    center: {
      x: -98.0,
      y: 39.5
    },
    zoom: 1
  });

  map.createLayer('osm');
  map.resize(0, 0, width, height);
  map.createLayer('ui');
  map.draw();

  var uiLayer = map.createLayer('ui');
  var widgets = [];

  describe('a widget stuck to albany', function () {
    widgets.push(uiLayer.createWidget('dom', {
      sticky: true,
      positionType: 'gcs',
      position: {
        x: -73.7572,
        y: 42.6525
      }
    }));

    var widget = widgets[0];

    it('should be the only child of the ui layer', function () {
      expect($(uiLayer.canvas()).children().length).toBe(1);
      expect($(uiLayer.canvas()).children()[0].tagName).toBe('DIV');
    });

    it('should have the UI layer as it\'s parent', function () {
      expect(widget.parent).toEqual(jasmine.any(geo.gui.uiLayer));
    });

    it('should be out of the viewport if we pan to moscow', function () {
      map.transition({
        center: {x: 37.6167, y: 55.7500}
      });

      expect(widget.isInViewport()).toBe(false);
    });

    it('should be back in the viewport if we pan to albany', function () {
      map.transition({
        center: {x: 37.6167, y: 55.7500}
      });

      expect(widget.isInViewport()).toBe(true);
    });
  });

  describe('a sticky widget on the top left', function () {
    widgets.push(uiLayer.createWidget('dom', {
      sticky: true
    }));

    var widget = widgets[1];

    it('should always be in the viewport', function () {
      expect($(widget.canvas()).position()).toBe({top: 0, left: 0});
      expect(widget.isInViewport()).toBe(true);

      map.transition({
        center: {x: 37.6167, y: 55.7500}
      });

      expect(widget.isInViewport()).toBe(true);
      expect($(widget.canvas()).position()).toBe({top: 0, left: 0});
    });
  });

  describe('removing the widgets', function () {
    widgets.map(function (widget) {
      widget._exit();
    });

    it('should leave the ui layer empty', function () {
      expect($(uiLayer.canvas()).children().length).toBe(0);
    });
  });


  describe('an svg widget within a dom widget', function () {
    var domWidget = uiLayer.createWidget('dom');
    var svgWidget = uiLayer.createWidget('svg', {
      parent: domWidget
    });

    it('should be properly structured', function () {
      expect($(uiLayer.canvas()).children().length).toBe(1);
      expect($(svgWidget.canvas()).parent()[0]).toBe($(domWidget.canvas())[0]);
    });

    it('should be removed when its parent is', function () {
      domWidget._exit();
      expect($(uiLayer.canvas()).children().length).toBe(0);
    });
  });
});
