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
      unitsPerPixel: o.unitsPerPixel || 10000,
      node: o.node || null
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
      },
      node: get_set('node')
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

  describe('toLevel/fromLevel', function () {
    it('round trip', function () {
      function check(p, lev) {
        var l = geo.tileLayer({map: map()}),
            p1 = l.toLevel($.extend({}, p), lev),
            p2 = l.fromLevel($.extend({}, p1), lev),
            p3 = l.toLevel($.extend({}, p2), lev);

        expect(norm(p2, p)).toBeLessThan(1e-10);
        expect(norm(p3, p1)).toBeLessThan(1e-10);
      }

      check({x: 10, y: 5}, 10);
      check({x: -5, y: 5}, 5);
      check({x: -1, y: -10}, 1);
      check({x: 100, y: -50}, 0);
    });
    it('toLevel at level 0', function () {
      function check(p) {
        var l = geo.tileLayer({map: map()}),
            p1 = l.toLevel($.extend({}, p), 0),
            p2 = l.fromLevel($.extend({}, p), 0);

        expect(norm(p1, p)).toBeLessThan(1e-10);
        expect(norm(p2, p)).toBeLessThan(1e-10);
      }
      check({x: 10, y: 5});
      check({x: -5, y: 5});
      check({x: -1, y: -10});
      check({x: 100, y: -50});
    });
    it('simple cases', function () {
      var l = geo.tileLayer({map: map()});

      expect(l.toLevel({x: 64, y: 64}, 2)).toEqual({x: 256, y: 256});
      expect(l.toLevel({x: 128, y: -256}, 1)).toEqual({x: 256, y: -512});
      expect(l.fromLevel({x: 512, y: 512}, 2)).toEqual({x: 128, y: 128});
      expect(l.fromLevel({x: 1024, y: -512}, 3)).toEqual({x: 128, y: -64});
    });
  });

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
  describe('Check class accessors', function () {
    var opts = {
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
    it('Check tileLayer options', function () {
      var m = map(), l;
      opts.map = m;
      l = geo.tileLayer(opts);
      expect(l.options).toEqual(opts);
    });
    it('Cache object', function () {
      var m = map(), l;
      opts.map = m;
      l = geo.tileLayer(opts);
      expect(l.cache.constructor).toBe(geo.tileCache);
      expect(l.cache.size).toBe(opts.cacheSize);
    });
    it('Active tiles', function () {
      var m = map(), l;
      opts.map = m;
      l = geo.tileLayer(opts);
      expect(l.activeTiles).toEqual({});
    });
  });
  describe('Public utility methods', function () {
    describe('isValid', function () {
      function checkValidTile(opts, index, valid, desc) {
        return [
          desc || JSON.stringify(index) + ' -> ' + (valid ? '' : 'not ') + 'valid',
          function () {
            var m = map(), l;
            opts.map = m;
            l = geo.tileLayer(opts);
            expect(l.isValid(index)).toBe(valid);
          }
        ];
      }

      var opts = {wrapX: false, wrapY: false, minLevel: 0, maxLevel: 10};
      describe(JSON.stringify(opts), function () {
        it.apply(it, checkValidTile(
          opts,
          {x: 0, y: 0, level: 0},
          true
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 1, y: 0, level: 0},
          false
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 0, y: 1, level: 0},
          false
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 0, y: 0, level: -1},
          false
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 0, y: 0, level: 11},
          false
        ));
      });

      opts = {wrapX: false, wrapY: false, minLevel: 1, maxLevel: 10};
      describe(JSON.stringify(opts), function () {
        it.apply(it, checkValidTile(
          opts,
          {x: 0, y: 0, level: 0},
          false
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 0, y: 0, level: 1},
          true
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 1, y: 1, level: 1},
          true
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 0, y: 15, level: 4},
          true
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 31, y: 15, level: 5},
          true
        ));
      });

      opts = {wrapX: true, wrapY: false, minLevel: 1, maxLevel: 1};
      describe(JSON.stringify(opts), function () {
        it.apply(it, checkValidTile(
          opts,
          {x: 10, y: 0, level: 1},
          true
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: -1, y: 0, level: 1},
          true
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 0, y: 3, level: 1},
          false
        ));
      });

      opts = {wrapX: false, wrapY: true, minLevel: 1, maxLevel: 1};
      describe(JSON.stringify(opts), function () {
        it.apply(it, checkValidTile(
          opts,
          {x: 0, y: 10, level: 1},
          true
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 0, y: -1, level: 1},
          true
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 3, y: 0, level: 1},
          false
        ));
      });

      opts = {wrapX: true, wrapY: true, minLevel: 1, maxLevel: 1};
      describe(JSON.stringify(opts), function () {
        it.apply(it, checkValidTile(
          opts,
          {x: 0, y: 0, level: 1},
          true
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 0, y: -1, level: 1},
          true
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 3, y: 0, level: 1},
          true
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 3, y: 0, level: 1},
          true
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: -1, y: 0, level: 1},
          true
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: -1, y: 3, level: 1},
          true
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 3, y: -1, level: 1},
          true
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 3, y: -1, level: 0},
          false
        ));
        it.apply(it, checkValidTile(
          opts,
          {x: 3, y: -1, level: 2},
          false
        ));
      });
    });
    describe('tilesAtZoom', function () {
      it('0', function () {
        var l = geo.tileLayer({map: map()});
        expect(l.tilesAtZoom(0)).toEqual({x: 1, y: 1});
      });
      it('10', function () {
        var l = geo.tileLayer({map: map()});
        expect(l.tilesAtZoom(10)).toEqual({x: 1024, y: 1024});
      });
    });
    it('prefetch', function (done) {
      var l = geo.tileLayer({map: map()}),
          d1 = new $.Deferred(),
          d2 = new $.Deferred();

      // replace the standard getTiles method to return our pseudo-tiles
      l._getTiles = function (level, bounds) {
        expect(level).toBe(1);
        expect(bounds).toEqual({
          left: 0, right: 1,
          bottom: 0, top: 1
        });
        return [
          {fetch: function () {
            window.setTimeout(function () {d1.resolve();}, 10); return d1;}
          },
          {fetch: function () {
            window.setTimeout(function () {d2.resolve();}, 5); return d2;}
          }
        ];
      };

      l.prefetch(1, {left: 0, right: 1, bottom: 0, top: 1}).then(done);
    });
  });
  describe('Protected utility methods', function () {
    describe('_origin', function () {
      it('default origin', function () {
        var l = geo.tileLayer({map: map()});
        expect(l._origin(0)).toEqual({
          index: {x: 0, y: 0},
          offset: {x: 0, y: 0}
        });
        expect(l._origin(5)).toEqual({
          index: {x: 0, y: 0},
          offset: {x: 0, y: 0}
        });
      });
      it('shifted origin', function () {
        var l = geo.tileLayer({map: map()});
        l.map().origin(
          l.fromLocal({x: 260, y: 510})
        );
        expect(l._origin(0)).toEqual({
          index: {x: 1, y: 1},
          offset: {x: 4, y: 254}
        });
        expect(l._origin(1)).toEqual({
          index: {x: 2, y: 3},
          offset: {x: 8, y: 252}
        });
      });
    });

    describe('_tileBounds', function () {
      function checkTileBounds(opts, origin, tileOpts, bounds) {
        return [
          JSON.stringify(tileOpts),
          function () {
            origin = $.extend({}, origin);
            opts.map = map();
            var l = geo.tileLayer(opts), tile = geo.tile(tileOpts);
            l.map().origin({x: 0, y: 0});
            l.map().origin(l.fromLocal(origin));
            expect(l._tileBounds(tile)).toEqual(bounds);
          }
        ];
      }

      var opts, tile, bounds, origin;

      opts = {
        tileWidth: 200,
        tileHeight: 200,
        tileOffset: function (l) {return 200 * Math.pow(2, l - 1);}
      };
      describe('default origin', function () {
        origin = {x: 0, y: 0};
        tile = {
          index: {x: 0, y: 0, level: 0},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: 0,
          right: 200,
          bottom: 0,
          top: 200
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));

        tile = {
          index: {x: -1, y: 1, level: 0},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: -200,
          right: 0,
          bottom: 200,
          top: 400
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));

        tile = {
          index: {x: 1, y: 0, level: 1},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: 200,
          right: 400,
          bottom: 0,
          top: 200
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));

        tile = {
          index: {x: 10, y: -1, level: 10},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: 2000,
          right: 2200,
          bottom: -200,
          top: 0
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));
      });

      describe('origin: (-200, 200)', function () {
        origin = {x: -200, y: 200};
        tile = {
          index: {x: 0, y: 0, level: 0},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: 200,
          right: 400,
          bottom: -200,
          top: 0
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));

        tile = {
          index: {x: -1, y: 1, level: 0},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: 0,
          right: 200,
          bottom: 0,
          top: 200
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));

        tile = {
          index: {x: -1, y: 1, level: 1},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: 200,
          right: 400,
          bottom: -200,
          top: 0
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));
      });

      describe('origin: (100, -100)', function () {
        origin = {x: 100, y: -100};
        tile = {
          index: {x: 0, y: 0, level: 0},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: -100,
          right: 100,
          bottom: 100,
          top: 300
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));

        tile = {
          index: {x: 1, y: 1, level: 0},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: 100,
          right: 300,
          bottom: 300,
          top: 500
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));

        tile = {
          index: {x: 1, y: -1, level: 1},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: 0,
          right: 200,
          bottom: 0,
          top: 200
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));
      });
    });

    it('_getTile', function () {
      var t, l = geo.tileLayer({
        map: map(),
        tileWidth: 110,
        tileHeight: 120,
        url: function (i) {return i;}
      });

      t = l._getTile({x: 1, y: 1, level: 0}, {x: 0, y: 0, level: 0});
      expect(t._url).toEqual({x: 0, y: 0, level: 0});
      expect(t.size).toEqual({x: 110, y: 120});
      expect(t.index).toEqual({x: 1, y: 1, level: 0});
    });

    it('_getTileCached', function () {
      var t0, t1, t2, l = geo.tileLayer({
        map: map(),
        tileWidth: 110,
        tileHeight: 120,
        url: function (i) {return i;}
      });

      t0 = l._getTile({x: 1, y: 1, level: 0}, {x: 0, y: 0, level: 0});
      t1 = l._getTileCached({x: 1, y: 1, level: 0}, {x: 0, y: 0, level: 0});
      expect(t0 !== t1).toBe(true);
      expect(
        l._getTileCached({x: 1, y: 1, level: 0}, {x: 0, y: 0, level: 0})
      ).toBe(t1);

      t2 = l._getTile({x: 1, y: 1, level: 0}, {x: 0, y: 0, level: 0});
      expect(t1 !== t2).toBe(true);

      expect(
        l._getTileCached({x: 1, y: 1, level: 0}, {x: 0, y: 0, level: 0})
      ).toBe(t1);
    });

    it('_tileHash', function () {
      var t, l = geo.tileLayer({
        map: map(),
        tileWidth: 110,
        tileHeight: 120,
        url: function (i) {return i;}
      });

      t = l._getTile({x: 1, y: 1, level: 0}, {x: 0, y: 0, level: 0});
      expect(
        l._tileHash({x: 1, y: 1, level: 0})
      ).toBe(t.toString());
    });

    describe('_getTileRange', function () {
      it('level 0', function () {
        var l = geo.tileLayer({
          map: map({unitsPerPixel: 1}),
          tileWidth: 256,
          tileHeight: 128
        }), b;

        b = l._getTileRange(0, {left: 0, right: 255, bottom: 0, top: 127});
        expect(b.start).toEqual({x: 0, y: 0});
        expect(b.end).toEqual({x: 0, y: 0});

        b = l._getTileRange(0, {left: -1, right: 256, bottom: -1, top: 128});
        expect(b.start).toEqual({x: -1, y: -1});
        expect(b.end).toEqual({x: 1, y: 1});

        b = l._getTileRange(0, {left: 50, right: 60, bottom: 50, top: 60});
        expect(b.start).toEqual({x: 0, y: 0});
        expect(b.end).toEqual({x: 0, y: 0});
      });

      it('level 1', function () {
        var l = geo.tileLayer({
          map: map({unitsPerPixel: 1}),
          tileWidth: 256,
          tileHeight: 128
        }), b;

        b = l._getTileRange(1, {left: 0, right: 255, bottom: 0, top: 127});
        expect(b.start).toEqual({x: 0, y: 0});
        expect(b.end).toEqual({x: 1, y: 1});

        b = l._getTileRange(1, {left: -1, right: 256, bottom: -1, top: 128});
        expect(b.start).toEqual({x: -1, y: -1});
        expect(b.end).toEqual({x: 2, y: 2});

        b = l._getTileRange(1, {left: 50, right: 60, bottom: 50, top: 70});
        expect(b.start).toEqual({x: 0, y: 0});
        expect(b.end).toEqual({x: 0, y: 1});
      });
    });

    describe('_loadMetric', function () {
      it('center (0, 0, 0)', function () {
        var m, l = geo.tileLayer({
          map: map()
        });

        m = l._loadMetric({x: 0, y: 0, level: 0});
        expect(m({x: 1, y: 1, level: 2}, {x: 2, y: 2, level: 2})).toBeLessThan(0);
        expect(m({x: 1, y: 1, level: 1}, {x: 2, y: 2, level: 2})).toBeGreaterThan(0);
        expect(m({x: 1, y: 1, level: 2}, {x: 0.5, y: 1.01, level: 2})).toBeGreaterThan(0);
      });

      it('center (1, 1, 1)', function () {
        var m, l = geo.tileLayer({
          map: map()
        });

        m = l._loadMetric({x: 1, y: 1, level: 1});
        expect(m({x: 1, y: 1, level: 2}, {x: 2, y: 2, level: 2})).toBeGreaterThan(0);
        expect(m({x: 1, y: 1, level: 1}, {x: 2, y: 2, level: 2})).toBeGreaterThan(0);
        expect(m({x: 1, y: 1, level: 2}, {x: 0.5, y: 1.01, level: 2})).toBeLessThan(0);
      });
    });

    describe('_isCovered', function () {
      function layer() {
        return geo.tileLayer({map: map(), url: function () {return '';}});
      }
      it('a tile does not cover itself', function () {
        var l = layer(), t;
        t = l._getTile({x: 1, y: 0, level: 1});
        l._setTileTree(l._getTile(t.index));
        expect(l._isCovered(t)).toBe(null);
        t = l._getTile({x: 2, y: -1, level: 2});
        l._setTileTree(l._getTile(t.index));
        expect(l._isCovered(t)).toBe(null);
      });
      it('a tile covers tiles at higher zoom levels', function () {
        var l = layer(), t1, t2;
        t1 = l._getTile({x: 0, y: 0, level: 1});
        l._setTileTree(t1);

        t2 = l._getTile({x: 0, y: 0, level: 2});
        expect(l._isCovered(t2)).toEqual([t1]);

        t2 = l._getTile({x: 1, y: 0, level: 2});
        expect(l._isCovered(t2)).toEqual([t1]);

        t2 = l._getTile({x: 0, y: 1, level: 2});
        expect(l._isCovered(t2)).toEqual([t1]);

        t2 = l._getTile({x: 1, y: 1, level: 2});
        expect(l._isCovered(t2)).toEqual([t1]);

        t2 = l._getTile({x: 2, y: 1, level: 2});
        expect(l._isCovered(t2)).toBe(null);

        t2 = l._getTile({x: 0, y: 0, level: 0});
        expect(l._isCovered(t2)).toBe(null);
      });
      it('four tiles cover a tile at lower zoom levels', function () {
        var l = layer(), t1, t2, c;
        t1 = [
          l._getTile({x: 0, y: 0, level: 1}),
          l._getTile({x: 0, y: 1, level: 1}),
          l._getTile({x: 1, y: 0, level: 1}),
          l._getTile({x: 1, y: 1, level: 1})
        ];
        t1.forEach(function (t) {
          l._setTileTree(t);
        });

        t2 = l._getTile({x: 0, y: 0, level: 0});
        c = l._isCovered(t2);

        expect(c.indexOf(t1[0])).toBeGreaterThan(-1);
        expect(c.indexOf(t1[1])).toBeGreaterThan(-1);
        expect(c.indexOf(t1[2])).toBeGreaterThan(-1);
        expect(c.indexOf(t1[3])).toBeGreaterThan(-1);

        l._setTileTree(l._getTile({x: 2, y: 0}));
        l._setTileTree(l._getTile({x: 2, y: 1}));
        t2 = l._getTile({x: 1, y: 0, level: 0});
        expect(l._isCovered(t2)).toBe(null);
      });
    });
  });

  describe('_outOfBounds', function () {
    function layer() {
      return geo.tileLayer({map: map(), url: function () {return '';}});
    }
    var bounds = {
      left: 384,
      right: 896,
      bottom: 128,
      top: 512
    };
    it('tile above bounds', function () {
      var l = layer(), t;
      t = l._getTile({x: 2, y: 4});
      expect(l._outOfBounds(t, bounds)).toBe(true);
    });
    it('tile below bounds', function () {
      var l = layer(), t;
      t = l._getTile({x: 2, y: -2});
      expect(l._outOfBounds(t, bounds)).toBe(true);
    });
    it('tile left of bounds', function () {
      var l = layer(), t;
      t = l._getTile({x: -1, y: 1});
      expect(l._outOfBounds(t, bounds)).toBe(true);
    });
    it('tile right of bounds', function () {
      var l = layer(), t;
      t = l._getTile({x: 5, y: 1});
      expect(l._outOfBounds(t, bounds)).toBe(true);
    });
    it('tile completely inside bounds', function () {
      var l = layer(), t;
      t = l._getTile({x: 2, y: 1});
      expect(l._outOfBounds(t, bounds)).toBe(false);
    });
    it('tile partially inside bounds', function () {
      var l = layer(), t;
      t = l._getTile({x: 1, y: 0});
      expect(l._outOfBounds(t, bounds)).toBe(false);
    });
  });

  describe('HTML renderering', function () {
    function layer_html(opts) {
      var node = $('<div class=".geo-test-container" style="display: none"/>'), m, l;
      opts = opts || {};
      $('body').remove('.geo-test-container').append(node);
      m = map({node: node});
      opts.map = m;
      opts.renderer = null;
      l = geo.tileLayer(opts);
      l._init();
      return l;
    }

    it('tileLayer initialization', function () {
      var l = layer_html({maxLevel: 2}), node = l.canvas();

      expect(node.find('[data-tile-layer="0"]').length).toBe(1);
      expect(node.find('[data-tile-layer="1"]').length).toBe(1);
      expect(node.find('[data-tile-layer="2"]').length).toBe(1);
      expect(node.find('.geo-tile-layer').length).toBe(3);
    });

    it('_getSubLayer', function () {
      var l = layer_html(), node = l.canvas(), s;

      s = l._getSubLayer(0);
      expect(node.find(s).get(0)).toBe(s);
      expect(l._getSubLayer(0)).toBe(s);
      expect($(s).data('tile-layer')).toBe(0);
    });
  });
});
