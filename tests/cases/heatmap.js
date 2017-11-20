// Test geo.core.heatmap
describe('canvas heatmap', function () {
  var createMap = require('../test-utils').createMap;

  describe('canvas heatmap feature', function () {
    'use strict';

    var mockAnimationFrame = require('../test-utils').mockAnimationFrame;
    var stepAnimationFrame = require('../test-utils').stepAnimationFrame;
    var unmockAnimationFrame = require('../test-utils').unmockAnimationFrame;

    var map, layer, feature1,
        testData = [[0.6, 42.8584, -70.9301],
                    [0.233, 42.2776, -83.7409],
                    [0.2, 42.2776, -83.7409]];
    var clock;
    beforeEach(function () {
      clock = sinon.useFakeTimers();
    });
    afterEach(function () {
      clock.restore();
    });

    it('Setup map', function () {
      mockAnimationFrame();
      map = createMap({center: [0, 0], zoom: 3}, {width: '800px', height: '600px'});
      layer = map.createLayer('feature', {'renderer': 'canvas'});
    });

    it('Add feature to a layer', function () {
      feature1 = layer.createFeature('heatmap')
        .data(testData)
        .intensity(function (d) {
          return d[0];
        })
        .position(function (d) {
          return {
            x: d[2],
            y: d[1]
          };
        })
        .style('radius', 5)
        .style('blurRadius', 15);

      map.draw();
      stepAnimationFrame(new Date().getTime());
      expect(layer.children().length).toBe(1);
      // leave animation frames mocked for later tests.
    });

    it('Validate selection API option', function () {
      expect(feature1.selectionAPI()).toBe(false);
    });

    it('Validate position', function () {
      expect(feature1.position()([0.6, 42.8584, -70.9301]))
        .toEqual({x:-70.9301, y:42.8584});
    });

    it('Validate maximum intensity', function () {
      expect(feature1.maxIntensity()).toBe(0.6);
    });

    it('Validate minimum intensity', function () {
      expect(feature1.minIntensity()).toBe(0.2);
    });

    it('Compute gradient', function () {
      feature1.style('color', {
        0:    {r: 0, g: 0, b: 0.0, a: 0.0},
        0.25: {r: 0, g: 0, b: 1, a: 0.5},
        0.5:  {r: 0, g: 1, b: 1, a: 0.6},
        0.75: {r: 1, g: 1, b: 0, a: 0.7},
        1:    {r: 1, g: 0, b: 0, a: 0.1}});
      feature1._computeGradient();
      expect(layer.node()[0].children[0].getContext('2d')
        .getImageData(1, 0, 1, 1).data.length).toBe(4);
    });
    it('_animatePan', function () {
      map.draw();
      var buildTime = feature1.buildTime().getMTime();
      map.pan({x: 10, y: 0});
      expect(feature1.buildTime().getMTime()).toBe(buildTime);
      clock.tick(800);
      map.pan({x: 10, y: 0});
      expect(feature1.buildTime().getMTime()).toBe(buildTime);
      clock.tick(800);
      expect(feature1.buildTime().getMTime()).toBe(buildTime);
      clock.tick(800);
      expect(feature1.buildTime().getMTime()).not.toBe(buildTime);
      buildTime = feature1.buildTime().getMTime();
      map.pan({x: 0, y: 0});
      expect(feature1.buildTime().getMTime()).toBe(buildTime);
      clock.tick(2000);
      expect(feature1.buildTime().getMTime()).toBe(buildTime);
    });
    it('radius, blurRadius, and gaussian', function () {
      // animation frames are already mocked
      expect(feature1._circle.radius).toBe(5);
      expect(feature1._circle.blurRadius).toBe(15);
      expect(feature1._circle.gaussian).toBe(true);
      expect(feature1._circle.width).toBe(40);
      expect(feature1._circle.height).toBe(40);
      feature1.style('gaussian', false);
      map.draw();
      stepAnimationFrame(new Date().getTime());
      expect(feature1._circle.gaussian).toBe(false);
      feature1.style('radius', 10);
      expect(feature1._circle.radius).toBe(5);
      map.draw();
      stepAnimationFrame(new Date().getTime());
      expect(feature1._circle.radius).toBe(10);
      expect(feature1._circle.width).toBe(50);
      expect(feature1._circle.height).toBe(50);
      feature1.style('blurRadius', 0);
      map.draw();
      stepAnimationFrame(new Date().getTime());
      expect(feature1._circle.blurRadius).toBe(0);
      expect(feature1._circle.width).toBe(20);
      expect(feature1._circle.height).toBe(20);
    });
    it('binned', function () {
      // animation frames are already mocked
      // ensure there is some data that will be off the map when we zoom in
      var viewport = map.camera()._viewport;
      var r = 80,
          data = [[1, 80, 0], [1, 0, 180]],
          numpoints = ((viewport.width + r * 2) / (r / 8) *
                       (viewport.height + r * 2) / (r / 8)),
          idx;
      feature1.style({radius: r, blurRadius: 0});
      map.draw();
      stepAnimationFrame(new Date().getTime());
      expect(feature1._binned).toBe(false);
      feature1.binned(true);
      map.draw();
      stepAnimationFrame(new Date().getTime());
      expect(feature1._binned).toBe(r / 8);
      feature1.binned(2);
      map.draw();
      stepAnimationFrame(new Date().getTime());
      expect(feature1._binned).toBe(2);
      feature1.binned(20);
      map.draw();
      stepAnimationFrame(new Date().getTime());
      expect(feature1._binned).toBe(20);
      for (idx = data.length; idx < numpoints + 1; idx += 1) {
        data.push([Math.random(), (Math.random() - 0.5) * 190, (
                   Math.random() - 0.5) * 360]);
      }
      feature1.data(data);
      feature1.binned('auto');
      map.draw();
      stepAnimationFrame(new Date().getTime());
      expect(feature1._binned).toBe(r / 8);
      data.splice(numpoints);
      feature1.data(data);
      map.draw();
      stepAnimationFrame(new Date().getTime());
      expect(feature1._binned).toBe(false);
      feature1.binned(true);
      map.zoom(10);
      stepAnimationFrame(new Date().getTime());
      expect(feature1._binned).toBe(r / 8);
    });
    it('Remove a feature from a layer', function () {
      layer.deleteFeature(feature1).draw();
      expect(layer.children().length).toBe(0);
      // stop mocking animation frames
      unmockAnimationFrame();
    });
  });

  describe('core.heatmapFeature', function () {
    var map, layer;
    var heatmapFeature = require('../../src/heatmapFeature');
    var data = [];

    it('Setup map', function () {
      map = createMap({center: [0, 0], zoom: 3});
      layer = map.createLayer('feature', {'renderer': 'canvas'});
      for (var i = 0; i < 100; i += 1) {
        data.push({a: i % 10, b: i % 9, c: i % 8});
      }
    });

    describe('class accessors', function () {
      it('maxIntensity', function () {
        var heatmap = heatmapFeature({layer: layer});
        expect(heatmap.maxIntensity()).toBe(null);
        expect(heatmap.maxIntensity(7)).toBe(heatmap);
        expect(heatmap.maxIntensity()).toBe(7);
        heatmap = heatmapFeature({layer: layer, maxIntensity: 8});
        expect(heatmap.maxIntensity()).toBe(8);
      });
      it('minIntensity', function () {
        var heatmap = heatmapFeature({layer: layer});
        expect(heatmap.minIntensity()).toBe(null);
        expect(heatmap.minIntensity(2)).toBe(heatmap);
        expect(heatmap.minIntensity()).toBe(2);
        heatmap = heatmapFeature({layer: layer, minIntensity: 3});
        expect(heatmap.minIntensity()).toBe(3);
      });
      it('updateDelay', function () {
        var heatmap = heatmapFeature({layer: layer});
        expect(heatmap.updateDelay()).toBe(1000);
        expect(heatmap.updateDelay(40)).toBe(heatmap);
        expect(heatmap.updateDelay()).toBe(40);
        heatmap = heatmapFeature({layer: layer, updateDelay: 50});
        expect(heatmap.updateDelay()).toBe(50);
      });
      it('binned', function () {
        var heatmap = heatmapFeature({layer: layer});
        expect(heatmap.binned()).toBe('auto');
        expect(heatmap.binned(true)).toBe(heatmap);
        expect(heatmap.binned()).toBe(true);
        heatmap = heatmapFeature({layer: layer, binned: 5});
        expect(heatmap.binned()).toBe(5);
        heatmap.binned('true');
        expect(heatmap.binned()).toBe(true);
        heatmap.binned('false');
        expect(heatmap.binned()).toBe(false);
        heatmap.binned('auto');
        expect(heatmap.binned()).toBe('auto');
        heatmap.binned(5.3);
        expect(heatmap.binned()).toBe(5);
        heatmap.binned(-3);
        expect(heatmap.binned()).toBe(false);
        heatmap.binned('not a number');
        expect(heatmap.binned()).toBe(false);
      });
      it('position', function () {
        var heatmap = heatmapFeature({layer: layer});
        expect(heatmap.position()('abc')).toBe('abc');
        expect(heatmap.position(function (d) {
          return {x: d.a, y: d.b};
        })).toBe(heatmap);
        expect(heatmap.position()(data[0])).toEqual({x: 0, y: 0});
        expect(heatmap.position()(data[84])).toEqual({x: 4, y: 3});
        heatmap = heatmapFeature({
          layer: layer,
          position: function (d) {
            return {x: d.b, y: d.c};
          }});
        expect(heatmap.position()(data[0])).toEqual({x: 0, y: 0});
        expect(heatmap.position()(data[87])).toEqual({x: 6, y: 7});
      });
      it('intensity', function () {
        var heatmap = heatmapFeature({layer: layer});
        expect(heatmap.intensity()('abc')).toBe(1);
        expect(heatmap.intensity(function (d) {
          return d.c;
        })).toBe(heatmap);
        expect(heatmap.intensity()(data[0])).toEqual(0);
        expect(heatmap.intensity()(data[67])).toEqual(3);
        heatmap = heatmapFeature({
          layer: layer,
          intensity: function (d) {
            return d.a;
          }});
        expect(heatmap.intensity()(data[0])).toEqual(0);
        expect(heatmap.intensity()(data[67])).toEqual(7);
      });
    });
    describe('_build', function () {
      it('intensity ranges', function () {
        var heatmap = heatmapFeature({
          layer: layer,
          position: function (d) {
            return {x: d.a, y: d.b};
          },
          intensity: function (d) {
            return d.c;
          }}).data(data);
        heatmap.gcs('EPSG:3857');
        heatmap._build();
        expect(heatmap.minIntensity()).toBe(0);
        expect(heatmap.maxIntensity()).toBe(7);
        heatmap.intensity(function () { return 2; });
        heatmap.maxIntensity(null).minIntensity(null);
        heatmap._build();
        expect(heatmap.minIntensity()).toBe(1);
        expect(heatmap.maxIntensity()).toBe(2);
      });
      it('gcsPosition', function () {
        var heatmap = heatmapFeature({
          layer: layer,
          position: function (d) {
            return {x: d.a, y: d.b};
          }}).data(data);
        heatmap.gcs('EPSG:3857');
        // we have to call build since we didn't attach this to the layer in the
        // normal way
        heatmap._build();
        var pos = heatmap.gcsPosition();
        expect(pos[0]).toEqual({x: 0, y: 0});
        expect(pos[84]).toEqual({x: 4, y: 3});
      });
    });
  });
});
