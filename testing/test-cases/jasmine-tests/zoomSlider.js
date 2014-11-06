/*global describe, it, expect, geo, xit*/

describe('zoom slider', function () {
  'use strict';

  var map, width = 800, height = 800;

  it('Setup map', function () {
    // create an osm map layer
    map = geo.map({
      'node': '#map',
      'center': [0, 0],
      'zoom': 3
    });
    map.createLayer('osm');
    map.resize(0, 0, width, height);
    map.createLayer('ui').createWidget('slider');
    map.draw();
  });

  it('Zoom in button', function () {
    var z = map.zoom(), eps;
    d3.select('.geo-ui-slider .geo-zoom-in').on('click')();

    eps = Math.abs(z + 1 - map.zoom());

    expect(eps).toBeLessThan(1e-2);
  });
  
  it('Zoom out button', function () {
    map.zoom(2);
    var z = map.zoom(), eps;
    d3.select('.geo-ui-slider .geo-zoom-out').on('click')();

    eps = Math.abs(z - 1 - map.zoom());

    expect(eps).toBeLessThan(1e-2);
  });

  it('Nub responds to map', function () {
    map.zoom(0);
    var p = $('.geo-ui-slider .geo-zoom-nub').position().top;

    map.zoom(2);
    var q = $('.geo-ui-slider .geo-zoom-nub').position().top;

    expect(q).toBeLessThan(p);
  });
});
