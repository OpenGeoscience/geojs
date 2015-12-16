/*global describe, it, expect, geo*/

describe('zoom slider', function () {
  'use strict';

  var map, width = 800, height = 800;

  // create an osm map layer
  map = geo.map({
    'node': '#map',
    'center': [0, 0],
    'zoom': 2,
    'clampZoom': false,
    'clampBoundsX': false,
    'clampBoundsY': false
  });
  // map.createLayer('osm');
  map.resize(0, 0, width, height);
  map.createLayer('ui').createWidget('slider');
  map.draw();

  it('Zoom in button', function (done) {
    var eps;
    map.zoom(1);
    d3.select('.geo-ui-slider .geo-zoom-in').on('click')();
    map.geoOff(geo.event.transitionend)
      .geoOn(geo.event.transitionend, function () {
        eps = Math.abs(2 - map.zoom());
        expect(eps).toBeLessThan(1e-2);
        done();
      });
  });

  it('Zoom out button', function (done) {
    map.zoom(2);
    var eps;
    d3.select('.geo-ui-slider .geo-zoom-out').on('click')();

    map.geoOff(geo.event.transitionend)
      .geoOn(geo.event.transitionend, function () {
        eps = Math.abs(1 - map.zoom());
        expect(eps).toBeLessThan(1e-2);
        done();
      });
  });

  it('Nub responds to map', function () {
    map.zoom(0);
    var p = $('.geo-ui-slider .geo-zoom-nub').position().top;

    map.zoom(2);
    var q = $('.geo-ui-slider .geo-zoom-nub').position().top;

    expect(q).toBeLessThan(p);
  });
});
