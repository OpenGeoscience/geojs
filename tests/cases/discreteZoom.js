var createMap = require('../test-utils').createMap;

describe('DiscreteZoom and ParallelProjection', function () {
  'use strict';

  function makeMap() {
    var map = createMap({
      'center': [0, 0],
      'zoom': 3,
      discreteZoom: true
    });
    map.draw();
    return map;
  }

  it('Zoom to a non-integer value', function () {
    var map = makeMap();
    expect(map.discreteZoom()).toBe(true);
    map.zoom(5.75);
    expect(map.zoom()).toBe(6);
  });

  it('Turn off discrete zoom and zoom to a non-integer value', function () {
    var map = makeMap();
    map.discreteZoom(false);
    expect(map.discreteZoom()).toBe(false);
    map.zoom(5.75);
    expect(map.zoom()).toBe(5.75);
  });

  it('Turn back on discrete zoom', function () {
    var map = makeMap();
    map.discreteZoom(false);
    map.zoom(5.75);
    map.discreteZoom(true);
    expect(map.zoom()).toBe(6);
  });

  it('Turn on perspective projection', function () {
    var map = makeMap();
    var cam = map.camera();
    var proj = cam.projectionMatrix;
    expect(proj[1] === 0 && proj[2] === 0 && proj[3] === 0 &&
           proj[4] === 0 && proj[6] === 0 && proj[7] === 0 &&
           proj[8] === 0 && proj[9] === 0 && proj[11] === 0 &&
           proj[15] === 1).toBe(true);
    expect(cam.projection).toBe('parallel');

    cam.projection = 'perspective';
    map.draw();

    proj = cam.projectionMatrix;
    expect(cam.projection).toBe('perspective');
    expect(proj[1] === 0 && proj[2] === 0 && proj[3] === 0 && proj[4] === 0 &&
           proj[6] === 0 && proj[7] === 0 && proj[8] === 0 && proj[9] === 0 &&
           proj[11] === 0 && proj[15] === 1).toBe(false);
  });
});
