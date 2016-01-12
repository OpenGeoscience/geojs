// Test geo.core.osmLayer
/*global describe, it, expect, geo, waitForIt, mockVGLRenderer*/

describe('geo.core.osmLayer', function () {
  'use strict';
  function create_map(opts) {
    var node = $('<div id="map"/>');
    $('#map').remove();
    $('body').append(node);
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
  });
});
