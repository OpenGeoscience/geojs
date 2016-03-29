var geo = require('../test-utils').geo;

describe('zoom slider', function () {
  'use strict';

  var d3 = require('d3');
  var $ = require('jquery');
  var map;

  beforeEach(function () {
    $('<div id="map-zoom-slider"/>').appendTo('body')
      .css({width: '500px', height: '400px'});
    map = geo.map({
      'node': '#map-zoom-slider',
      'center': [0, 0],
      'zoom': 2,
      'clampZoom': false,
      'clampBoundsX': false,
      'clampBoundsY': false
    });
    map.createLayer('ui').createWidget('slider');
    map.draw();
  });

  afterEach(function () {
    map.exit();
    $('#map-zoom-slider').remove();
  });

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
