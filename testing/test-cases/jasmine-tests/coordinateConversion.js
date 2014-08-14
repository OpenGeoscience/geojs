/*global describe, it, expect, geo, xit*/

describe('coordinate conversion', function () {
  'use strict';

  /// Should be a no-op
  it('same source and destination projection', function () {
    var pt = [90.0, 0.0], d, d0;
    var d = {x: pt[0], y: pt[1]};
    d0 = geo.transform.transformCoordinates("EPSG:3857",
               "EPSG:3857", d)
    expect(d0.x).toBeCloseTo(d.x, 0);
    expect(d0.y).toBeCloseTo(d.y, 0);
  });

  it('osm to platcaree projection single instance', function () {
    var pt = [0.0, 90.0], d, d0;
    var d = {x: pt[0], y: pt[1]};
    d0 = geo.transform.transformCoordinates("EPSG:4326",
               "EPSG:3857", d)
    expect(d0.x).toBeCloseTo(d.x, 0);
    expect(d0.y).toBeCloseTo(180.0, 1);
  });
});
