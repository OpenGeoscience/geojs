// Test geo.tileLayer

describe('geo.tileLayer', function () {
  'use strict';

  var $ = require('jquery');
  var geo = require('../test-utils').geo;
  var closeToEqual = require('../test-utils').closeToEqual;
  var _tileLayer = geo.tileLayer;

  /*
   * Use html rendering for all of these tests.  That is what is occuring
   * in phantomjs in any case.  This also reduces the console pollution.
   * Renderer specific tests currently are handled in osmLayer.js.
   */
  beforeEach(function () {
    geo.tileLayer = function (opts) {
      opts = opts || {};
      opts.renderer = null;
      return _tileLayer(opts);
    };
  });
  afterEach(function () {
    geo.tileLayer = _tileLayer;
  });

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
      gcs: function () {
        return o.gcs ? o.gcs : '+proj=longlat +axis=esu';
      },
      ingcs: function () {
        return o.ingcs ? o.ingcs : '+proj=longlat +axis=enu';
      },
      updateAttribution: function () {
      },
      bounds: function () {
      },
      node: get_set('node'),
      children: function () {
        return [];
      },
      timesDrawn: 0,
      draw: function () {
        this.timesDrawn += 1;
      }
    };
  };

  describe('tileAtPoint', function () {

    function get_layer(origin) {
      var opts = {},
          m = map(opts),
          l = geo.tileLayer({map: m, topDown: true}),
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

    it('Should not depend on map origin', function () {
      function check(p) {
        var p1, p2, q1, q2;
        var m = map();
        var l = geo.tileLayer({map: m});
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
      keepLower: true,
      wrapX: false,
      wrapY: true,
      url: function () {},
      subdomains: ['1', '2', '3'],
      animationDuration: 10,
      tileRounding: function () {},
      attribution: 'My awesome layer',
      tileOffset: function () {},
      topDown: true,
      tilesAtZoom: function (level) {
        var s = Math.pow(2, level);
        return {x: s, y: Math.ceil(s * 3 / 4)};
      },
      tilesMaxBounds: function () {}
    };
    opts.originalUrl = opts.url;
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
    it('url', function () {
      var m = map(), l, mtime, url = '/testdata/white.jpg';
      opts.map = m;
      l = geo.tileLayer(opts);
      expect(l.url() instanceof Function).toBe(true);
      mtime = l.map().timesDrawn;
      l.url(url);
      expect(l.url()).toBe(url);
      expect(l.map().timesDrawn).toBeGreaterThan(mtime);
      mtime = l.map().timesDrawn;
      /* Setting it to the same value shouldn't update the map. */
      l.url(url);
      expect(l.url()).toBe(url);
      expect(l.map().timesDrawn).toEqual(mtime);
      /* But a different url should */
      url += '?param=true';
      l.url(url);
      expect(l.url()).toBe(url);
      expect(l.map().timesDrawn).toBeGreaterThan(mtime);
    });
    it('subdomains', function () {
      var m = map(), l;
      opts.map = m;
      l = geo.tileLayer(opts);
      expect(l.subdomains()).toEqual(['1', '2', '3']);
      l.subdomains('abc');
      expect(l.subdomains()).toEqual(['a', 'b', 'c']);
      l.subdomains('12,3');
      expect(l.subdomains()).toEqual(['12', '3']);
      l.subdomains(['ab', 'c']);
      expect(l.subdomains()).toEqual(['ab', 'c']);
    });
    it('tilesAtZoom', function () {
      var m = map(), l;
      opts.map = m;
      l = geo.tileLayer(opts);
      expect(l.tilesAtZoom(0)).toEqual({x: 1, y: 1});
      expect(l.tilesAtZoom(1)).toEqual({x: 2, y: 2});
      expect(l.tilesAtZoom(2)).toEqual({x: 4, y: 3});
      expect(l.tilesAtZoom(3)).toEqual({x: 8, y: 6});
    });
    it('visible', function () {
      var m = map(), layer, count = 0;
      opts.map = m;
      layer = geo.tileLayer(opts);
      // check if we are updating by doing the least possible and tracking it
      layer._getTiles = function () {
        count += 1;
      };
      layer._updateSubLayers = undefined;

      expect(layer.visible()).toBe(true);
      layer._update();
      expect(count).toBe(1);
      expect(layer.visible(false)).toBe(layer);
      expect(layer.visible()).toBe(false);
      layer._update();
      expect(count).toBe(1);
      expect(layer.visible(true)).toBe(layer);
      expect(layer.visible()).toBe(true);
      expect(count).toBe(2);
      layer._update();
      expect(count).toBe(3);
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
    describe('cacheSize', function () {
      beforeEach(function () {
        sinon.stub(console, 'log', function () {});
      });
      afterEach(function () {
        console.log.restore();
      });
      it('auto increase', function () {
        var l = geo.tileLayer({
          cacheSize: 2,
          map: map({unitsPerPixel: 1}),
          topDown: true,
          wrapX: false,
          wrapY: false,
          url: function () { return '/testdata/white.jpg'; }
        });
        expect(l.cache.size).toBe(2);

        l._getTiles(0, {left: 0, top: 0, right: 512, bottom: 512}, true);
        expect(l.cache.size).toBe(2);
        l._getTiles(1, {left: 0, top: 0, right: 512, bottom: 512}, true);
        expect(l.cache.size).toBe(5);
        l._getTiles(0, {left: 0, top: 0, right: 512, bottom: 512}, true);
        expect(l.cache.size).toBe(5);
        expect(console.log.calledOnce).toBe(true);
        expect(console.log.calledWith('Increasing cache size to 5')).toBe(true);

      });
    });
    it('prefetch', function (done) {
      var l = geo.tileLayer({map: map(), url: function () { return '/testdata/white.jpg'; }}),
          d1 = $.Deferred(),
          d2 = $.Deferred();

      // replace the standard getTiles method to return our pseudo-tiles
      l._getTiles = function (level, bounds) {
        expect(level).toBe(1);
        expect(bounds).toEqual({
          left: 0,
          right: 1,
          bottom: 0,
          top: 1
        });
        return [
          {fetch: function () {
            window.setTimeout(function () { d1.resolve(); }, 10);
            return d1;
          }},
          {fetch: function () {
            window.setTimeout(function () { d2.resolve(); }, 5);
            return d2;
          }}
        ];
      };

      l.prefetch(1, {left: 0, right: 1, bottom: 0, top: 1}).then(done);
    });
    describe('gcsTileBounds', function () {
      it('level 0 tile is the world', function () {
        var m = map(), l;
        l = geo.tileLayer({map: m});
        expect(l.gcsTileBounds({level: 0, x: 0, y: 0})).toEqual({
          left: 0, top: 0, right: 2560000, bottom: 2560000});
        expect(closeToEqual(l.gcsTileBounds({level: 0, x: 0, y: 0}, null), {
          left: 0, top: 0, right: 2560000, bottom: -2560000})).toBe(true);
        expect(closeToEqual(l.gcsTileBounds(
           {level: 0, x: 0, y: 0}, '+proj=longlat +axis=wnu'), {
             left: 0, top: 0, right: -2560000, bottom: 2560000})).toBe(true);
      });
      it('level 3 tiles', function () {
        var m = map(), l;
        l = geo.tileLayer({map: m});
        expect(l.gcsTileBounds({level: 3, x: 0, y: 0})).toEqual({
          left: 0, top: 0, right: 320000, bottom: 320000});
        expect(l.gcsTileBounds({level: 3, x: 7, y: 0})).toEqual({
          left: 2240000, top: 0, right: 2560000, bottom: 320000});
        expect(l.gcsTileBounds({level: 3, x: 7, y: 7})).toEqual({
          left: 2240000, top: 2240000, right: 2560000, bottom: 2560000});
        expect(l.gcsTileBounds({level: 3, x: 3, y: 4})).toEqual({
          left: 960000, top: 1280000, right: 1280000, bottom: 1600000});
      });
      it('transform', function () {
        var mapOpts = {
          unitsPerPixel: 156543,
          ingcs: 'EPSG:4326',
          gcs: 'EPSG:3857',
          maxBounds: {
            left: -20037508, top: 20037508, right: 20037508, bottom: -20037508},
          center: {x: 0, y: 0},
          max: 5
        };
        var m = map(mapOpts), l;
        l = geo.tileLayer({map: m});
        expect(closeToEqual(l.gcsTileBounds(
           {level: 2, x: 0, y: 0}), {
             left: 0, top: 0, right: 90, bottom: -66.51})).toBe(true);
        expect(closeToEqual(l.gcsTileBounds(
           {level: 2, x: 0, y: 0}, 'EPSG:4326'), {
             left: 0, top: 0, right: 90, bottom: -66.51})).toBe(true);
        expect(closeToEqual(l.gcsTileBounds(
           {level: 2, x: 1, y: 1}, 'EPSG:4269'), {
             left: 90, top: -66.51, right: 180, bottom: -85.05})).toBe(true);
      });
    });
    describe('tileCropFromBounds and tilesMaxBounds', function () {
      var w = 5602, h = 4148,
          mapOpts = {
            unitsPerPixel: Math.pow(2, 5),
            ingcs: '+proj=longlat +axis=esu',
            gcs: '+proj=longlat +axis=enu',
            maxBounds: {left: 0, top: 0, right: w, bottom: h},
            center: {x: w / 2, y: h / 2},
            max: 5
          },
          layerOpts = {
            url: 'ignored',
            maxLevel: 5,
            tileOffset: function () { return {x: 0, y: 0}; },
            tilesAtZoom: function (level) {
              var scale = Math.pow(2, 5 - level);
              return {
                x: Math.ceil(w / 256 / scale),
                y: Math.ceil(h / 256 / scale)
              };
            }
          };
      it('default', function () {
        var layer = geo.tileLayer($.extend({}, layerOpts, {
          map: map(mapOpts)
        }));
        expect(layer.tilesMaxBounds(0)).toBe(null);

        var tile = layer._getTileCached({x: 21, y: 16, level: 5});
        expect(layer.tileCropFromBounds(tile)).toBe(undefined);
      });
      it('with bounds', function () {
        var tile;
        var layer = geo.tileLayer($.extend({}, layerOpts, {
          map: map(mapOpts),
          tilesMaxBounds: function (level) {
            var scale = Math.pow(2, 5 - level);
            return {
              x: Math.floor(w / scale),
              y: Math.floor(h / scale)
            };
          }
        }));
        expect(layer.tilesMaxBounds(0)).toEqual({x: 175, y: 129});
        expect(layer.tilesMaxBounds(5)).toEqual({x: w, y: h});

        tile = layer._getTileCached({x: 21, y: 16, level: 5});
        expect(layer.tileCropFromBounds(tile)).toEqual({x: 226, y: 52});

        tile = layer._getTileCached({x: 4, y: 16, level: 5});
        expect(layer.tileCropFromBounds(tile)).toEqual({x: 256, y: 52});

        tile = layer._getTileCached({x: 21, y: 6, level: 5});
        expect(layer.tileCropFromBounds(tile)).toEqual({x: 226, y: 256});

        tile = layer._getTileCached({x: 5, y: 4, level: 3});
        expect(layer.tileCropFromBounds(tile)).toEqual({x: 120, y: 13});

        tile = layer._getTileCached({x: 0, y: 0, level: 0});
        expect(layer.tileCropFromBounds(tile)).toEqual({x: 175, y: 129});
      });
    });
  });
  describe('Protected utility methods', function () {
    describe('_origin', function () {
      it('default origin', function () {
        var l = geo.tileLayer({map: map(), topDown: true});
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
        var l = geo.tileLayer({map: map(), topDown: true});
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
        tileOffset: function (l) { return 200 * Math.pow(2, l - 1); }
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
          bottom: 200,
          top: 0
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));

        tile = {
          index: {x: -1, y: 1, level: 0},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: -200,
          right: 0,
          bottom: 400,
          top: 200
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));

        tile = {
          index: {x: 1, y: 0, level: 1},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: 200,
          right: 400,
          bottom: 200,
          top: 0
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));

        tile = {
          index: {x: 10, y: -1, level: 10},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: 2000,
          right: 2200,
          bottom: 0,
          top: -200
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
          bottom: 0,
          top: -200
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));

        tile = {
          index: {x: -1, y: 1, level: 0},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: 0,
          right: 200,
          bottom: 200,
          top: 0
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));

        tile = {
          index: {x: -1, y: 1, level: 1},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: 200,
          right: 400,
          bottom: 0,
          top: -200
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
          bottom: 300,
          top: 100
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));

        tile = {
          index: {x: 1, y: 1, level: 0},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: 100,
          right: 300,
          bottom: 500,
          top: 300
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));

        tile = {
          index: {x: 1, y: -1, level: 1},
          size: {x: 200, y: 200}
        };
        bounds = {
          left: 0,
          right: 200,
          bottom: 200,
          top: 0
        };
        it.apply(it, checkTileBounds(opts, origin, tile, bounds));
      });
    });

    it('_getTile', function () {
      var lastThis;
      var t, l = geo.tileLayer({
            map: map(),
            tileWidth: 110,
            tileHeight: 120,
            url: function (x, y, z) {
              lastThis = this;
              return {x: x, y: y, level: z};
            }
          });
      t = l._getTile({x: 1, y: 1, level: 0}, {x: 0, y: 0, level: 0});
      expect(lastThis).toBe(l);
      expect(t._url).toEqual({x: 0, y: 0, level: 0});
      expect(t.size).toEqual({x: 110, y: 120});
      expect(t.index).toEqual({x: 1, y: 1, level: 0});
    });

    it('_getTileCached', function () {
      var t0, t1, t2, l = geo.tileLayer({
            map: map(),
            tileWidth: 110,
            tileHeight: 120,
            url: function (i) { return i; }
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
            url: function (i) { return i; }
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
              tileHeight: 128,
              topDown: true
            }), b;

        b = l._getTileRange(0, {left: 0, right: 255, bottom: 127, top: 0});
        expect(b.start).toEqual({x: 0, y: 0});
        expect(b.end).toEqual({x: 0, y: 0});

        b = l._getTileRange(0, {left: -1, right: 256, bottom: 128, top: -1});
        expect(b.start).toEqual({x: -1, y: -1});
        expect(b.end).toEqual({x: 1, y: 1});

        b = l._getTileRange(0, {left: 50, right: 60, bottom: 60, top: 50});
        expect(b.start).toEqual({x: 0, y: 0});
        expect(b.end).toEqual({x: 0, y: 0});
      });

      it('level 1', function () {
        var l = geo.tileLayer({
              map: map({unitsPerPixel: 1}),
              tileWidth: 256,
              tileHeight: 128,
              topDown: true
            }), b;

        b = l._getTileRange(1, {left: 0, right: 255, bottom: 127, top: 0});
        expect(b.start).toEqual({x: 0, y: 0});
        expect(b.end).toEqual({x: 1, y: 1});

        b = l._getTileRange(1, {left: -1, right: 256, bottom: 128, top: -1});
        expect(b.start).toEqual({x: -1, y: -1});
        expect(b.end).toEqual({x: 2, y: 2});

        b = l._getTileRange(1, {left: 50, right: 60, bottom: 70, top: 50});
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
        expect(m({x: 1, y: 1, level: 2}, {x: 3, y: 3, level: 2})).toBeLessThan(0);
        expect(m({x: 1, y: 1, level: 1}, {x: 3, y: 3, level: 2})).toBeLessThan(0);
        expect(m({x: 2, y: 2, level: 2}, {x: 1.5, y: 2.01, level: 2})).toBeGreaterThan(0);
      });

      it('center (1, 1, 1)', function () {
        var m, l = geo.tileLayer({
              map: map()
            });

        m = l._loadMetric({x: 1, y: 1, level: 1});
        expect(m({x: 1, y: 1, level: 2}, {x: 3, y: 3, level: 2})).toBeGreaterThan(0);
        expect(m({x: 1, y: 1, level: 1}, {x: 3, y: 3, level: 2})).toBeLessThan(0);
        expect(m({x: 2, y: 2, level: 2}, {x: 1.5, y: 2.01, level: 2})).toBeLessThan(0);
      });

      it('center (1.5, 1.5, 2, 1)', function () {
        var m, l = geo.tileLayer({
              map: map()
            });

        m = l._loadMetric({x: 1.5, y: 1.5, level: 2, bottomLevel: 1});
        expect(m({x: 1, y: 1, level: 2}, {x: 3, y: 3, level: 2})).toBeLessThan(0);
        expect(m({x: 1, y: 1, level: 1}, {x: 3, y: 3, level: 2})).toBeLessThan(0);
        expect(m({x: 1, y: 1, level: 0}, {x: 3, y: 3, level: 2})).toBeGreaterThan(0);
        expect(m({x: 2, y: 2, level: 2}, {x: 1.5, y: 2.01, level: 2})).toBeGreaterThan(0);
      });
    });

    describe('_isCovered', function () {
      function layer() {
        return geo.tileLayer({map: map(), keepLower: false, url: function () { return ''; }});
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

    describe('_canPurge', function () {
      it('covered tile', function () {
        var l = geo.tileLayer({map: map(), keepLower: false});
        l._isCovered = function () { return true; };
        l._outOfBounds = function () { return false; };
        expect(l._canPurge({index: {level: 0}}, {}, 1)).toBe(true);
      });
      it('covered tile at current zoom', function () {
        var l = geo.tileLayer({map: map()});
        l._isCovered = function () { return true; };
        l._outOfBounds = function () { return false; };
        expect(l._canPurge({index: {level: 1}}, {}, 1)).toBe(false);
      });
      it('out of bounds tile', function () {
        var l = geo.tileLayer({map: map(), keepLower: false});
        l._isCovered = function () { return false; };
        l._outOfBounds = function () { return true; };
        expect(l._canPurge({}, {})).toBe(true);
      });
      it('non-purgeable tile', function () {
        var l = geo.tileLayer({map: map(), keepLower: false});
        l._isCovered = function () { return false; };
        l._outOfBounds = function () { return false; };
        expect(l._canPurge({}, {})).toBe(false);
      });
      it('upper tile', function () {
        var l = geo.tileLayer({map: map(), keepLower: true});
        l._outOfBounds = function () { return false; };
        expect(l._canPurge({index: {level: 2}}, {}, 1)).toBe(true);
        expect(l._canPurge({index: {level: 0}}, {}, 1)).toBe(false);
      });
      it('no bounds', function () {
        var l = geo.tileLayer({map: map(), keepLower: false});
        l._isCovered = function () { return false; };
        l._outOfBounds = function () { return true; };
        expect(l._canPurge({})).toBe(false);
      });
      it('doneLoading', function () {
        var l = geo.tileLayer({map: map(), keepLower: false});
        l._isCovered = function () { return false; };
        l._outOfBounds = function () { return false; };
        expect(l._canPurge({index: {level: 0}}, {}, 1, false)).toBe(false);
        expect(l._canPurge({index: {level: 0}}, {}, 1, true)).toBe(true);
        expect(l._canPurge({index: {level: 1}}, {}, 1, false)).toBe(false);
        expect(l._canPurge({index: {level: 1}}, {}, 1, true)).toBe(false);
        expect(l._canPurge({index: {level: 2}}, {}, 1, true)).toBe(true);
        expect(l._canPurge({index: {level: 2}}, {}, 1, false)).toBe(false);
      });
    });

    describe('_outOfBounds', function () {
      function layer() {
        return geo.tileLayer({map: map(), url: function () { return ''; }});
      }
      var bounds = {
        left: 384,
        right: 896,
        bottom: 512,
        top: 128
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

    describe('_getTiles', function () {
      it('basic range query', function () {
        var tiles, l = geo.tileLayer({
              map: map({unitsPerPixel: 1}),
              wrapX: false,
              wrapY: false,
              topDown: true,
              url: function () { return '/testdata/white.jpg'; }
            });

        tiles = l._getTiles(1, {left: 50, right: 500, bottom: 500, top: 50}, true);
        expect(tiles.length).toBe(5);
        tiles.forEach(function (tile) {
          expect(l.isValid(tile.index)).toBe(true);
        });
      });
      it('basic range query with invalid tiles', function () {
        var tiles, l = geo.tileLayer({
              map: map({unitsPerPixel: 1}),
              wrapX: false,
              wrapY: false,
              topDown: true,
              url: function () { return '/testdata/white.jpg'; }
            });

        tiles = l._getTiles(0, {left: 50, right: 500, bottom: 500, top: 50});
        expect(tiles.length).toBe(1);
        expect(tiles[0].index.x).toEqual(0);
        expect(tiles[0].index.y).toEqual(0);
        expect(tiles[0].index.level).toEqual(0);
      });
      it('basic range query with wrapping in X', function () {
        var tiles, l = geo.tileLayer({
              map: map({unitsPerPixel: 1}),
              wrapX: true,
              wrapY: false,
              topDown: true,
              url: function () { return '/testdata/white.jpg'; }
            });

        tiles = l._getTiles(0, {left: 50, right: 500, bottom: 500, top: 50});
        expect(tiles.length).toBe(2);
        tiles.forEach(function (tile) {
          expect(tile.index.y).toBe(0);
          expect(tile.index.level).toBe(0);
        });
      });
      it('basic range query with wrapping in Y', function () {
        var tiles, l = geo.tileLayer({
              map: map({unitsPerPixel: 1}),
              wrapX: false,
              wrapY: true,
              topDown: true,
              url: function () { return '/testdata/white.jpg'; }
            });

        tiles = l._getTiles(0, {left: 50, right: 500, bottom: 500, top: 50});
        expect(tiles.length).toBe(2);
        tiles.forEach(function (tile) {
          expect(tile.index.x).toBe(0);
          expect(tile.index.level).toBe(0);
        });
      });
      it('basic range query with wrapping in X and Y', function () {
        var tiles, l = geo.tileLayer({
              map: map({unitsPerPixel: 1}),
              wrapX: true,
              wrapY: true,
              topDown: true,
              url: function () { return '/testdata/white.jpg'; }
            });

        tiles = l._getTiles(0, {left: 50, right: 500, bottom: 500, top: 50});
        expect(tiles.length).toBe(4);
        tiles.forEach(function (tile) {
          expect(tile.index.level).toBe(0);
        });
      });
      it('url templating', function () {
        /* eslint-disable no-template-curly-in-string */
        var urls = {
          's={s}&x={x}&y={y}&z={z}': ['a', 'b', 'c'],
          's=${S}&x=${X}&y=${Y}&z=${Z}': ['a', 'b', 'c'],
          's={s:abc}&x={x}&y={y}&z={z}': ['a', 'b', 'c'],
          's={a,b,c}&x={x}&y={y}&z={z}': ['a', 'b', 'c'],
          's={a-c}&x={x}&y={y}&z={z}': ['a', 'b', 'c'],
          's={c-a}&x={x}&y={y}&z={z}': ['a', 'b', 'c'],
          's=${s:1234}&x={x}&y={y}&z={z}': ['1', '2', '3', '4'],
          's=${1,2,3,4}&x={x}&y={y}&z={z}': ['1', '2', '3', '4'],
          's=${1-4}&x={x}&y={y}&z={z}': ['1', '2', '3', '4'],
          's={ab,bc,12}&x={x}&y={y}&z={z}': ['ab', 'bc', '12']
        };
        /* eslint-enable no-template-curly-in-string */
        var tiles, l = geo.tileLayer({
              map: map({unitsPerPixel: 1}),
              wrapX: false,
              wrapY: false,
              topDown: true
            });
        $.each(urls, function (url, subdomains) {
          l.url('/testdata/white.jpg?' + url);
          tiles = l._getTiles(1, {left: 50, right: 500, bottom: 500, top: 50});
          expect(tiles.length).toBe(5);
          tiles.forEach(function (tile) {
            expect($.inArray(tile._url.split('?s=')[1].split('&')[0],
                             subdomains)).toBeGreaterThan(-1);
            expect(tile._url.split('&x')[1]).toBe('=' + tile.index.x + '&y=' +
                tile.index.y + '&z=' + tile.index.level);
          });
        });
      });
      it('baseUrl', function () {
        var tiles, l = geo.tileLayer({
              map: map({unitsPerPixel: 1}),
              wrapX: false,
              wrapY: false,
              topDown: true,
              baseUrl: '/testdata/white.jpg?test='
            });

        tiles = l._getTiles(1, {left: 50, right: 500, bottom: 500, top: 50});
        expect(tiles.length).toBe(5);
        tiles.forEach(function (tile) {
          expect(tile._url.split('?test=')[1]).toBe('/' + tile.index.level +
              '/' + tile.index.x + '/' + tile.index.y + '.png');
        });
      });
    });
  });

  describe('HTML rendering', function () {
    afterAll(function () {
      $('.geo-test-container').remove();
    });

    function layer_html(opts) {
      var node = $('<div class="geo-test-container" style="display: none"/>'), m, l;
      opts = opts || {};
      $('.geo-test-container').remove();
      $('body').append(node);
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

    describe('drawTile', function () {
      function test_draw(tile) {
        var l = layer_html({url: function () { return '/testdata/white.jpg'; }});
        l.drawTile(l._getTileCached(tile));
        l.drawTile(l._getTileCached(tile)); // draw it twice, but should only add one
        return l;
      }

      function check_position(n, pos) {
        expect(n.css('left')).toBe(pos.left + 'px');
        expect(n.css('top')).toBe(pos.top + 'px');
      }

      it('{x: 0, y: 0, level: 0}', function () {
        var l = test_draw({x: 0, y: 0, level: 0}),
            c = l.canvas().find('.geo-tile-container');
        expect(c.length).toBe(1);
        expect(c.parent().data('tile-layer')).toBe(0);
        check_position(c, {left: 0, top: 0});
      });

      it('{x: 0, y: 0, level: 1}', function () {
        var l = test_draw({x: 0, y: 0, level: 1}),
            c = l.canvas().find('.geo-tile-container');
        expect(c.length).toBe(1);
        expect(c.parent().data('tile-layer')).toBe(1);
        check_position(c, {left: 0, top: 0});
      });

      it('{x: 1, y: 1, level: 1}', function () {
        var l = test_draw({x: 1, y: 1, level: 1}),
            c = l.canvas().find('.geo-tile-container');
        expect(c.length).toBe(1);
        expect(c.parent().data('tile-layer')).toBe(1);
        check_position(c, {left: 256, top: 256});
      });

      it('{x: 3, y: 2, level: 2}', function () {
        var l = test_draw({x: 3, y: 2, level: 2}),
            c = l.canvas().find('.geo-tile-container');
        expect(c.length).toBe(1);
        expect(c.parent().data('tile-layer')).toBe(2);
        check_position(c, {left: 768, top: 512});
      });

      it('remove', function () {
        var l = test_draw({x: 0, y: 0, level: 0}),
            c = l.canvas().find('.geo-tile-container'),
            t = l._getTileCached({x: 0, y: 0, level: 0});
        t.image = $('<img/>').get(0);
        c.append(t.image);
        l.remove(t);

        expect(l.canvas().find('.geo-tile-container').length).toBe(0);
        expect(Object.keys(l.activeTiles).length).toBe(0);
      });

      it('invalid tile url', function (done) {
        var server = sinon.fakeServer.create();
        var spy = sinon.spy();
        sinon.stub(console, 'warn', function () {});

        var l = layer_html({url: function () { return 'not a valid url'; }}), t;
        t = l._getTileCached({x: 0, y: 0, level: 0});
        t.image = $('<img src="/testdata/white.jpg"/>').get(0);
        l.drawTile(t);
        t.catch(spy);

        server.respond();
        window.setTimeout(function () { // wait for the next time slice
          expect(console.warn.calledOnce);
          expect(spy.calledOnce).toBe(true);
          expect(l.canvas().find('.geo-tile-container').length).toBe(0);
          server.restore();
          console.warn.restore();
          done();
        }, 0);
      });

      it('cropped tile', function () {
        var w = 5602, h = 4148;
        var l = layer_html({
          url: function () { return '/testdata/white.jpg'; },
          tilesMaxBounds: function (level) {
            var scale = Math.pow(2, 5 - level);
            return {
              x: Math.floor(w / scale),
              y: Math.floor(h / scale)
            };
          }
        });
        l.drawTile(l._getTileCached({x: 21, y: 16, level: 5}));
        var c = l.canvas().find('.geo-tile-container');
        expect(c.css('width')).toBe('226px');
        expect(c.css('height')).toBe('52px');
      });
    });

    describe('purging inactive tiles', function () {
      var server;

      function setup(bds, opts) {
        var l = layer_html($.extend(
            true, {url: function () { return '/testdata/white.jpg'; }}, opts || {}));
        l._getViewBounds = function () {
          return bds || {
            left: -50,
            right: 290,
            bottom: 300,
            top: 150
          };
        };
        return l;
      }

      beforeEach(function () {
        server = sinon.fakeServer.create({respondImmediately: true});
        sinon.stub(console, 'warn');
      });
      afterEach(function () {
        console.warn.restore();
        server.restore();
      });
      it('noop', function () {
        var l = setup(), active;
        l.drawTile(l._getTile({x: 0, y: 0, level: 0}));
        active = $.extend(true, {}, l.activeTiles);
        l._purge();
        expect(l.activeTiles).toEqual(active);
      });
      it('skip during update', function () {
        var l = setup(), active;
        l.drawTile(l._getTile({x: 2, y: 0, level: 1}));
        l._updating = true;
        active = $.extend(true, {}, l.activeTiles);
        l._purge();
        expect(l.activeTiles).toEqual(active);
      });
      it('out of bounds', function () {
        var l = setup();
        l.drawTile(l._getTile({x: 2, y: 0, level: 1}));
        $.extend(true, {}, l.activeTiles);
        l._purge();
        expect(l.activeTiles).toEqual({});
      });
      it('covered', function () {
        var bds = {
          left: -50,
          right: 290,
          bottom: 300,
          top: 150,
          level: 1
        };
        var l = setup(bds, {keepLower: false}), tiles, active;

        tiles = [
          l._getTileCached({x: 0, y: 0, level: 0}),
          l._getTileCached({x: 0, y: 0, level: 1}),
          l._getTileCached({x: 0, y: 1, level: 1}),
          l._getTileCached({x: 1, y: 0, level: 1}),
          l._getTileCached({x: 1, y: 1, level: 1})
        ];
        tiles.forEach(function (t) {
          l.drawTile(t);
          l._setTileTree(t);
        });
        l._purge(1);
        active = {};
        tiles.forEach(function (t) {
          if (t.index.level !== 0) {
            active[t.toString()] = t;
          }
        });

        expect(l.activeTiles).toEqual(active);
      });
    });
    it('clear all tiles', function () {
      var l = layer_html({url: function () { return '/testdata/white.jpg'; }}), tiles;

      tiles = [
        l._getTileCached({x: 0, y: 0, level: 0}),
        l._getTileCached({x: 0, y: 0, level: 1}),
        l._getTileCached({x: 0, y: 1, level: 1}),
        l._getTileCached({x: 1, y: 0, level: 1}),
        l._getTileCached({x: 1, y: 1, level: 1})
      ];
      tiles.forEach(function (t) {
        l.drawTile(t);
        l._setTileTree(t);
      });

      l.clear();
      expect(l.activeTiles).toEqual({});
      expect(l.cache.length).toBe(5);
    });
    it('reset the layer', function () {
      var l = layer_html({url: function () { return '/testdata/white.jpg'; }}), tiles;

      tiles = [
        l._getTileCached({x: 0, y: 0, level: 0}),
        l._getTileCached({x: 0, y: 0, level: 1}),
        l._getTileCached({x: 0, y: 1, level: 1}),
        l._getTileCached({x: 1, y: 0, level: 1}),
        l._getTileCached({x: 1, y: 1, level: 1})
      ];
      tiles.forEach(function (t) {
        l.drawTile(t);
        l._setTileTree(t);
      });

      l.reset();
      expect(l.activeTiles).toEqual({});
      expect(l.cache.length).toBe(0);
    });
  });

  it('Overloading draw method', function () {
    var l = geo.tileLayer({map: map(), url: function () { return '/testdata/white.jpg'; }}),
        called = 0;
    l._drawTile = function () { called += 1; };
    l.drawTile(l._getTile({x: 0, y: 0, level: 0}));
    expect(called).toBe(1);
  });
});
