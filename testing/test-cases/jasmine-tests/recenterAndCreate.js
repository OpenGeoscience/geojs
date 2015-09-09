/*global describe, it, expect, geo*/

describe('Test recentering a map and then adding data to a feature', function () {
  'use strict';

  var map, map_layer, point_layer, width = 640, height = 480;

  function compareValue(val1, val2, prec) {
    if (val1 === val2) {
      return expect(val1).toBe(val2);
    }
    if (Math.abs(val1) > Math.abs(val2)) {
      expect(val2 / val1).toBeCloseTo(1, prec !== undefined ? prec : 3);
    } else {
      expect(val1 / val2).toBeCloseTo(1, prec !== undefined ? prec : 3);
    }
  }

  function compareArrays(a1, a2, prec) {
    expect(a1.length).toBe(a2.length);
    for (var i = 0; i < a1.length; i += 1) {
      compareValue(a1[i], a2[i], prec);
    }
  }

  it('Setup map', function () {
    map = geo.map({
      'node': '#map',
      'center': {x: -70, y: 30},
      'zoom': 4
    });
    map_layer = map.createLayer('osm');
    map.resize(0, 0, width, height);

    point_layer = map.createLayer('feature', {'render': 'vgl'});
    var point_gl = point_layer.createFeature('point');
    map.bounds({lowerLeft: {x: -100, y: 0}, upperRight: {x: -60, y: 40}});

    var gl_style = {
        'radius': 12,
        'strokeColor': 'steelblue',
        'strokeWidth': 2,
        'fillColor': 'steelblue',
        'fillOpacity': 0.25
      };
    point_gl
      .style(gl_style)
      .data([{x: -75, y: 30}]);
    map.draw();
  });

  it('Check if layers all have the same camera position', function () {
    var camera_base = map.baseLayer().renderer().contextRenderer().camera(),
        camera_map = map_layer.renderer().contextRenderer().camera(),
        camera_points = point_layer.renderer().contextRenderer().camera(),
        base_view = camera_base.viewMatrix();
    compareArrays(base_view, camera_map.viewMatrix());
    compareArrays(base_view, camera_points.viewMatrix());
    compareValue(camera_base.viewAngle(), camera_map.viewAngle());
    compareValue(camera_base.viewAspect(), camera_map.viewAspect());
    compareValue(camera_base.viewAngle(), camera_points.viewAngle());
    compareValue(camera_base.viewAspect(), camera_points.viewAspect());
    compareValue(camera_base.parallelExtents().width,
                 camera_map.parallelExtents().width);
    compareValue(camera_base.parallelExtents().height,
                 camera_map.parallelExtents().height);
    compareValue(camera_base.parallelExtents().zoom,
                 camera_map.parallelExtents().zoom);
    compareValue(camera_base.parallelExtents().width,
                 camera_points.parallelExtents().width);
    compareValue(camera_base.parallelExtents().height,
                 camera_points.parallelExtents().height);
    compareValue(camera_base.parallelExtents().zoom,
                 camera_points.parallelExtents().zoom);
  });
});
