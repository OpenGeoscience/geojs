/*global describe, it, expect, geo*/

describe('DiscreteZoom and ParallelProjection', function () {
  'use strict';

  var map, width = 800, height = 800;
  var cam;

  // create an osm map layer
  map = geo.map({
    'node': '#map',
    'center': [0, 0],
    'zoom': 3,
    discreteZoom: true
  });
  map.createLayer('osm');
  map.resize(0, 0, width, height);
  map.draw();

  it('Zoom to a non-integer value', function (done) {
    expect(map.discreteZoom()).toBe(true);
    map.geoOff(geo.event.transitionend)
      .geoOn(geo.event.transitionend, function () {
        expect(map.zoom()).toBe(6);
        done();
      });
    map.zoom(5.75);
  });

  it('Turn off discrete zoom and zoom to a non-integer value', function (done) {
    map.discreteZoom(false);
    expect(map.discreteZoom()).toBe(false);
    map.geoOff(geo.event.transitionend)
      .geoOn(geo.event.transitionend, function () {
        expect(map.zoom()).toBe(5.75);
        done();
      });
    map.zoom(5.75);
  });

  it('Turn back on discrete zoom', function (done) {
    map.geoOff(geo.event.transitionend)
      .geoOn(geo.event.transitionend, function () {
        expect(map.discreteZoom()).toBe(true);
        expect(map.zoom()).toBe(6);
        done();
      });
    map.discreteZoom(true);
  });

  it('Turn on parallel projection', function (done) {
    cam = map.baseLayer().renderer().contextRenderer().camera();
    var proj = cam.projectionMatrix();
    expect(proj[1] === 0 && proj[2] === 0 && proj[3] === 0 && proj[4] === 0 &&
           proj[6] === 0 && proj[7] === 0 && proj[8] === 0 && proj[9] === 0 &&
           proj[11] === 0 && proj[15] === 1).toBe(false);
    expect(map.parallelProjection()).toBe(false);
    map.geoOff(geo.event.transitionend)
      .geoOn(geo.event.transitionend, function () {
        expect(map.parallelProjection()).toBe(true);
        var proj = cam.projectionMatrix();
        expect(proj[1] === 0 && proj[2] === 0 && proj[3] === 0 &&
               proj[4] === 0 && proj[6] === 0 && proj[7] === 0 &&
               proj[8] === 0 && proj[9] === 0 && proj[11] === 0 &&
               proj[15] === 1).toBe(true);
        done();
      });
    map.parallelProjection(true).draw();
  });
});
