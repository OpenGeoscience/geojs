// Test geo.tile

/*global describe, it, expect, geo*/
describe('geo.tile', function () {
  'use strict';

  // test tile hash values
  it('hashing', function () {
    var t1 = geo.tile({
      index: {x: 13, y: 14},
      size: {x: 116, y: 117}
    });
    var t2 = geo.tile({
      index: {x: 12, y: 14},
      size: {x: 116, y: 117}
    });
    var t3 = geo.tile({
      index: {x: 13, y: 14, level: 1},
      size: {x: 116, y: 117}
    });

    // stability, hopefully...
    expect(t1.toString()).toEqual(t1.toString());
    expect(t2.toString()).toEqual(t2.toString());
    expect(t3.toString()).toEqual(t3.toString());

    // uniqueness
    expect(t1.toString()).not.toEqual(t2.toString());
    expect(t1.toString()).not.toEqual(t3.toString());
    expect(t2.toString()).not.toEqual(t3.toString());
  });

  // test the all of the accessors work as expected
  it('accessors', function () {
    var t = geo.tile({
      index: {x: 13, y: 14},
      size: {x: 116, y: 117},
      url: '/data/sample.json',
      overlap: {x: 1, y: 3}
    });

    expect(t.index).toEqual({x: 13, y: 14});
    expect(t.size).toEqual({x: 116, y: 117});
    expect(t.overlap).toEqual({x: 1, y: 3});
  });

  // test corner coordinates
  describe('corners without overlap', function () {

    it('10 x 10 tile', function () {
      var t = geo.tile({
        index: {x: 0, y: 0},
        size: {x: 10, y: 10},
        url: '/data/sample.json'
      });

      expect(t.bottomLeft()).toEqual({x: 0, y: 0});
      expect(t.topRight()).toEqual({x: 10, y: 10});

      t = geo.tile({
        index: {x: 5, y: 6},
        size: {x: 10, y: 10},
        url: '/data/sample.json'
      });
      expect(t.bottomLeft()).toEqual({x: 50, y: 60});
      expect(t.topRight()).toEqual({x: 60, y: 70});
    });

    it('7 x 11 tile', function () {
      var t = geo.tile({
        index: {x: 1, y: 2},
        size: {x: 7, y: 11},
        url: '/data/sample.json'
      });

      expect(t.bottomLeft()).toEqual({x: 7, y: 22});
      expect(t.topRight()).toEqual({x: 14, y: 33});
    });
  });

  describe('corners with overlap', function () {

    it('10 x 10 tile', function () {
      var t = geo.tile({
        index: {x: 0, y: 0},
        size: {x: 10, y: 10},
        url: '/data/sample.json',
        overlap: {x: 1, y: 2}
      });

      expect(t.bottomLeft()).toEqual({x: -1, y: -2});
      expect(t.topRight()).toEqual({x: 11, y: 12});

      t = geo.tile({
        index: {x: 5, y: 6},
        size: {x: 10, y: 10},
        url: '/data/sample.json',
        overlap: {x: 1, y: 2}
      });
      expect(t.bottomLeft()).toEqual({x: 49, y: 58});
      expect(t.topRight()).toEqual({x: 61, y: 72});
    });

    it('7 x 11 tile', function () {
      var t = geo.tile({
        index: {x: 1, y: 2},
        size: {x: 7, y: 11},
        url: '/data/sample.json',
        overlap: {x: 1, y: 2}
      });

      expect(t.bottomLeft()).toEqual({x: 6, y: 20});
      expect(t.topRight()).toEqual({x: 15, y: 35});
    });
  });

  // Check the promise interface
  describe('promise resolution', function () {
    it('success', function (done) {
      var t = geo.tile({
        index: {x: 0, y: 0},
        size: {x: 10, y: 10},
        url: '/data/sample.json'
      });

      var called = false;
      t.then(function () {
        called = true;
      }).catch(function () {
        expect('The fetch should succeed').toBe(null);
      }).then(function () {
        expect(called).toBe(true);
        done();
      });
    });

    it('failure', function (done) {
      var t = geo.tile({
        index: {x: 0, y: 0},
        size: {x: 10, y: 10},
        url: 'not-a-valid-url'
      });

      var called = false;
      t.then(function () {
        expect('The fetch should not succeed').toBe(null);
      }).catch(function () {
        called = true;
      }).catch(function () {
        expect(called).toBe(true);
        done();
      });
    });
  });
});
