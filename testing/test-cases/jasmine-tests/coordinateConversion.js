/*global describe, it, expect, geo, xit*/

describe('coordinate conversion', function () {
  'use strict';

  // make sure georeferencing operators are
  // inverses of each other for several points
  describe('same source and destination projection', function () {
    var pt = [90.0, 0.0], d, d0;
    var d = {x: pt[0], y: pt[1]};
    d0 = geo.transform.transformCoordiantes("EPSG:3857",
               "EPSG:3857", d)
    expect(d0.x).toBeCloseTo(d.x, 0);
    expect(d0.y).toBeCloseTo(d.y, 0);
  });
});
