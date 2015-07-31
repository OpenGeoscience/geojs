/*global describe, it, expect, geo, jasmine*/

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
  window.geoWidgets = [];

  it('a widget should have the UI layer as its parent', function (done) {
    var widget = uiLayer.createWidget('dom');

    // @todo this is kind of ugly
    setTimeout(function () {
      done();
    }, 1000);

    expect(widget.parent()).toEqual(jasmine.any(geo.gui.uiLayer));
  });

  it('a widget stuck to albany shouldn\'t be in the viewport ' +
     'if we pan to moscow', function (done) {
       var widget = uiLayer.createWidget('dom', {
         sticky: true,
         positionType: 'gcs',
         position: {
           x: -73.7572,
           y: 42.6525
         }
       });

       map.transition({
         center: {x: 37.6167, y: 55.7500}
       });

       map.geoOff(geo.event.transitionend)
         .geoOn(geo.event.transitionend, function () {
           expect(widget.isInViewport()).toBe(false);
           done();
         });
     });

  it('a widget stuck to albany should be in the viewport if albany is', function (done) {
    var widget = uiLayer.createWidget('dom', {
      sticky: true,
      positionType: 'gcs',
      position: {
        x: -73.7572,
        y: 42.6525
      }
    });

    map.transition({
      center: {x: -73.7572, y: 42.6525}
    });

    map.geoOff(geo.event.transitionend)
      .geoOn(geo.event.transitionend, function () {
        expect(widget.isInViewport()).toBe(true);
        done();
      });
  });

  it('a widget stuck to the top left should always be in the viewport', function (done) {
    var widget = uiLayer.createWidget('dom', {
      sticky: true
    });

    expect($(widget.canvas()).position()).toEqual({top: 0, left: 0});

    map.transition({
      center: {x: 37.6167, y: 55.7500}
    });

    map.geoOff(geo.event.transitionend)
      .geoOn(geo.event.transitionend, function () {
        expect(widget.isInViewport()).toBe(true);
        expect($(widget.canvas()).position()).toEqual({top: 0, left: 0});
        done();
      });
  });

  it('nested widgets should be properly structured', function () {
    var domWidget = uiLayer.createWidget('dom');
    var svgWidget = uiLayer.createWidget('svg', {
      parent: domWidget
    });
    var widgetCount = $(uiLayer.canvas()).children().length;

    expect($(svgWidget.canvas()).parent()[0]).toBe($(domWidget.canvas())[0]);

    // Only top level widgets are children of the UI Layer
    // So removing the domWidget will also remove the svgWidget, but only
    // reduce the number of widgets the UILayer has as children by 1
    domWidget._exit();
    expect($(uiLayer.canvas()).children().length).toBe(widgetCount - 1);
  });
});
