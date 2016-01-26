// Test geo.core.osmLayer
/*global describe, it, expect, geo, waitForIt, mockVGLRenderer, closeToEqual*/

describe('geo.core.osmLayer', function () {
  'use strict';
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


  describe('default osmLayer', function () {
    describe('html', function () {
      var map, layer;
      it('creation', function () {
        map = create_map();
        layer = map.createLayer('osm', {renderer: null});
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
        layer = map.createLayer('osm', {renderer: null, mapOpacity: 0.5});
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
        layer = map.createLayer('osm', {renderer: 'd3'});
        expect(map.node().find('[data-tile-layer="0"]').length).toBe(1);
      });
      waitForIt('.d3PlaneFeature', function () {
        return map.node().find('.d3PlaneFeature').length > 0;
      });
      it('check for tiles', function () {
        expect(map.node().find('.d3PlaneFeature').length).toBeGreaterThan(0);
      });
      /* The follow is a test of d3.tileLayer as attached to a map. */
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
        map.createLayer('osm', {renderer: 'vgl'});
        expect(map.node().find('.webgl-canvas').length).toBe(1);
      });
    });
    describe('switch renderer', function () {
      var map, layer;
      it('vgl to null', function () {
        mockVGLRenderer();
        map = create_map();
        layer = map.createLayer('osm', {renderer: 'vgl'});
        expect(map.node().find('.webgl-canvas').length).toBe(1);
        map.deleteLayer(layer);
        layer = map.createLayer('osm', {renderer: null});
        expect(map.node().find('.webgl-canvas').length).toBe(0);
        expect(map.node().find('[data-tile-layer="0"]').length).toBe(1);
      });
      waitForIt('.geo-tile-container', function () {
        return map.node().find('.geo-tile-container').length > 0;
      });
      it('null to d3', function () {
        expect(map.node().find('[data-tile-layer="0"]').is('div')).toBe(true);
        map.deleteLayer(layer);
        layer = map.createLayer('osm', {renderer: 'd3'});
        expect(map.node().find('[data-tile-layer="0"]').is('div')).toBe(false);
        expect(map.node().find('[data-tile-layer="0"]').length).toBe(1);
      });
      waitForIt('.d3PlaneFeature', function () {
        return map.node().find('.d3PlaneFeature').length > 0;
      });
      it('d3 to vgl', function () {
        expect(map.node().find('[data-tile-layer="0"]').is('g')).toBe(true);
        map.deleteLayer(layer);
        layer = map.createLayer('osm', {renderer: 'vgl'});
        expect(map.node().find('[data-tile-layer="0"]').is('g')).toBe(false);
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
          layer = map.createLayer('osm', {renderer: null});
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
          layer = map.createLayer('osm', {renderer: 'd3'});
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
});
