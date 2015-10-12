// Test geo.tileLayer

/*global describe, it, expect, geo*/
describe('geo.tileLayer', function () {
  'use strict';

  // create a map-like object suitable for testing the tileLayer
  var map = function (o) {
    o = o || {};
    var _p = {
      size: o.size || {width: 100, height: 100},
      zoom: o.zoom || 0,
      center: o.center || {x: 0, y: 0},
      scale: o.scale || {x: 1, y: 1, z: 1},
      origin: o.origin || {x: 0, y: 0, z: 0},
      unitsPerPixel: o.unitsPerPixel || 10000
    };

    function copy(o) {
      if (o instanceof Object) {
        o = $.extend({}, o);
      }
      return o;
    }

    function get_set(prop) {
      return function (o) {
        if (o === undefined) {
          return copy(_p[prop]);
        }
        _p[prop] = copy(o);
        return this;
      };
    }

    return {
      size: get_set('size'),
      scale: get_set('scale'),
      zoom: get_set('zoom'),
      center: get_set('center'),
      origin: get_set('origin'),
      unitsPerPixel: function (zoom) {
        var u = get_set('unitsPerPixel')();
        return Math.pow(2, -(zoom || 0)) * u;
      },
      gcsToWorld: function (p) {
        return {
          x: (p.x + 1) * 1000,
          y: (p.y - 1) * 2000
        };
      },
      worldToGcs: function (p) {
        return {
          x: (p.x / 1000) - 1,
          y: (p.y / 2000) + 1
        };
      },
      gcsToDisplay: function (p) {
        return {
          x: p.x,
          y: p.y
        };
      },
      displayToGcs: function (p) {
        return {
          x: p.x,
          y: p.y
        };
      },
      updateAttribution: function () {
      }
    };
  };

  describe('tileAtPoint', function () {

    function get_layer(origin) {
      var opts = {},
          m = map(opts),
          l = geo.tileLayer({map: m}),
          s = m.unitsPerPixel();
      m.origin({
        x: origin.x * s,
        y: origin.y * s
      });
      return l;
    }

    describe('center: (0, 0)', function () {
      it('origin: (0, 0), zoom level: 0', function () {
        var l = get_layer({x: 0, y: 0}),
            s = l.map().unitsPerPixel();
        expect(l.tileAtPoint({x: 128 * s, y: 128 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 192 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 192 * s, y: 64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 192 * s, y: 192 * s}, 0)).toEqual({x: 0, y: 0});
      });

      it('origin: (0, 0), zoom level: 1', function () {
        var l = get_layer({x: 0, y: 0}),
            s = l.map().unitsPerPixel();
        expect(l.tileAtPoint({x: 64 * s, y: 64 * s}, 1)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 192 * s}, 1)).toEqual({x: 0, y: 1});
        expect(l.tileAtPoint({x: 192 * s, y: 64 * s}, 1)).toEqual({x: 1, y: 0});
        expect(l.tileAtPoint({x: 192 * s, y: 192 * s}, 1)).toEqual({x: 1, y: 1});
      });

      it('origin: (0, 0), zoom level: 18', function () {
        var t = Math.pow(2, -19) * 256,
            l = get_layer({x: 0, y: 0}),
            s = l.map().unitsPerPixel();
        expect(l.tileAtPoint({x: t * s, y: t * s}, 18)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: t * s, y: 3 * t * s}, 18)).toEqual({x: 0, y: 1});
        expect(l.tileAtPoint({x: 3 * t * s, y: t * s}, 18)).toEqual({x: 1, y: 0});
        expect(l.tileAtPoint({x: 3 * t * s, y: 3 * t * s}, 18)).toEqual({x: 1, y: 1});
        expect(l.tileAtPoint({x: 13 * t * s, y: 7 * t * s}, 18)).toEqual({x: 6, y: 3});
      });

      it('origin: (128, 128), zoom level: 0', function () {
        var l = get_layer({x: 128, y: 128}),
            s = l.map().unitsPerPixel();
        expect(l.tileAtPoint({x: 0 * s, y: 0 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: -64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: -64 * s, y: 64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: -64 * s, y: -64 * s}, 0)).toEqual({x: 0, y: 0});
      });

      it('origin: (128, 128), zoom level: 1', function () {
        var l = get_layer({x: 128, y: 128}),
            s = l.map().unitsPerPixel();
        expect(l.tileAtPoint({x: 64 * s, y: 64 * s}, 1)).toEqual({x: 1, y: 1});
        expect(l.tileAtPoint({x: 64 * s, y: -64 * s}, 1)).toEqual({x: 1, y: 0});
        expect(l.tileAtPoint({x: -64 * s, y: 64 * s}, 1)).toEqual({x: 0, y: 1});
        expect(l.tileAtPoint({x: -64 * s, y: -64 * s}, 1)).toEqual({x: 0, y: 0});
      });

      it('origin: (128, 128), zoom level: 18', function () {
        var t = Math.pow(2, -19) * 256,
            c = Math.pow(2, 17),
            l = get_layer({x: 128, y: 128}),
            s = l.map().unitsPerPixel();
        expect(l.tileAtPoint({x: t * s, y: t * s}, 18)).toEqual({x: c, y: c});
        expect(l.tileAtPoint({x: t * s, y: 3 * t * s}, 18)).toEqual({x: c, y: c + 1});
        expect(l.tileAtPoint({x: 3 * t * s, y: t * s}, 18)).toEqual({x: c + 1, y: c});
        expect(l.tileAtPoint({x: 3 * t * s, y: 3 * t * s}, 18))
          .toEqual({x: c + 1, y: c + 1});
        expect(l.tileAtPoint({x: 13 * t * s, y: 7 * t * s}, 18))
          .toEqual({x: c + 6, y: c + 3});
      });
    });
    describe('center: (1, -2)', function () {
      it('origin: (0, 0), zoom level: 0', function () {
        var l = get_layer({x: 0, y: 0}),
            s = l.map().unitsPerPixel();
        l.map().center({x: 1 * s, y: -2 * s});
        expect(l.tileAtPoint({x: 128 * s, y: 128 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 192 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 192 * s, y: 64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 192 * s, y: 192 * s}, 0)).toEqual({x: 0, y: 0});
      });

      it('origin: (0, 0), zoom level: 1', function () {
        var l = get_layer({x: 0, y: 0}),
            s = l.map().unitsPerPixel();
        l.map().center({x: 1 * s, y: -2 * s});
        expect(l.tileAtPoint({x: 64 * s, y: 64 * s}, 1)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 192 * s}, 1)).toEqual({x: 0, y: 1});
        expect(l.tileAtPoint({x: 192 * s, y: 64 * s}, 1)).toEqual({x: 1, y: 0});
        expect(l.tileAtPoint({x: 192 * s, y: 192 * s}, 1)).toEqual({x: 1, y: 1});
      });

      it('origin: (0, 0), zoom level: 18', function () {
        var t = Math.pow(2, -19) * 256,
            l = get_layer({x: 0, y: 0}),
            s = l.map().unitsPerPixel();
        l.map().center({x: 1 * s, y: -2 * s});
        expect(l.tileAtPoint({x: t * s, y: t * s}, 18)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: t * s, y: 3 * t * s}, 18)).toEqual({x: 0, y: 1});
        expect(l.tileAtPoint({x: 3 * t * s, y: t * s}, 18)).toEqual({x: 1, y: 0});
        expect(l.tileAtPoint({x: 3 * t * s, y: 3 * t * s}, 18)).toEqual({x: 1, y: 1});
        expect(l.tileAtPoint({x: 13 * t * s, y: 7 * t * s}, 18)).toEqual({x: 6, y: 3});
      });

      it('origin: (128, 128), zoom level: 0', function () {
        var l = get_layer({x: 128, y: 128}),
            s = l.map().unitsPerPixel();
        l.map().center({x: 1 * s, y: -2 * s});
        expect(l.tileAtPoint({x: 0 * s, y: 0 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: -64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: -64 * s, y: 64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: -64 * s, y: -64 * s}, 0)).toEqual({x: 0, y: 0});
      });

      it('origin: (128, 128), zoom level: 1', function () {
        var l = get_layer({x: 128, y: 128}),
            s = l.map().unitsPerPixel();
        l.map().center({x: 1 * s, y: -2 * s});
        expect(l.tileAtPoint({x: 64 * s, y: 64 * s}, 1)).toEqual({x: 1, y: 1});
        expect(l.tileAtPoint({x: 64 * s, y: -64 * s}, 1)).toEqual({x: 1, y: 0});
        expect(l.tileAtPoint({x: -64 * s, y: 64 * s}, 1)).toEqual({x: 0, y: 1});
        expect(l.tileAtPoint({x: -64 * s, y: -64 * s}, 1)).toEqual({x: 0, y: 0});
      });

      it('origin: (128, 128), zoom level: 18', function () {
        var t = Math.pow(2, -19) * 256,
            c = Math.pow(2, 17),
            l = get_layer({x: 128, y: 128}),
            s = l.map().unitsPerPixel();
        l.map().center({x: 1 * s, y: -2 * s});
        expect(l.tileAtPoint({x: t * s, y: t * s}, 18)).toEqual({x: c, y: c});
        expect(l.tileAtPoint({x: t * s, y: 3 * t * s}, 18)).toEqual({x: c, y: c + 1});
        expect(l.tileAtPoint({x: 3 * t * s, y: t * s}, 18)).toEqual({x: c + 1, y: c});
        expect(l.tileAtPoint({x: 3 * t * s, y: 3 * t * s}, 18))
          .toEqual({x: c + 1, y: c + 1});
        expect(l.tileAtPoint({x: 13 * t * s, y: 7 * t * s}, 18))
          .toEqual({x: c + 6, y: c + 3});
      });
    });
  });

  function norm(p, q) {
    var x, y;
    x = p.x - q.x;
    y = p.y - q.y;
    return Math.sqrt(x * x + y * y);
  }

  describe('toLocal/fromLocal', function () {
    var opts = {},
        m = map(opts),
        l = geo.tileLayer({map: m});

    it('Should not depend on map origin', function () {
      function check(p) {
        var p1, p2, q1, q2;
        m.origin({x: 0, y: 0});
        p1 = l.toLocal(p);
        q1 = l.fromLocal(p);

        m.origin({x: 11.993, y: -10001});
        p2 = l.toLocal(p);
        q2 = l.fromLocal(p);

        expect(norm(p1, p2)).toBeLessThan(1e-6);
        expect(norm(q1, q2)).toBeLessThan(1e-6);
      }

      check({x: 0, y: 0});
      check({x: 1, y: -1});
      check({x: 100000, y: -0.551});
    });

  });
  it('Check tileLayer options', function () {
    var m = map(), l, opts;
    opts = {
      map: m,
      minLevel: 2,
      maxLevel: 10,
      tileOverlap: 1,
      tileWidth: 128,
      tileHeight: 1024,
      cacheSize: 100,
      wrapX: false,
      wrapY: true,
      url: function () {},
      animationDuration: 10,
      tileRounding: function () {},
      attribution: 'My awesome layer',
      minX: -10,
      maxX: 5,
      minY: 100,
      maxY: 1000,
      tileOffset: function () {}
    };
    l = geo.tileLayer(opts);

    console.log(JSON.stringify(l.options, null, '  '));
    console.log(JSON.stringify(opts, null, '  '));
    expect(l.options).toEqual(opts);
  });
});
