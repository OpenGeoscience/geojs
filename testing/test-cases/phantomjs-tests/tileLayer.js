// Test geo.tileLayer

/*global describe, it, expect, geo*/
describe('geo.tileLayer', function () {
  'use strict';

  // create a map-like object suitable for testing the tileLayer
  var map = function (o) {
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
      unitsPerPixel: get_set('unitsPerPixel'),
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
      updateAttribution: function () {
      }
    };
  };

  describe('tileAtPoint', function () {
    describe('center: (0, 0)', function () {
      var opts = {},
          m = map(opts),
          l = geo.tileLayer({map: m}),
          s = m.unitsPerPixel();

      it('origin: (0, 0), zoom level: 0', function () {
        m.origin({x: 0, y: 0});
        expect(l.tileAtPoint({x: 128 * s, y: 128 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 192 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 192 * s, y: 64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 192 * s, y: 192 * s}, 0)).toEqual({x: 0, y: 0});
      });

      it('origin: (0, 0), zoom level: 1', function () {
        m.origin({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 64 * s}, 1)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 192 * s}, 1)).toEqual({x: 0, y: 1});
        expect(l.tileAtPoint({x: 192 * s, y: 64 * s}, 1)).toEqual({x: 1, y: 0});
        expect(l.tileAtPoint({x: 192 * s, y: 192 * s}, 1)).toEqual({x: 1, y: 1});
      });

      it('origin: (0, 0), zoom level: 18', function () {
        var t = Math.pow(2, -19) * 256;
        m.origin({x: 0, y: 0});
        expect(l.tileAtPoint({x: t * s, y: t * s}, 18)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: t * s, y: 3 * t * s}, 18)).toEqual({x: 0, y: 1});
        expect(l.tileAtPoint({x: 3 * t * s, y: t * s}, 18)).toEqual({x: 1, y: 0});
        expect(l.tileAtPoint({x: 3 * t * s, y: 3 * t * s}, 18)).toEqual({x: 1, y: 1});
        expect(l.tileAtPoint({x: 13 * t * s, y: 7 * t * s}, 18)).toEqual({x: 6, y: 3});
      });

      it('origin: (128, 128), zoom level: 0', function () {
        m.origin({x: 128 * s, y: 128 * s});
        expect(l.tileAtPoint({x: 0 * s, y: 0 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: -64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: -64 * s, y: 64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: -64 * s, y: -64 * s}, 0)).toEqual({x: 0, y: 0});
      });

      it('origin: (128, 128), zoom level: 1', function () {
        m.origin({x: 128 * s, y: 128 * s});
        expect(l.tileAtPoint({x: 64 * s, y: 64 * s}, 1)).toEqual({x: 1, y: 1});
        expect(l.tileAtPoint({x: 64 * s, y: -64 * s}, 1)).toEqual({x: 1, y: 0});
        expect(l.tileAtPoint({x: -64 * s, y: 64 * s}, 1)).toEqual({x: 0, y: 1});
        expect(l.tileAtPoint({x: -64 * s, y: -64 * s}, 1)).toEqual({x: 0, y: 0});
      });

      it('origin: (128, 128), zoom level: 18', function () {
        var t = Math.pow(2, -19) * 256,
            c = Math.pow(2, 17);
        m.origin({x: 128 * s, y: 128 * s});
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
      var opts = {},
          m = map(opts),
          l = geo.tileLayer({map: m}),
          s = m.unitsPerPixel();

      m.center({x: 1 * s, y: -2 * s});
      it('origin: (0, 0), zoom level: 0', function () {
        m.origin({x: 0, y: 0});
        expect(l.tileAtPoint({x: 128 * s, y: 128 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 192 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 192 * s, y: 64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 192 * s, y: 192 * s}, 0)).toEqual({x: 0, y: 0});
      });

      it('origin: (0, 0), zoom level: 1', function () {
        m.origin({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 64 * s}, 1)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 192 * s}, 1)).toEqual({x: 0, y: 1});
        expect(l.tileAtPoint({x: 192 * s, y: 64 * s}, 1)).toEqual({x: 1, y: 0});
        expect(l.tileAtPoint({x: 192 * s, y: 192 * s}, 1)).toEqual({x: 1, y: 1});
      });

      it('origin: (0, 0), zoom level: 18', function () {
        var t = Math.pow(2, -19) * 256;
        m.origin({x: 0, y: 0});
        expect(l.tileAtPoint({x: t * s, y: t * s}, 18)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: t * s, y: 3 * t * s}, 18)).toEqual({x: 0, y: 1});
        expect(l.tileAtPoint({x: 3 * t * s, y: t * s}, 18)).toEqual({x: 1, y: 0});
        expect(l.tileAtPoint({x: 3 * t * s, y: 3 * t * s}, 18)).toEqual({x: 1, y: 1});
        expect(l.tileAtPoint({x: 13 * t * s, y: 7 * t * s}, 18)).toEqual({x: 6, y: 3});
      });

      it('origin: (128, 128), zoom level: 0', function () {
        m.origin({x: 128 * s, y: 128 * s});
        expect(l.tileAtPoint({x: 0 * s, y: 0 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: 64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: 64 * s, y: -64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: -64 * s, y: 64 * s}, 0)).toEqual({x: 0, y: 0});
        expect(l.tileAtPoint({x: -64 * s, y: -64 * s}, 0)).toEqual({x: 0, y: 0});
      });

      it('origin: (128, 128), zoom level: 1', function () {
        m.origin({x: 128 * s, y: 128 * s});
        expect(l.tileAtPoint({x: 64 * s, y: 64 * s}, 1)).toEqual({x: 1, y: 1});
        expect(l.tileAtPoint({x: 64 * s, y: -64 * s}, 1)).toEqual({x: 1, y: 0});
        expect(l.tileAtPoint({x: -64 * s, y: 64 * s}, 1)).toEqual({x: 0, y: 1});
        expect(l.tileAtPoint({x: -64 * s, y: -64 * s}, 1)).toEqual({x: 0, y: 0});
      });

      it('origin: (128, 128), zoom level: 18', function () {
        var t = Math.pow(2, -19) * 256,
            c = Math.pow(2, 17);
        m.origin({x: 128 * s, y: 128 * s});
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
});
