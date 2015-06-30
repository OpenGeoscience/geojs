/*global describe, it, expect, geo, xit*/

describe('coordinate conversion', function () {
  'use strict';

  /// Should be a no-op
  it('same source and destination projection', function () {
    var pt = [90.0, 0.0], d, d0;
    var d = {x: pt[0], y: pt[1]};
    d0 = geo.transform.transformCoordinates("EPSG:3857",
               "EPSG:3857", d);
    expect(d0.x).toBeCloseTo(d.x, 0);
    expect(d0.y).toBeCloseTo(d.y, 0);
  });

  it('osm to platcaree projection single instance', function () {
    var pt = [0.0, 90.0], d, d0;
    var d = {x: pt[0], y: pt[1]};
    d0 = geo.transform.transformCoordinates("EPSG:4326",
               "EPSG:3857", d);
    expect(d0.x).toBeCloseTo(d.x, 0);
    expect(d0.y).toBeCloseTo(180.0, 1);
  });

  it('osm to platcaree projection array of array', function () {
    var pt = [[0.0, 90.0], [0.0, 0.0]], d, d0;
    var d = pt;
    d0 = geo.transform.transformCoordinates("EPSG:4326",
               "EPSG:3857", d);
    expect(d0[0][0]).toBeCloseTo(0.0, 0);
    expect(d0[0][1]).toBeCloseTo(180.0, 0);
    expect(d0[1][0]).toBeCloseTo(0.0, 0);
    expect(d0[1][1]).toBeCloseTo(0.0, 1);
  });

  it('osm to platcaree projection array of objects', function () {
    var pt = [{ x: 0.0, y: 90.0 }, { x:0.0, y:0.0 }], d, d0;
    var d = pt;
    d0 = geo.transform.transformCoordinates("EPSG:4326",
               "EPSG:3857", d);
    expect(d0[0].x).toBeCloseTo(0.0, 0);
    expect(d0[0].y).toBeCloseTo(180.0, 0);
    expect(d0[1].x).toBeCloseTo(0.0, 0);
    expect(d0[1].y).toBeCloseTo(0.0, 1);
  });

  it('osm to platcaree projection array with 3 components', function () {
    var pt = [0.0, 90.0, 0.0, 0.0, 90.0, 0.0], d, d0;
    var d = pt;
    d0 = geo.transform.transformCoordinates("EPSG:4326",
               "EPSG:3857", d, 3);
    expect(d0[0]).toBeCloseTo(0.0, 0);
    expect(d0[1]).toBeCloseTo(180.0, 1);
    expect(d0[2]).toBeCloseTo(0.0, 0);
    expect(d0[3]).toBeCloseTo(0.0, 0);
    expect(d0[4]).toBeCloseTo(180.0, 1);
    expect(d0[5]).toBeCloseTo(0.0, 0);
  });
});
