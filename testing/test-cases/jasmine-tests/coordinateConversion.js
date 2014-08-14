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

  it('osm to platcaree projection geo.latlng', function () {
    var pt = [0.0, 90.0], d, d0;
    var d = geo.latlng(pt[1], pt[0]);
    d0 = geo.transform.transformCoordinates("EPSG:4326",
               "EPSG:3857", d);
    expect(d0.x()).toBeCloseTo(d.x(), 0);
    expect(d0.y()).toBeCloseTo(180.0, 1);
  });

  it('platcaree to azimuthal equidistant projection', function () {
    var pt = [18.5, 54.2], d, d0;
    var d = geo.latlng(pt[1], pt[0]);
    proj4.defs("EPSG:3413", "+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs");
    d0 = geo.transform.transformCoordinates("EPSG:4326",
               "EPSG:3413", d);
    expect(d0.x()).toBeCloseTo(3583605.21225,  0.1);
    expect(d0.y()).toBeCloseTo(-1786719.64935, 0.1);
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

  it('osm to platcaree projection array of geo.latlng', function () {
    var pt = [geo.latlng(90.0, 0.0), geo.latlng(0.0, 0.0)], d, d0;
    var d = pt;
    d0 = geo.transform.transformCoordinates("EPSG:4326",
               "EPSG:3857", d);
    expect(d0[0].x()).toBeCloseTo(0.0, 0);
    expect(d0[0].y()).toBeCloseTo(180.0, 0);
    expect(d0[1].x()).toBeCloseTo(0.0, 0);
    expect(d0[1].y()).toBeCloseTo(0.0, 1);
  });
});
