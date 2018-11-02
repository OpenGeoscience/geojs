var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;

xdescribe('zoom slider', function () {
  'use strict';

  var d3 = require('d3');
  var $ = require('jquery');
  var map;

  beforeEach(function () {
    map = createMap({
      'center': [0, 0],
      'zoom': 2,
      'clampZoom': false,
      'clampBoundsX': false,
      'clampBoundsY': false
    }, {width: '500px', height: '400px'});
    map.createLayer('ui').createWidget('slider');
    map.draw();
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
