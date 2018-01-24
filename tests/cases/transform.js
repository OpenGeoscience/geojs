// Test geo.transform

describe('geo.transform', function () {
  'use strict';

  var $ = require('jquery');
  var geo = require('../test-utils').geo;
  var closeToEqual = require('../test-utils').closeToEqual;
  var closeToArray = require('../test-utils').closeToArray;

  function r2(pt1, pt2) {
    // euclidean norm
    var dx = pt1.x - pt2.x,
        dy = pt1.y - pt2.y,
        dz = (pt1.z || 0) - (pt2.z || 0);

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  it('default initialization', function () {
    var proj = geo.transform();

    expect(proj.source()).toBe('EPSG:4326');
    expect(proj.target()).toBe('EPSG:3857');
  });

  // return a compact string representation of a point
  function str(pt) {
    return JSON.stringify(pt);
  }

  // define a projection independent transform test
  function test_transform(src, src_unit, tgt, tgt_unit, pts) {
    describe(src + ' -> ' + tgt, function () {
      var proj = geo.transform({source: src, target: tgt});

      function test_point(pt) {
        var pt1 = $.extend({}, pt[0]), pt2 = $.extend({}, pt[1]);
        it(str(pt[0]) + ' -> ' + str(pt[1]), function () {
          expect(r2(proj.forward(pt1), pt[1])).toBeLessThan(tgt_unit);
        });
        it(str(pt[0]) + ' <- ' + str(pt[1]), function () {
          expect(r2(pt[0], proj.inverse(pt2))).toBeLessThan(src_unit);
        });
      }

      pts.forEach(test_point);
      it('Array of points ( forward )', function () {
        var a = pts.map(function (d) { return $.extend({}, d[0]); }),
            c = proj.forward(a);
        pts.forEach(function (d, i) {
          expect(r2(d[1], c[i])).toBeLessThan(tgt_unit);
        });
      });
      it('Array of points ( inverse )', function () {
        var a = pts.map(function (d) { return $.extend({}, d[1]); }),
            c = proj.inverse(a);
        pts.forEach(function (d, i) {
          expect(r2(d[0], c[i])).toBeLessThan(src_unit);
        });
      });
    });
  }

  test_transform(
    'EPSG:4326', 1e-4, 'EPSG:3857', 10,
    [
      [{x: 0, y: 0}, {x: 0, y: 0}],
      [{x: 90, y: 45}, {x: 10018754, y: 5621521}],
      [{x: -90, y: -45}, {x: -10018754, y: -5621521}],
      [{x: -15, y: 85}, {x: -1669792, y: 19971868}],
      [{x: 15, y: -85}, {x: 1669792, y: -19971868}]
    ]
  );

  test_transform(
    'EPSG:4326', 1e-6, 'EPSG:4326', 1e-6,
    [
      [{x: 0, y: 0}, {x: 0, y: 0}],
      [{x: 90, y: 45}, {x: 90, y: 45}],
      [{x: -90, y: -45}, {x: -90, y: -45}],
      [{x: -15, y: 85}, {x: -15, y: 85}],
      [{x: 15, y: -85}, {x: 15, y: -85}]
    ]
  );

  test_transform(
    'EPSG:3857', 1, 'EPSG:3857', 1,
    [
      [{x: 0, y: 0}, {x: 0, y: 0}],
      [{x: 10018754, y: 5621521}, {x: 10018754, y: 5621521}],
      [{x: -10018754, y: -5621521}, {x: -10018754, y: -5621521}],
      [{x: -1669792, y: 19971868}, {x: -1669792, y: 19971868}],
      [{x: 1669792, y: -19971868}, {x: 1669792, y: -19971868}]
    ]
  );

  describe('defs', function () {
    var server;

    beforeEach(function () {
      server = sinon.fakeServer.create();
    });

    afterEach(function () {
      server.restore();
    });

    it('predefined definitions', function () {
      expect(geo.transform.defs.hasOwnProperty('EPSG:4326')).toBe(true);
      expect(geo.transform.defs.hasOwnProperty('EPSG:3857')).toBe(true);
    });

    it('custom definition', function () {
      geo.transform.defs('my projection', '+proj=longlat +datum=WGS84 +no_defs');
      expect(geo.transform.defs.hasOwnProperty('my projection')).toBe(true);
      var p = geo.transform({source: 'EPSG:4326', target: 'my projection'});

      expect(p.forward({x: 10, y: -10, z: 0})).toEqual({x: 10, y: -10, z: 0});
    });

    it('lookup', function (done) {
      var spy = sinon.spy(), request;
      geo.transform.lookup('EPSG:5000').then(spy);

      request = server.requests[0];
      expect(request.url).toMatch(/\?q=5000/);
      request.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({
        status: 'ok',
        number_result: 1,
        results: [{
          code: '5000',
          kind: 'CRS-PROJCRS',
          bbox: [
            85.06,
            180.0,
            85.06,
            180.0
          ],
          unit: 'degree',
          proj4: '+proj=longlat +datum=WGS84 +no_defs',
          name: 'WGS 84',
          area: 'World',
          default_trans: 0,
          trans: [],
          accuracy: ''
        }]
      }));

      window.setTimeout(function () { // wait for the next time slice
        expect(spy.calledOnce).toBe(true);
        expect(geo.transform.defs.hasOwnProperty('EPSG:5000')).toBe(true);

        geo.transform.lookup('EPSG:5000');
        expect(server.requests.length).toBe(1);
        done();
      }, 0);
    });

    it('invalid projection code', function (done) {
      var spy = sinon.spy(), request;
      geo.transform.lookup('EPSG:5001').then(spy);

      request = server.requests[0];
      request.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({
        status: 'ok',
        number_result: 0,
        results: []
      }));

      window.setTimeout(function () { // wait for the next time slice
        expect(spy.calledOnce).toBe(true);
        expect(geo.transform.defs.hasOwnProperty('EPSG:5001')).toBe(false);
        done();
      }, 0);
    });

    it('unknown projection type', function () {
      var spy = sinon.spy();
      geo.transform.lookup('unknown:5002').fail(spy);

      expect(spy.calledOnce).toBe(true);
      expect(geo.transform.defs.hasOwnProperty('unknown:5002')).toBe(false);
    });
  });

  describe('transform cache', function () {
    it('cache is used', function () {
      var trans = geo.transform({source: 'EPSG:4326', target: 'EPSG:3857'});
      expect(geo.transform({source: 'EPSG:4326', target: 'EPSG:3857'})).toBe(trans);
    });
    it('cache is cleared for targets', function () {
      var trans = geo.transform({source: 'EPSG:4326', target: 'EPSG:3857'});
      for (var i = 0; i < 10; i += 1) {
        var target = '+proj=eqc +ellps=GRS80 +lat_0=0 +lat_ts=' + i + ' +lon_0=0 +no_defs +towgs84=0,0,0,0,0,0,0 +units=m +x_0=0 +y_0=0';
        geo.transform({source: 'EPSG:4326', target: target});
      }
      expect(geo.transform({source: 'EPSG:4326', target: 'EPSG:3857'})).not.toBe(trans);
    });
    it('cache is cleared for sources', function () {
      var trans = geo.transform({source: 'EPSG:4326', target: 'EPSG:3857'});
      for (var i = 0; i < 10; i += 1) {
        var source = '+proj=eqc +ellps=GRS80 +lat_0=0 +lat_ts=' + i + ' +lon_0=0 +no_defs +towgs84=0,0,0,0,0,0,0 +units=m +x_0=0 +y_0=0';
        geo.transform({source: source, target: 'EPSG:3857'});
      }
      expect(geo.transform({source: 'EPSG:4326', target: 'EPSG:3857'})).not.toBe(trans);
    });
  });

  describe('transformCoordinates', function () {
    var source = '+proj=longlat +axis=esu',
        target = '+proj=longlat +axis=enu';
    it('identity', function () {
      var coor = {x: 1, y: 2, z: 3};
      expect(geo.transform.transformCoordinates(
        'EPSG:4326', 'EPSG:4326', coor)).toBe(coor);
    });
    it('bad parameters', function () {
      expect(function () {
        geo.transform.transformCoordinates(source, target, undefined);
      }).toThrow(new Error('Coordinates are not valid'));
      expect(function () {
        geo.transform.transformCoordinates(source, target, [[1], [2], [3]]);
      }).toThrow(new Error('Invalid coordinates. Requires two or three components per array'));
      expect(function () {
        geo.transform.transformCoordinates(source, target, [1, 2, 3, 4, 5], 5);
      }).toThrow(new Error('Number of components should be two or three'));
      expect(function () {
        geo.transform.transformCoordinates(source, target, [1, 2, 3, 4, 5]);
      }).toThrow(new Error('Invalid coordinates'));
      expect(function () {
        geo.transform.transformCoordinates(source, target, [{z: 5}]);
      }).toThrow(new Error('Invalid coordinates'));
    });
    it('coordinate format - single object', function () {
      expect(closeToEqual(geo.transform.transformCoordinates(source, target, {x: 1, y: 2}), {x: 1, y: -2})).toBe(true);
      expect(closeToEqual(geo.transform.transformCoordinates(source, target, {x: 3, y: 4, z: 5}), {x: 3, y: -4, z: 5})).toBe(true);
    });
    it('empty array', function () {
      var res = geo.transform.transformCoordinates(source, target, []);
      expect(res instanceof Array).toBe(true);
      expect(res.length).toBe(0);
    });
    it('coordinate format - array with single object', function () {
      var res;
      res = geo.transform.transformCoordinates(source, target, [{x: 1, y: 2}]);
      expect(res instanceof Array).toBe(true);
      expect(res.length).toBe(1);
      expect(closeToEqual(res[0], {x: 1, y: -2})).toBe(true);
      res = geo.transform.transformCoordinates(source, target, [{x: 3, y: 4, z: 5}]);
      expect(res instanceof Array).toBe(true);
      expect(res.length).toBe(1);
      expect(closeToEqual(res[0], {x: 3, y: -4, z: 5})).toBe(true);
    });
    it('coordinate format - single array', function () {
      expect(closeToArray(geo.transform.transformCoordinates(source, target, [1, 2]), [1, -2])).toBe(true);
      expect(closeToArray(geo.transform.transformCoordinates(source, target, [3, 4, 5]), [3, -4, 5])).toBe(true);
      expect(closeToArray(geo.transform.transformCoordinates(source, target, [1, 2, 3, 4, 5, 6], 2), [1, -2, 3, -4, 5, -6])).toBe(true);
      expect(closeToArray(geo.transform.transformCoordinates(source, target, [1, 2, 3, 4, 5, 6], 3), [1, -2, 3, 4, -5, 6])).toBe(true);
    });
    it('coordinate format - array of arrays', function () {
      var res;
      res = geo.transform.transformCoordinates(source, target, [[1, 2], [3, 4], [5, 6]]);
      expect(res.length).toBe(3);
      expect(closeToArray(res[0], [1, -2])).toBe(true);
      expect(closeToArray(res[1], [3, -4])).toBe(true);
      expect(closeToArray(res[2], [5, -6])).toBe(true);
      res = geo.transform.transformCoordinates(source, target, [[1, 2, 3], [4, 5, 6]]);
      expect(res.length).toBe(2);
      expect(closeToArray(res[0], [1, -2, 3])).toBe(true);
      expect(closeToArray(res[1], [4, -5, 6])).toBe(true);
    });
    it('coordinate format - array of objects', function () {
      var res;
      res = geo.transform.transformCoordinates(source, target, [{x: 1, y: 2}, {x: 3, y: 4}, {x: 5, y: 6}]);
      expect(res.length).toBe(3);
      expect(closeToEqual(res[0], {x: 1, y: -2})).toBe(true);
      expect(closeToEqual(res[1], {x: 3, y: -4})).toBe(true);
      expect(closeToEqual(res[2], {x: 5, y: -6})).toBe(true);
      res = geo.transform.transformCoordinates(source, target, [{x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6}]);
      expect(res.length).toBe(2);
      expect(closeToEqual(res[0], {x: 1, y: -2, z: 3})).toBe(true);
      expect(closeToEqual(res[1], {x: 4, y: -5, z: 6})).toBe(true);
    });
  });

  describe('affine functions', function () {
    it('affineForward', function () {
      var coor, res;
      coor = [{x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6}];
      res = geo.transform.affineForward({origin: {x: 0, y: 0}}, coor);
      expect(coor).toEqual(res);
      expect(res.length).toBe(2);
      expect(res[0]).toEqual({x: 1, y: 2, z: 3});
      expect(res[1]).toEqual({x: 4, y: 5, z: 6});
      coor = [{x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6}];
      res = geo.transform.affineForward({origin: {x: -2, y: -3}}, coor);
      expect(coor).toEqual(res);
      expect(res[0]).toEqual({x: 3, y: 5, z: 3});
      expect(res[1]).toEqual({x: 6, y: 8, z: 6});
      coor = [{x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6}];
      res = geo.transform.affineForward({origin: {x: -2, y: -3}, scale: {x: 2, y: 3, z: 4}}, coor);
      expect(coor).toEqual(res);
      expect(res[0]).toEqual({x: 6, y: 15, z: 12});
      expect(res[1]).toEqual({x: 12, y: 24, z: 24});
    });
    it('affineInverse', function () {
      var coor, res;
      coor = [{x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6}];
      res = geo.transform.affineInverse({origin: {x: 0, y: 0}}, coor);
      expect(coor).toEqual(res);
      expect(res.length).toBe(2);
      expect(res[0]).toEqual({x: 1, y: 2, z: 3});
      expect(res[1]).toEqual({x: 4, y: 5, z: 6});
      coor = [{x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6}];
      res = geo.transform.affineInverse({origin: {x: -2, y: -3}}, coor);
      expect(coor).toEqual(res);
      expect(res[0]).toEqual({x: -1, y: -1, z: 3});
      expect(res[1]).toEqual({x: 2, y: 2, z: 6});
      coor = [{x: 1, y: 2, z: 3}, {x: 4, y: 5, z: 6}];
      res = geo.transform.affineInverse({origin: {x: -2, y: -3}, scale: {x: 2, y: 3, z: 4}}, coor);
      expect(coor).toEqual(res);
      expect(res[0]).toEqual({x: -3 / 2, y: -7 / 3, z: 3 / 4});
      expect(res[1]).toEqual({x: 0, y: -4 / 3, z: 6 / 4});
    });
  });

  describe('vincentyDistance', function () {
    it('test distance measurement', function () {
      var result;
      result = geo.transform.vincentyDistance(
        {x: -71.0693514, y: 42.3541165},  // Boston
        {x: -73.9680804, y: 40.7791472}   // New York
      );
      expect(result.distance).toBeCloseTo(298396.057);
      expect(result.alpha1).toBeCloseTo(-2.180);
      expect(result.alpha2).toBeCloseTo(-2.213);
      expect(geo.transform.vincentyDistance(
        {x: -73.9680804, y: 40.7791472},
        {x: -71.0693514, y: 42.3541165}
      ).distance).toBeCloseTo(298396.057);
      result = geo.transform.vincentyDistance(
        {x: -74, y: 42},
        {x: -71, y: 42}
      );
      expect(result.alpha1).toBeCloseTo(1.553);
      expect(result.alpha2).toBeCloseTo(1.588);
      // test equal points
      expect(geo.transform.vincentyDistance(
        {x: -71.0693514, y: 42.3541165},
        {x: -71.0693514, y: 42.3541165}
      ).distance).toBe(0);
      // test convergence failure
      expect(geo.transform.vincentyDistance(
        {x: 0, y: 0},
        {x: -179.5, y: 0.5}
      )).toBe(undefined);
      expect(geo.transform.vincentyDistance(
        {x: 0, y: 0},
        {x: -179.5, y: 0.5},
        undefined, undefined, undefined, 200
      ).distance).toBeCloseTo(19936288.579);
      // test near-equator distances
      expect(geo.transform.vincentyDistance(
        {x: 0, y: 1e-7},
        {x: 90, y: 1e-7}
      ).distance).toBeCloseTo(geo.util.radiusEarth * Math.PI / 2);
      // test using a different ellipsoid
      expect(geo.transform.vincentyDistance(
        {x: -71.0693514, y: 42.3541165},
        {x: -73.9680804, y: 40.7791472},
        'EPSG:4326',
        '+proj=longlat +ellps=clrk66 +datum=NAD27 +no_defs',
        {a: 6378206.4, b: 6356583.8}
      ).distance).toBeCloseTo(298394.412);
    });
  });

  describe('sphericalDistance', function () {
    it('test distance measurement', function () {
      expect(geo.transform.sphericalDistance(
        {x: -71.0693514, y: 42.3541165},  // Boston
        {x: -73.9680804, y: 40.7791472}   // New York
      )).toBeCloseTo(298342.833);
      expect(geo.transform.sphericalDistance(
        {x: -73.9680804, y: 40.7791472},
        {x: -71.0693514, y: 42.3541165}
      )).toBeCloseTo(298342.833);
      // test equal points
      expect(geo.transform.sphericalDistance(
        {x: -71.0693514, y: 42.3541165},
        {x: -71.0693514, y: 42.3541165}
      )).toBe(0);
      // test near antipodal points
      expect(geo.transform.sphericalDistance(
        {x: 0, y: 0},
        {x: -179.5, y: 0.5}
      )).toBeCloseTo(19958794.076);
      // test near-equator distances
      expect(geo.transform.sphericalDistance(
        {x: 0, y: 1e-7},
        {x: 90, y: 1e-7}
      )).toBeCloseTo(geo.util.radiusEarth * Math.PI / 2);
      // test using a different ellipsoid
      expect(geo.transform.sphericalDistance(
        {x: -71.0693514, y: 42.3541165},
        {x: -73.9680804, y: 40.7791472},
        'EPSG:4326',
        '+proj=longlat +ellps=clrk66 +datum=NAD27 +no_defs',
        {a: 6378206.4, b: 6356583.8}
      )).toBeCloseTo(298340.559);
    });
  });
});
