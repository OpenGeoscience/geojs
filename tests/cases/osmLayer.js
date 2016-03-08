// Test geo.core.osmLayer

describe('geo.core.osmLayer', function () {
  'use strict';
  var geo = require('../test-utils').geo;
  var $ = require('jquery');
  var waitForIt = require('../test-utils').waitForIt;
  // var submitNote = require('../test-utils').submitNote;
  // var logCanvas2D = require('../test-utils').logCanvas2D;
  var mockVGLRenderer = require('../test-utils').mockVGLRenderer;
  var closeToEqual = require('../test-utils').closeToEqual;

  function create_map(opts) {
    var node = $('<div id="map"/>').css({width: '640px', height: '360px'});
    $('#map,#map-container').remove();
    /* Prepend because we want the map to be the first item so that its
     * position doesn't change when data is added to the html reporter div. */
    $('body').prepend(node);
    opts = $.extend({}, opts);
    opts.node = node;
    return geo.map(opts);
  }

  /* Run some performance tests and submit them as a build note.
   *
   * @param mapinfo: an object that includes the map to test.
   * @param notekey: the key to use for the build note.
   */
  function measure_performance(mapinfo, notekey) {
    var map;
    describe('measure performance ' + notekey, function () {
      it('measure performance', function (done) {
        map = mapinfo.map;
        geo.util.timeRequestAnimationFrame(undefined, true);
        map.zoom(5);
        map.center({x: 28.9550, y: 41.0136});
        map.transition({
          center: {x: -0.1275, y: 51.5072},
          duration: 500,
          done: done
        });
      });
      it('next animation', function (done) {
        map.transition({
          center: {x: 37.6167, y: 55.7500},
          duration: 500,
          ease: function (t) {
            return Math.pow(2.0, -10.0 * t) * Math.sin((t - 0.075) * (2.0 * Math.PI) / 0.3) + 1.0;
          },
          done: done
        });
      });
      it('next animation', function (done) {
        map.transition({
          center: {x: 28.9550, y: 41.0136},
          duration: 500,
          ease: function (t) {
            var r = 2.75;
            var s = 7.5625;
            if (t < 1.0 / r) {
              return s * t * t;
            }
            if (t < 2.0 / r) {
              t -= 1.5 / r;
              return s * t * t + 0.75;
            }
            if (t < 2.5 / r) {
              t -= 2.25 / r;
              return s * t * t + 0.9375;
            }
            t -= 2.625 / r;
            return s * t * t + 0.984375;
          },
          done: done
        });
      });
      it('next animation', function (done) {
        map.transition({
          center: {x: 37.6167, y: 55.7500},
          duration: 500,
          ease: function (t) {
            return Math.pow(2.0, -10.0 * t) * Math.sin((t - 0.075) * (2.0 * Math.PI) / 0.3) + 1.0;
          },
          done: done
        });
      });
      it('next animation', function (done) {
        map.transition({
          center: {x: 19.0514, y: 47.4925},
          rotation: Math.PI * 2,
          duration: 500,
          done: done
        });
      });
      it('report findings', function () {
        var timings = geo.util.timeReport('requestAnimationFrame');
        expect(timings.count).toBeGreaterThan(100);
        timings = $.extend({}, timings);
        delete timings.recentsub;
        // submitNote(notekey, timings);
        geo.util.timeRequestAnimationFrame(true);
      });
    });
  }

  describe('default osmLayer', function () {
    describe('html', function () {
      var map, layer;
      it('creation', function () {
        map = create_map();
        layer = map.createLayer('osm', {renderer: null, url: '/data/white.jpg'});
        expect(map.node().find('[data-tile-layer="0"]').length).toBe(1);
      });
      waitForIt('.geo-tile-container', function () {
        return map.node().find('.geo-tile-container').length > 0;
      });
      it('check for tiles', function () {
        expect(map.node().find('.geo-tile-container').length).toBeGreaterThan(0);
      });
      it('mapOpacity', function () {
        map.deleteLayer(layer);
        layer = map.createLayer('osm', {renderer: null, mapOpacity: 0.5, url: '/data/white.jpg'});
        expect(layer.canvas().css('opacity')).toBe('0.5');
      });
      waitForIt('.geo-tile-container', function () {
        return map.node().find('.geo-tile-container').length > 0;
      });
      /* The follow is a test of tileLayer as attached to a map.  We don't
       * currently expose the tileLayer class directly to the createLayer
       * function, so some testing is done here */
      it('_update', function () {
        var transform = layer.canvas().css('transform');
        layer._update();
        expect(layer.canvas().css('transform')).toBe(transform);
        map.zoom(1.5);
        expect(layer.canvas().css('transform')).not.toBe(transform);
      });
    });
    describe('d3', function () {
      var map, layer, lastlevel;
      it('creation', function () {
        map = create_map();
        layer = map.createLayer('osm', {renderer: 'd3', url: '/data/white.jpg'});
        expect(map.node().find('[data-tile-layer="0"]').length).toBe(1);
      });
      waitForIt('.d3PlaneFeature', function () {
        return map.node().find('.d3PlaneFeature').length > 0;
      });
      it('check for tiles', function () {
        expect(map.node().find('.d3PlaneFeature').length).toBeGreaterThan(0);
      });
      /* The following is a test of d3.tileLayer as attached to a map. */
      it('_update', function () {
        lastlevel = layer.canvas().attr('lastlevel');
        layer._update();
        expect(layer.canvas().attr('lastlevel')).toBe(lastlevel);
        map.zoom(1);
        expect(layer.canvas().attr('lastlevel')).not.toBe(lastlevel);
      });
    });
    describe('vgl', function () {
      it('creation', function () {
        mockVGLRenderer();
        var map = create_map();
        map.createLayer('osm', {renderer: 'vgl', url: '/data/white.jpg'});
        expect(map.node().find('.webgl-canvas').length).toBe(1);
      });
    });
    describe('switch renderer', function () {
      var map, layer;
      it('vgl to null', function () {
        mockVGLRenderer();
        map = create_map();
        layer = map.createLayer('osm', {renderer: 'vgl', url: '/data/white.jpg'});
        expect(map.node().find('.webgl-canvas').length).toBe(1);
        map.deleteLayer(layer);
        layer = map.createLayer('osm', {renderer: null, url: '/data/white.jpg'});
        expect(map.node().find('.webgl-canvas').length).toBe(0);
        expect(map.node().find('[data-tile-layer="0"]').length).toBe(1);
      });
      waitForIt('.geo-tile-container', function () {
        return map.node().find('.geo-tile-container').length > 0;
      });
      it('null to d3', function () {
        expect(map.node().find('[data-tile-layer="0"]').is('div')).toBe(true);
        map.deleteLayer(layer);
        layer = map.createLayer('osm', {renderer: 'd3', url: '/data/white.jpg'});
        expect(map.node().find('[data-tile-layer="0"]').is('div')).toBe(false);
        expect(map.node().find('[data-tile-layer="0"]').length).toBe(1);
      });
      waitForIt('.d3PlaneFeature', function () {
        return map.node().find('.d3PlaneFeature').length > 0;
      });
      it('d3 to canvas', function () {
        expect(map.node().find('[data-tile-layer="0"]').is('g')).toBe(true);
        map.deleteLayer(layer);
        layer = map.createLayer('osm', {renderer: 'canvas', url: '/data/white.jpg'});
        expect(map.node().find('[data-tile-layer="0"]').is('g')).toBe(false);
        expect(map.node().find('.canvas-canvas').length).toBe(1);
      });
      it('canvas to vgl', function () {
        expect(map.node().find('.canvas-canvas').length).toBe(1);
        map.deleteLayer(layer);
        layer = map.createLayer('osm', {renderer: 'vgl', url: '/data/white.jpg'});
        expect(map.node().find('.canvas-canvas').length).toBe(0);
        expect(map.node().find('.webgl-canvas').length).toBe(1);
      });
    });

    describe('html and d3 alignment', function () {
      var positions = {};
      var map, layer;
      /* A set of angles to test with the number of tiles we expect at each
       * angle.  This could be extended to test many more angles, but phantom
       * does odd things with the offsets, so the test looks like it fails.
      var angles = {0: 21, 1: 21, 30: 29, '-30': 29, 90: 21, 120: 29, 180: 21,
                    210: 29, '-17.05': 29};
       */
      var angles = {0: 21, 180: 21};
      $.each(angles, function (angle, numTiles) {
        it('null default', function () {
          map = create_map();
          if (angle) {
            map.rotation(parseFloat(angle) * Math.PI / 180);
          }
          layer = map.createLayer('osm', {renderer: null, url: '/data/white.jpg'});
          expect(map.node().find('[data-tile-layer="0"]').length).toBe(1);
        });
        waitForIt('null tiles to load', function () {
          return $('[tile-reference]').length === numTiles;
        });
        it('check null tiles and switch to d3', function () {
          positions = {};
          $.each($('[tile-reference]'), function () {
            var ref = $(this).attr('tile-reference');
            positions[ref] = $(this)[0].getBoundingClientRect();
          });
          map.deleteLayer(layer);
          layer = map.createLayer('osm', {renderer: 'd3', url: '/data/white.jpg'});
          expect(map.node().find('[data-tile-layer="0"]').is('div')).toBe(false);
          expect(map.node().find('[data-tile-layer="0"]').length).toBe(1);
        });
        waitForIt('d3 tiles to load', function () {
          return $('image[reference]').length === numTiles;
        });
        it('compare tile offsets at angle ' + angle, function () {
          $.each($('image[reference]'), function () {
            var ref = $(this).attr('reference');
            var offset = $(this)[0].getBoundingClientRect();
            /* Allow around 1 pixel of difference */
            expect(closeToEqual(offset, positions[ref], -0.4)).toBe(true);
          });
          map.exit();
        });
      });
    });
  });

  describe('geo.canvas.osmLayer', function () {
    var map, layer, mapinfo = {};
    it('test that tiles are created', function () {
      // logCanvas2D();
      map = create_map();
      mapinfo.map = map;
      layer = map.createLayer('osm', {
        renderer: 'canvas',
        baseUrl: '/data/tiles/'
      });
    });
    waitForIt('tiles to load', function () {
      return Object.keys(layer.activeTiles).length === 21;
    });
    /*
    waitForIt('tiles to draw', function () {
      return window._canvasLog.counts['drawImage'] >= 21;
    });
    */
    it('zoom out', function () {
      map.zoom(3);
    });
    /* This checks to make sure tiles are removed */
    waitForIt('tiles to load', function () {
      return Object.keys(layer.activeTiles).length === 17;
    });
    /* It seems that the canvas is too slow in phantomjs for this test to make
     * sense, so disable it until we can figure a better way.
    measure_performance(mapinfo, 'osmLayer-canvas-performance');
     */
  });

  describe('geo.gl.osmLayer', function () {
    var map, layer, mapinfo = {};

    it('test that tiles are created', function () {
      mockVGLRenderer();
      map = create_map();
      mapinfo.map = map;
      layer = map.createLayer('osm', {
        renderer: 'vgl',
        baseUrl: '/data/tiles/'
      });
    });
    waitForIt('tiles to load', function () {
      return Object.keys(layer.activeTiles).length === 21;
    });
    it('zoom out', function () {
      map.zoom(3);
    });
    /* This checks to make sure tiles are removed */
    waitForIt('tiles to load', function () {
      return Object.keys(layer.activeTiles).length === 17;
    });
    measure_performance(mapinfo, 'osmLayer-vgl-performance');
  });
});
