// Test geo.core.osmLayer
var $ = require('jquery');
var mockAnimationFrame = require('../test-utils').mockAnimationFrame;
var stepAnimationFrame = require('../test-utils').stepAnimationFrame;
var unmockAnimationFrame = require('../test-utils').unmockAnimationFrame;

describe('geo.core.osmLayer', function () {
  'use strict';

  var map;
  var waitForIt = require('../test-utils').waitForIt;
  var submitNote = require('../test-utils').submitNote;
  // var logCanvas2D = require('../test-utils').logCanvas2D;
  var geo = require('../test-utils').geo;
  var mockVGLRenderer = geo.util.mockVGLRenderer;
  var restoreVGLRenderer = geo.util.restoreVGLRenderer;
  var vgl = require('vgl');
  var closeToEqual = require('../test-utils').closeToEqual;

  function create_map(opts) {
    mockVGLRenderer();
    var node = $('<div id="map-osm-layer"/>').css({width: '640px', height: '360px'});
    $('#map-osm-layer').remove();
    /* Prepend because we want the map to be the first item so that its
     * position doesn't change when data is added to the html reporter div. */
    $('body').prepend(node);
    opts = $.extend({}, opts);
    opts.node = node;
    return geo.map(opts);
  }

  function destroy_map() {
    if (map) {
      map.exit();
    }
    $('#map-osm-layer').remove();
    restoreVGLRenderer();
  }

  /* Run some performance tests and submit them as a build note.
   *
   * @param mapinfo: an object that includes the map to test.
   * @param notekey: the key to use for the build note.
   */
  function measure_performance(mapinfo, notekey) { // eslint-disable-line no-unused-vars
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
      it('report findings', function (done) {
        var timings = geo.util.timeReport('requestAnimationFrame');
        // very minimal test threshold; this is mostly to collect data
        expect(timings.count).toBeGreaterThan(10);
        timings = $.extend({}, timings);
        delete timings.recentsub;
        submitNote(notekey, timings).then(function () {
          geo.util.timeRequestAnimationFrame(true);
          done();
        });
      });
    });
  }

  describe('default osmLayer', function () {

    describe('html', function () {
      var layer, lastThis;
      it('creation', function () {
        map = create_map();
        layer = map.createLayer('osm', {renderer: null, url: '/testdata/white.jpg'});
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
        layer = map.createLayer('osm', {renderer: null, mapOpacity: 0.5, url: '/testdata/white.jpg'});
        expect(layer.canvas().css('opacity')).toBe('0.5');
      });
      waitForIt('.geo-tile-container', function () {
        return map.node().find('.geo-tile-container').length > 0;
      });
      it('tile function', function () {
        map.deleteLayer(layer);
        layer = map.createLayer('osm', {
          renderer: null,
          mapOpacity: 0.5,
          url: function (x, y, z) {
            lastThis = this;
            return '/testdata/white.jpg';
          }});
      });
      waitForIt('.geo-tile-container', function () {
        return map.node().find('.geo-tile-container').length > 0;
      });
      it('tile function test', function () {
        expect(lastThis).toBe(layer);
      });
      /* The follow is a test of tileLayer as attached to a map.  We don't
       * currently expose the tileLayer class directly to the createLayer
       * function, so some testing is done here */
      it('_update', function () {
        var lastlevel = layer.canvas().attr('lastlevel');
        layer._update();
        expect(layer.canvas().attr('lastlevel')).toBe(lastlevel);
        map.zoom(1.5);
        expect(layer.canvas().attr('lastlevel')).not.toBe(lastlevel);
      });
      it('destroy', destroy_map);
    });
    describe('d3', function () {
      var layer;
      it('creation', function () {
        map = create_map();
        layer = map.createLayer('osm', {renderer: 'd3', url: '/testdata/white.jpg'});
      });
      waitForIt('.d3QuadFeature', function () {
        return map.node().find('.d3QuadFeature').length > 0;
      });
      it('check for tiles', function () {
        expect(map.node().find('.d3QuadFeature').length).toBeGreaterThan(0);
      });
      /* The following is a test of d3.tileLayer as attached to a map. */
      it('_update', function () {
        var elem = $('.d3QuadFeature').closest('g');
        var transform = elem.attr('transform');
        mockAnimationFrame();
        layer._update();
        stepAnimationFrame();
        expect(elem.attr('transform')).toBe(transform);
        map.zoom(1);
        stepAnimationFrame();
        expect(elem.attr('transform')).not.toBe(transform);
        unmockAnimationFrame();
      });
      it('destroy', destroy_map);
    });
    describe('vgl', function () {
      it('creation', function () {
        map = create_map();
        map.createLayer('osm', {renderer: 'vgl', url: '/testdata/white.jpg'});
        expect(map.node().find('.webgl-canvas').length).toBe(1);
      });
      it('destruction', destroy_map);
    });
    describe('switch renderer', function () {
      var layer;
      it('vgl to null', function () {
        map = create_map();
        layer = map.createLayer('osm', {renderer: 'vgl', url: '/testdata/white.jpg'});
        expect(map.node().find('.webgl-canvas').length).toBe(1);
        map.deleteLayer(layer);
        layer = map.createLayer('osm', {renderer: null, url: '/testdata/white.jpg'});
        expect(map.node().find('.webgl-canvas').length).toBe(0);
        expect(map.node().find('[data-tile-layer="0"]').length).toBe(1);
      });
      waitForIt('.geo-tile-container', function () {
        return map.node().find('.geo-tile-container').length > 0;
      });
      it('null to d3', function () {
        expect(map.node().find('[data-tile-layer="0"]').is('div')).toBe(true);
        map.deleteLayer(layer);
        layer = map.createLayer('osm', {renderer: 'd3', url: '/testdata/white.jpg'});
        expect(map.node().find('[data-tile-layer="0"]').length).toBe(0);
      });
      waitForIt('.d3QuadFeature', function () {
        return map.node().find('.d3QuadFeature').length > 0;
      });
      it('d3 to canvas', function () {
        map.deleteLayer(layer);
        layer = map.createLayer('osm', {renderer: 'canvas', url: '/testdata/white.jpg'});
        expect(map.node().find('.d3QuadFature').length).toBe(0);
        expect(map.node().find('.canvas-canvas').length).toBe(1);
      });
      it('canvas to vgl', function () {
        expect(map.node().find('.canvas-canvas').length).toBe(1);
        map.deleteLayer(layer);
        layer = map.createLayer('osm', {renderer: 'vgl', url: '/testdata/white.jpg'});
        expect(map.node().find('.canvas-canvas').length).toBe(0);
        expect(map.node().find('.webgl-canvas').length).toBe(1);
      });
      it('destroy', destroy_map);
    });

    describe('html and d3 alignment', function () {
      var positions = {};
      var layer;
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
          layer = map.createLayer('osm', {renderer: null, url: '/testdata/white.jpg'});
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
          layer = map.createLayer('osm', {renderer: 'd3', url: '/testdata/white.jpg'});
          expect(map.node().find('[data-tile-layer="0"]').length).toBe(0);
        });
        waitForIt('d3 tiles to load', function () {
          return $('image[reference]').length === numTiles;
        });
        it('compare tile offsets at angle ' + angle, function () {
          $.each($('image[reference]'), function () {
            var ref = $(this).attr('reference');
            /* Only check the top level */
            if (ref.indexOf('4_') === 0) {
              var offset = $(this)[0].getBoundingClientRect();
              /* Allow around 1 pixel of difference */
              expect(closeToEqual(offset, positions[ref], -0.4)).toBe(true);
            }
          });
        });
        it('destroy', destroy_map);
      });
    });
  });

  describe('pixel coordinates', function () {
    it('util.pixelCoordinateParams', function () {
      var sizeX = 12345, sizeY = 5678, tileSize = 240;
      var params = geo.util.pixelCoordinateParams('#map-osm-layer', sizeX, sizeY, tileSize, tileSize);
      expect(params.map.ingcs).toBe('+proj=longlat +axis=esu');
      expect(params.map.unitsPerPixel).toEqual(64);
      expect(params.layer.tileRounding).toBe(Math.ceil);
      expect(params.layer.tileOffset()).toEqual({x: 0, y: 0});
      expect(params.layer.tilesAtZoom(3)).toEqual({x: 7, y: 3});
      expect(params.layer.tilesMaxBounds(3)).toEqual({x: 1543, y: 709});
      map = create_map(params.map);
      map.createLayer('osm', $.extend(
        {}, params.layer, {renderer: null, url: '/testdata/white.jpg', zoom: 3}));
      expect(map.node().find('[data-tile-layer="0"]').length).toBe(1);
    });
    waitForIt('.geo-tile-container', function () {
      return map.node().find('.geo-tile-container').length > 0;
    });
    it('check for tiles', function () {
      expect(map.node().find('.geo-tile-container').length).toBeGreaterThan(0);
    });
    it('destroy', destroy_map);
  });
  describe('geo.d3.osmLayer', function () {
    var layer, mapinfo = {};
    it('test that tiles are created', function () {
      map = create_map();
      mapinfo.map = map;
      layer = map.createLayer('osm', {
        renderer: 'd3',
        url: '/testdata/white.jpg'
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
    measure_performance(mapinfo, 'osmLayer-d3-performance');
    it('destroy', destroy_map);
    it('_drawTile after destruction', function () {
      // this shouldn't raise an error
      layer._drawTile('not a tile');
    });
  });

  describe('geo.canvas.osmLayer', function () {
    var layer, mapinfo = {};

    it('test that tiles are created', function () {
      // logCanvas2D();
      map = create_map();
      mapinfo.map = map;
      layer = map.createLayer('osm', {
        renderer: 'canvas',
        url: '/testdata/white.jpg'
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
    measure_performance(mapinfo, 'osmLayer-canvas-performance');
    it('destroy', destroy_map);
    it('_drawTile after destruction', function () {
      // this shouldn't raise an error
      layer._drawTile('not a tile');
    });
    it('test that partial tiles are handled', function () {
      map = create_map();
      layer = map.createLayer('osm', {
        renderer: 'canvas',
        url: '/testdata/white.jpg',
        tilesMaxBounds: function (level) {
          var scale = Math.pow(2, 5 - level);
          // pick some bounds that could be valid at level 5
          return {x: Math.floor(5602 / scale), y: Math.floor(4148 / scale)};
        }
      });
    });
    waitForIt('tiles to load', function () {
      // to truly test this, we would have to check if the canvas drawImage
      // function is called with eight parameters in some instances
      return Object.keys(layer.activeTiles).length === 21;
    });
    it('destroy', destroy_map);
  });

  describe('geo.gl.osmLayer', function () {
    var layer, mapinfo = {}, glCounts;

    it('test that tiles are created', function () {
      map = create_map();
      mapinfo.map = map;
      layer = map.createLayer('osm', {
        renderer: 'vgl',
        url: '/testdata/white.jpg'
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
    it('destroy', destroy_map);
    it('_drawTile after destruction', function () {
      // this shouldn't raise an error
      layer._drawTile('not a tile');
    });
    it('test that partial tiles are handled', function () {
      map = create_map();
      layer = map.createLayer('osm', {
        renderer: 'vgl',
        url: '/testdata/white.jpg',
        tilesMaxBounds: function (level) {
          var scale = Math.pow(2, 5 - level);
          // pick some bounds that could be valid at level 5
          return {x: Math.floor(5602 / scale), y: Math.floor(4148 / scale)};
        }
      });
      glCounts = $.extend({}, vgl.mockCounts());
    });
    waitForIt('tiles to load', function () {
      return (Object.keys(layer.activeTiles).length === 21 &&
              vgl.mockCounts().uniform2fv >= (glCounts.uniform2fv || 0) + 9);

    });
    it('destroy', destroy_map);
  });
});
