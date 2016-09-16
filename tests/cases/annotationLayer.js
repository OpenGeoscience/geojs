/* Test geo.annotationLayer */

describe('geo.annotationLayer', function () {
  'use strict';

  var $ = require('jquery');
  var geo = require('../test-utils').geo;
  var mockVGLRenderer = require('../test-utils').mockVGLRenderer;
  var restoreVGLRenderer = require('../test-utils').restoreVGLRenderer;

  beforeEach(function () {
    mockVGLRenderer();
  });

  afterEach(function () {
    restoreVGLRenderer();
  });

  function create_map(opts) {
    var node = $('<div id="map"/>').css({width: '640px', height: '360px'});
    $('#map').remove();
    $('body').append(node);
    opts = $.extend({}, opts);
    opts.node = node;
    return geo.map(opts);
  }

  it('Test initialization.', function () {
    var map = create_map();
    var layer = map.createLayer('annotation', {
      features: ['polygon', 'line', 'point']
    });
    expect(layer instanceof geo.annotationLayer).toBe(true);
  });
  it('Test initialization without interactor.', function () {
    var map = create_map({interactor: null});
    var layer = map.createLayer('annotation', {
      features: ['polygon', 'line', 'point']
    });
    expect(layer instanceof geo.annotationLayer).toBe(true);
    expect(map.interactor()).not.toBeNull();
  });
  describe('Check class accessors', function () {
    var map, layer, modeEvent = 0, lastModeEvent;
    it('options', function () {
      map = create_map();
      layer = map.createLayer('annotation', {
        features: ['polygon', 'line', 'point']
      });
      expect(layer.options().dblClickTime).toBe(300);
      expect(layer.options('dblClickTime')).toBe(300);
      expect(layer.options('dblClickTime', 400)).toBe(layer);
      expect(layer.options().dblClickTime).toBe(400);
      expect(layer.options({dblClickTime: 300})).toBe(layer);
      expect(layer.options().dblClickTime).toBe(300);
    });
    it('mode', function () {
      map.geoOn(geo.event.annotation.mode, function (evt) {
        modeEvent += 1;
        lastModeEvent = evt;
      });
      expect(layer.mode()).toBe(null);
      expect(layer.mode('point')).toBe(layer);
      expect(modeEvent).toBe(1);
      expect(lastModeEvent.mode).toBe('point');
      expect(lastModeEvent.oldMode).toBe(null);
      expect(layer.mode()).toBe('point');
      expect(layer.annotations().length).toBe(1);
      var id = layer.annotations()[0].id();
      layer.mode('point');
      expect(modeEvent).toBe(1);
      expect(layer.annotations()[0].id()).toBe(id);
      expect(layer.mode('polygon')).toBe(layer);
      expect(modeEvent).toBe(2);
      expect(layer.mode()).toBe('polygon');
      expect(layer.annotations().length).toBe(1);
      expect(layer.annotations()[0].id()).not.toBe(id);
      expect(map.interactor().hasAction(undefined, undefined, 'annotationLayer')).toBeNull();
      expect(layer.mode('rectangle')).toBe(layer);
      expect(layer.mode()).toBe('rectangle');
      expect(map.interactor().hasAction(undefined, undefined, 'annotationLayer')).not.toBeNull();
      expect(layer.mode(null)).toBe(layer);
      expect(layer.mode()).toBe(null);
      expect(map.interactor().hasAction(undefined, undefined, 'annotationLayer')).toBeNull();
    });
    it('annotations', function () {
      var poly = geo.annotation.polygonAnnotation({
            state: 'create', layer: layer}),
          rect = geo.annotation.rectangleAnnotation({
            layer: layer,
            corners: [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: 1}]});
      expect(layer.annotations().length).toBe(0);
      layer.addAnnotation(poly);
      expect(layer.annotations().length).toBe(1);
      expect(layer.annotations()[0]).toBe(poly);
      layer.addAnnotation(rect);
      expect(layer.annotations().length).toBe(2);
      expect(layer.annotations()[1]).toBe(rect);
      // this should give us a copy, so we don't alter the internal array
      layer.annotations().splice(0, 1);
      expect(layer.annotations().length).toBe(2);
      layer.removeAllAnnotations();
      expect(layer.annotations().length).toBe(0);
    });
  });
  describe('Public utility functions', function () {
    var map, layer,
        addAnnotationEvent = 0, lastAddAnnotationEvent,
        addAnnotationBeforeEvent = 0,
        removeAnnotationEvent = 0, lastRemoveAnnotationEvent,
        poly = geo.annotation.polygonAnnotation({
          state: 'create', layer: layer}),
        rect = geo.annotation.rectangleAnnotation({
          layer: layer,
          corners: [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: 1}]});
    it('addAnnotation', function () {
      map = create_map();
      layer = map.createLayer('annotation', {
        features: ['polygon', 'line', 'point']
      });
      map.geoOn(geo.event.annotation.add_before, function () {
        addAnnotationBeforeEvent += 1;
      });
      map.geoOn(geo.event.annotation.add, function (evt) {
        addAnnotationEvent += 1;
        lastAddAnnotationEvent = evt;
      });
      expect(layer.annotations().length).toBe(0);
      layer.addAnnotation(poly);
      expect(layer.annotations().length).toBe(1);
      expect(addAnnotationBeforeEvent).toBe(1);
      expect(addAnnotationEvent).toBe(1);
      expect(lastAddAnnotationEvent.annotation).toBe(poly);
      layer.addAnnotation(poly);
      expect(layer.annotations().length).toBe(1);
      expect(addAnnotationBeforeEvent).toBe(1);
      expect(addAnnotationEvent).toBe(1);
      layer.addAnnotation(rect);
      expect(layer.annotations().length).toBe(2);
      expect(addAnnotationBeforeEvent).toBe(2);
      expect(addAnnotationEvent).toBe(2);
      expect(lastAddAnnotationEvent.annotation).toBe(rect);
    });
    it('annotationById', function () {
      expect(layer.annotationById()).toBe(undefined);
      expect(layer.annotationById('not an id')).toBe(undefined);
      expect(layer.annotationById(poly.id())).toBe(poly);
      expect(layer.annotationById(rect.id())).toBe(rect);
      expect(layer.annotationById('' + poly.id())).toBe(poly);
    });
    it('removeAnnotation', function () {
      map.geoOn(geo.event.annotation.remove, function (evt) {
        removeAnnotationEvent += 1;
        lastRemoveAnnotationEvent = evt;
      });
      expect(layer.removeAnnotation('not present')).toBe(false);
      expect(removeAnnotationEvent).toBe(0);
      expect(layer.removeAnnotation(poly)).toBe(true);
      expect(removeAnnotationEvent).toBe(1);
      expect(lastRemoveAnnotationEvent.annotation).toBe(poly);
      expect(layer.removeAnnotation(poly)).toBe(false);
      expect(removeAnnotationEvent).toBe(1);
      expect(layer.removeAnnotation(rect, false)).toBe(true);
      expect(removeAnnotationEvent).toBe(2);
    });
    it('removeAllAnnotation', function () {
      removeAnnotationEvent = 0;
      layer.addAnnotation(poly);
      layer.addAnnotation(rect);
      expect(layer.removeAllAnnotations()).toBe(2);
      expect(removeAnnotationEvent).toBe(2);
      expect(layer.annotations().length).toBe(0);
      layer.addAnnotation(poly);
      layer.addAnnotation(rect);
      expect(layer.removeAllAnnotations(true)).toBe(1);
      expect(removeAnnotationEvent).toBe(3);
      expect(layer.annotations().length).toBe(1);
    });
    // displayDistance
  });
  // private utility functions
  //  _update
  // interactions
  //  _processSelection
  //  _handleMouseMove
  //  _handleMouseClick
  it('Test destroy layer.', function () {
    var map = create_map();
    var layer = map.createLayer('annotation', {
      features: ['polygon', 'line', 'point']
    });
    expect(layer instanceof geo.annotationLayer).toBe(true);
    layer.mode('polygon');
    expect(layer.annotations().length).toBe(1);
    map.deleteLayer(layer);
    expect(layer.annotations().length).toBe(0);
  });
});
