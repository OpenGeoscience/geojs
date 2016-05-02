// Test geo.transform

describe('geo.transform', function () {
  'use strict';

  var $ = require('jquery');
  var geo = require('../test-utils').geo;

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

    it('lookup', function () {
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

      expect(spy.calledOnce).toBe(true);
      expect(geo.transform.defs.hasOwnProperty('EPSG:5000')).toBe(true);

      geo.transform.lookup('EPSG:5000');
      expect(server.requests.length).toBe(1);
    });

    it('invalid projection code', function () {
      var spy = sinon.spy(), request;
      geo.transform.lookup('EPSG:5001').fail(spy);

      request = server.requests[0];
      request.respond(200, {'Content-Type': 'application/json'}, JSON.stringify({
        status: 'ok',
        number_result: 0,
        results: []
      }));

      expect(spy.calledOnce).toBe(true);
      expect(geo.transform.defs.hasOwnProperty('EPSG:5001')).toBe(false);
    });

    it('unknown projection type', function () {
      var spy = sinon.spy();
      geo.transform.lookup('unknown:5002').fail(spy);

      expect(spy.calledOnce).toBe(true);
      expect(geo.transform.defs.hasOwnProperty('unknown:5002')).toBe(false);
    });
  });
});
