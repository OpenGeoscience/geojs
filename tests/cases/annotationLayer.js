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
      expect(map.interactor().hasAction(undefined, undefined, geo.annotation.actionOwner)).toBeNull();
      expect(layer.mode('rectangle')).toBe(layer);
      expect(layer.mode()).toBe('rectangle');
      expect(map.interactor().hasAction(undefined, undefined, geo.annotation.actionOwner)).not.toBeNull();
      expect(layer.mode(null)).toBe(layer);
      expect(layer.mode()).toBe(null);
      expect(map.interactor().hasAction(undefined, undefined, geo.annotation.actionOwner)).toBeNull();
      expect(layer.mode('line')).toBe(layer);
      expect(layer.mode()).toBe('line');
      expect(map.interactor().hasAction(undefined, undefined, geo.annotation.actionOwner)).not.toBeNull();
      expect(layer.mode(null)).toBe(layer);
      expect(layer.mode()).toBe(null);
      expect(map.interactor().hasAction(undefined, undefined, geo.annotation.actionOwner)).toBeNull();
    });
    it('annotations', function () {
      var poly = geo.annotation.polygonAnnotation({
            state: geo.annotation.state.create, layer: layer}),
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
        poly, rect;
    it('addAnnotation', function () {
      map = create_map();
      layer = map.createLayer('annotation', {
        features: ['polygon', 'line', 'point']
      });
      poly = geo.annotation.polygonAnnotation({
        state: geo.annotation.state.create, layer: layer});
      rect = geo.annotation.rectangleAnnotation({
        layer: layer,
        corners: [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: 1}]});
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
      expect(layer.annotations()[1]._coordinates()[1]).not.toEqual({x: 1, y: 0});
      layer.removeAnnotation(rect);
      rect = geo.annotation.rectangleAnnotation({
        layer: layer,
        corners: [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: 1}]});
      layer.addAnnotation(rect, map.gcs());
      expect(layer.annotations()[1]._coordinates()[1]).toEqual({x: 1, y: 0});
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
    it('displayDistance', function () {
      var c1 = {x: 100, y: 80},
          c2 = map.displayToGcs({x: 105, y: 84}),        /* ingcs */
          c3 = map.displayToGcs({x: 107, y: 88}, null);  /* gcs */
      expect(layer.displayDistance(c1, 'display', c2)).toBeCloseTo(6.40, 2);
      expect(layer.displayDistance(c1, 'display', c2, 'EPSG:4326')).toBeCloseTo(6.40, 2);
      expect(layer.displayDistance(c1, 'display', c3, null)).toBeCloseTo(10.63, 2);
      expect(layer.displayDistance(c1, 'display', c3, 'EPSG:3857')).toBeCloseTo(10.63, 2);
      expect(layer.displayDistance(c2, undefined, c1, 'display')).toBeCloseTo(6.40, 2);
      expect(layer.displayDistance(c2, undefined, c3, null)).toBeCloseTo(4.47, 2);
      expect(layer.displayDistance(c3, null, c1, 'display')).toBeCloseTo(10.63, 2);
      expect(layer.displayDistance(c3, null, c2)).toBeCloseTo(4.47, 2);
    });
    it('geojson', function () {
      layer.removeAllAnnotations();
      layer.addAnnotation(poly);
      layer.addAnnotation(rect);
      var geojson = layer.geojson();
      expect(geojson.type).toBe('FeatureCollection');
      expect(geojson.features.length).toBe(1);
      expect(geojson.features[0].crs).toBe(undefined);
      geojson = layer.geojson(undefined, undefined, 'EPSG:4326', true);
      expect(geojson.features[0].crs.properties.name).toBe('EPSG:4326');
      layer.removeAllAnnotations();
      expect(layer.geojson()).toBe(null);
      /* test setting via geojson */
      layer.addAnnotation(poly);
      layer.addAnnotation(rect);
      expect(layer.geojson('not geojson')).toBe(undefined);
      expect(layer.geojson('not geojson', true)).toBe(undefined);
      expect(layer.annotations().length).toBe(2);
      var sampleGeojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-118.872649, 36.696299]
        }
      };
      expect(layer.geojson(sampleGeojson)).toBe(3);
      expect(layer.geojson(JSON.stringify(sampleGeojson))).toBe(4);
      sampleGeojson.properties = {annotationId: layer.annotations()[3].id()};
      expect(layer.geojson(sampleGeojson)).toBe(5);
      expect(layer.geojson(sampleGeojson, 'update')).toBe(2);
      expect(layer.geojson(sampleGeojson, true)).toBe(2);
    });
    it('validateAttribute', function () {
      expect(layer.validateAttribute(undefined, 'other')).toBe(undefined);
      expect(layer.validateAttribute(null, 'other')).toBe(undefined);

      expect(layer.validateAttribute('value', 'other')).toBe('value');
      expect(layer.validateAttribute('value', 'boolean')).toBe(true);
      expect(layer.validateAttribute(true, 'boolean')).toBe(true);
      expect(layer.validateAttribute(0, 'boolean')).toBe(false);
      expect(layer.validateAttribute('false', 'boolean')).toBe(false);

      expect(layer.validateAttribute('not a color', 'color')).toBe(undefined);
      expect(layer.validateAttribute('yellow', 'color')).toEqual({r: 1, g: 1, b: 0});
      expect(layer.validateAttribute('#ffff00', 'color')).toEqual({r: 1, g: 1, b: 0});
      expect(layer.validateAttribute('#ff0', 'color')).toEqual({r: 1, g: 1, b: 0});
      expect(layer.validateAttribute({r: 1, g: 1, b: 0}, 'color')).toEqual({r: 1, g: 1, b: 0});

      expect(layer.validateAttribute(0.5, 'opacity')).toBe(0.5);
      expect(layer.validateAttribute('0.5', 'opacity')).toBe(0.5);
      expect(layer.validateAttribute(0, 'opacity')).toBe(0);
      expect(layer.validateAttribute(-1, 'opacity')).toBe(undefined);
      expect(layer.validateAttribute(1, 'opacity')).toBe(1);
      expect(layer.validateAttribute(1.2, 'opacity')).toBe(undefined);
      expect(layer.validateAttribute('value', 'opacity')).toBe(undefined);

      expect(layer.validateAttribute(0.5, 'positive')).toBe(0.5);
      expect(layer.validateAttribute('0.5', 'positive')).toBe(0.5);
      expect(layer.validateAttribute(0, 'positive')).toBe(undefined);
      expect(layer.validateAttribute(-1, 'positive')).toBe(undefined);
      expect(layer.validateAttribute(1.2, 'positive')).toBe(1.2);
      expect(layer.validateAttribute('value', 'positive')).toBe(undefined);
    });
  });
  describe('Private utility functions', function () {
    var map, layer, point, rect, rect2;
    it('_update', function () {
      /* Most of update is covered as a side effect of other code.  This tests
       * some edge conditions */
      map = create_map();
      layer = map.createLayer('annotation', {
        renderer: 'd3'
      });
      point = geo.annotation.pointAnnotation({
        layer: layer,
        position: {x: 2, y: 3}});
      rect = geo.annotation.rectangleAnnotation({
        layer: layer,
        corners: [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: 1}]});
      rect2 = geo.annotation.rectangleAnnotation({
        layer: layer,
        corners: [{x: 3, y: 0}, {x: 4, y: 0}, {x: 4, y: 1}, {x: 3, y: 1}]});
      layer.addAnnotation(point);
      layer.addAnnotation(rect);
      layer.addAnnotation(rect2);
      expect(layer.features.length).toBe(1);
    });
    it('_handleMouseClick', function () {
      layer.removeAllAnnotations();
      layer.mode('polygon');
      expect(layer.annotations().length).toBe(1);
      expect(layer.annotations()[0].options('vertices').length).toBe(0);
      var time = new Date().getTime();
      layer._handleMouseClick({
        buttonsDown: {left: true},
        time: time,
        map: {x: 10, y: 20},
        mapgcs: map.displayToGcs({x: 10, y: 20}, null)
      });
      expect(layer.annotations().length).toBe(1);
      expect(layer.annotations()[0].options('vertices').length).toBe(2);
      layer._handleMouseClick({
        buttonsDown: {left: true},
        time: time,
        map: {x: 30, y: 20},
        mapgcs: map.displayToGcs({x: 30, y: 20}, null)
      });
      expect(layer.annotations()[0].options('vertices').length).toBe(3);
      layer._handleMouseClick({
        buttonsDown: {left: true},
        time: time + 1000,
        map: {x: 30, y: 20},
        mapgcs: map.displayToGcs({x: 30, y: 20}, null)
      });
      expect(layer.annotations()[0].options('vertices').length).toBe(3);
      layer._handleMouseClick({
        buttonsDown: {left: true},
        time: time + 1000,
        map: {x: 20, y: 50},
        mapgcs: map.displayToGcs({x: 20, y: 50}, null)
      });
      expect(layer.annotations()[0].options('vertices').length).toBe(4);
      layer._handleMouseClick({
        buttonsDown: {left: true},
        time: time + 1000,
        map: {x: 20, y: 50},
        mapgcs: map.displayToGcs({x: 20, y: 50}, null)
      });
      expect(layer.annotations()[0].options('vertices').length).toBe(3);
      expect(layer.annotations()[0].state()).toBe(geo.annotation.state.done);
      layer.removeAllAnnotations();
      layer.mode('polygon');
      layer._handleMouseClick({
        buttonsDown: {left: true},
        time: time,
        map: {x: 10, y: 20},
        mapgcs: map.displayToGcs({x: 10, y: 20}, null)
      });
      layer._handleMouseClick({
        buttonsDown: {right: true},
        time: time,
        map: {x: 30, y: 20},
        mapgcs: map.displayToGcs({x: 30, y: 20}, null)
      });
      expect(layer.annotations().length).toBe(0);
    });
    it('_handleMouseMove', function () {
      layer.removeAllAnnotations();
      layer.mode('polygon');
      var time = new Date().getTime();
      layer._handleMouseClick({
        buttonsDown: {left: true},
        time: time,
        map: {x: 10, y: 20},
        mapgcs: map.displayToGcs({x: 10, y: 20}, null)
      });
      expect(layer.annotations()[0].options('vertices')[0]).toEqual(layer.annotations()[0].options('vertices')[1]);
      layer._handleMouseMove({
        buttonsDown: {},
        time: time,
        map: {x: 15, y: 22},
        mapgcs: map.displayToGcs({x: 15, y: 22}, null)
      });
      expect(layer.annotations()[0].options('vertices')[0]).not.toEqual(layer.annotations()[0].options('vertices')[1]);
    });
    it('_handleZoom', function () {
      layer.mode(null);
      layer.removeAllAnnotations();
      layer.addAnnotation(point);
      layer._update();
      var mod = layer.features()[0].getMTime();
      layer._handleZoom();
      expect(layer.features()[0].getMTime()).toBe(mod);
      layer.annotations()[0].options({style: {scaled: true}});
      layer._update();
      mod = layer.features()[0].getMTime();
      layer._handleZoom();
      expect(layer.features()[0].getMTime()).toBeGreaterThan(mod);
    });
    it('_processAction', function () {
      layer.removeAllAnnotations();
      layer._processAction({
        state: {action: geo.geo_action.annotation_rectangle},
        lowerLeft: {x: 10, y: 10},
        lowerRight: {x: 20, y: 10},
        upperLeft: {x: 10, y: 5},
        upperRight: {x: 20, y: 5}
      });
      expect(layer.annotations().length).toBe(0);
      layer.mode('rectangle');
      expect(layer.annotations()[0].state()).toBe(geo.annotation.state.create);
      layer._processAction({
        state: {
          action: geo.geo_action.annotation_rectangle,
          actionRecord: {owner: geo.annotation.actionOwner}
        },
        lowerLeft: {x: 10, y: 10},
        lowerRight: {x: 20, y: 10},
        upperLeft: {x: 10, y: 5},
        upperRight: {x: 20, y: 5}
      });
      expect(layer.annotations().length).toBe(1);
      expect(layer.annotations()[0].type()).toBe('rectangle');
      expect(layer.annotations()[0].state()).toBe(geo.annotation.state.done);
    });
    it('_geojsonFeatureToAnnotation', function () {
      map.deleteLayer(layer);
      layer = map.createLayer('annotation');  /* use the vgl variant */
      /* This is tested through the layer.geojson function */
      var unknownFeature = {
        type: 'Feature',
        properties: {annotationType: 'unknown'},
        geometry: {
          type: 'LineString',
          coordinates: [[-73.75, 42.84], [-73.79, 42.84]]
        }
      };
      expect(layer.geojson(unknownFeature)).toBe(0);
      var lineString = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [[-73.75, 42.84]]
        }
      };
      expect(layer.geojson(lineString)).toBe(0);
      lineString = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [[-73.75, 42.84], [-73.79, 42.84]]
        }
      };
      expect(layer.geojson(lineString)).toBe(1);
      lineString.properties.annotationType = 'polygon';
      expect(layer.geojson(lineString)).toBe(2);
      var sample = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-118.872649, 36.696298]
          },
          properties: {
            radius: 6.7
          }
        }, {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-118.915853, 36.606894],
              [-118.531332, 36.587048],
              [-118.280020, 36.600279],
              [-118.355551, 36.436937],
              [-118.565664, 36.302031],
              [-118.764791, 36.488847],
              [-118.915853, 36.606894]
            ]]
          },
          properties: {
            name: 'Sequoia',
            fill: true,
            fillColor: '#00ff00',
            fillOpacity: 0.25,
            stroke: true,
            strokeColor: 'black',
            strokeOpacity: 1,
            strokeWidth: 4
          }
        }, {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-118.897685, 36.773031],
              [-118.897685, 36.915198],
              [-118.692647, 36.915198],
              [-118.692647, 36.773031],
              [-118.897685, 36.773031]
            ]]
          },
          properties: {
            annotationType: 'rectangle'
          }
        }]
      };
      expect(layer.geojson(sample)).toBe(5);
      var badpoly = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-118.915853, 36.606894],
            [-118.531332, 36.587048],
            [-118.915853, 36.606894]
          ]]
        }
      };
      expect(layer.geojson(badpoly, true)).toBe(0);
      badpoly.geometry.coordinates.splice(2, 1);
      expect(layer.geojson(badpoly, true)).toBe(0);
      var badattr = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-118.872649, 36.696298]
        },
        properties: {
          radius: -5,
          fillColor: 'no such color',
          fillOpacity: -1,
          scaled: 'not a number'
        }
      };
      layer.geojson(badattr, true);
      var attr = layer.geojson().features[0].properties;
      expect(attr.radius).toBeGreaterThan(0);
      expect(attr.fillOpacity).toBeGreaterThan(0);
      expect(attr.fillColor).toBe('#00ff00');
      expect(attr.scaled).toBe(false);
      var goodattr = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-118.872649, 36.696298]
        },
        properties: {
          radius: 3,
          fillColor: 'indigo',
          fillOpacity: 0.3,
          scaled: 'On'
        }
      };
      layer.geojson(goodattr, true);
      attr = layer.geojson().features[0].properties;
      expect(attr.radius).toBe(3);
      expect(attr.fillOpacity).toBe(0.3);
      expect(attr.fillColor).toBe('#4b0082');
      expect(attr.scaled).toBe(4);

      badattr = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [[-118, 36], [-119, 36]]
        },
        properties: {
          strokeOffset: 'not a number',
          lineCap: 'any text is allowed'
        }
      };
      layer.geojson(badattr, true);
      attr = layer.geojson().features[0].properties;
      expect(attr.strokeOffset).toBe(undefined);
      expect(attr.lineCap).toBe('any text is allowed');
      goodattr = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [[-118, 36], [-119, 36]]
        },
        properties: {
          strokeOffset: '0.5',
          lineCap: 'round'
        }
      };
      layer.geojson(goodattr, true);
      attr = layer.geojson().features[0].properties;
      expect(attr.strokeOffset).toBe(0.5);
      expect(attr.lineCap).toBe('round');
    });
  });
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
