// Test geo.tile

describe('geo.tile', function () {
  'use strict';

  var geo = require('../test-utils').geo;

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
      url: '/testdata/sample.json',
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
        url: '/testdata/sample.json'
      });

      expect(t.bottom).toEqual(10);
      expect(t.left).toEqual(0);
      expect(t.top).toEqual(0);
      expect(t.right).toEqual(10);

      t = geo.tile({
        index: {x: 5, y: 6},
        size: {x: 10, y: 10},
        url: '/testdata/sample.json'
      });
      expect(t.bottom).toEqual(70);
      expect(t.left).toEqual(50);
      expect(t.top).toEqual(60);
      expect(t.right).toEqual(60);
    });

    it('7 x 11 tile', function () {
      var t = geo.tile({
        index: {x: 1, y: 2},
        size: {x: 7, y: 11},
        url: '/testdata/sample.json'
      });

      expect(t.bottom).toEqual(33);
      expect(t.left).toEqual(7);
      expect(t.top).toEqual(22);
      expect(t.right).toEqual(14);
    });
  });

  describe('corners with overlap', function () {

    it('10 x 10 tile', function () {
      var t = geo.tile({
        index: {x: 0, y: 0},
        size: {x: 10, y: 10},
        url: '/testdata/sample.json',
        overlap: {x: 1, y: 2}
      });

      expect(t.bottom).toEqual(12);
      expect(t.left).toEqual(-1);
      expect(t.top).toEqual(-2);
      expect(t.right).toEqual(11);

      t = geo.tile({
        index: {x: 5, y: 6},
        size: {x: 10, y: 10},
        url: '/testdata/sample.json',
        overlap: {x: 1, y: 2}
      });
      expect(t.bottom).toEqual(72);
      expect(t.left).toEqual(49);
      expect(t.top).toEqual(58);
      expect(t.right).toEqual(61);
    });

    it('7 x 11 tile', function () {
      var t = geo.tile({
        index: {x: 1, y: 2},
        size: {x: 7, y: 11},
        url: '/testdata/sample.json',
        overlap: {x: 1, y: 2}
      });

      expect(t.bottom).toEqual(35);
      expect(t.left).toEqual(6);
      expect(t.top).toEqual(20);
      expect(t.right).toEqual(15);
    });
  });

  // Check the promise interface
  describe('promise resolution', function () {
    it('success', function (done) {
      var t = geo.tile({
        index: {x: 0, y: 0},
        size: {x: 10, y: 10},
        url: '/testdata/sample.json'
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
      // create a mocked sinon server instance that always responds with 404.
      var server = sinon.fakeServer.create();

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
      });

      server.respond();
      window.setTimeout(function () { // wait for the next time slice
        expect(called).toBe(true);
        server.restore();
        done();
      }, 0);
    });
  });

  describe('bounds', function () {
    var t;

    it('setup', function () {
      t = geo.tile({
        index: {x: 1, y: 2},
        size: {x: 10, y: 10},
        url: '/testdata/sample.json'
      });
    });

    describe('no offset', function () {
      it('bounds.left === left', function () {
        expect(t.left).toBe(t.bounds({x: 0, y: 0}, {x: 0, y: 0}).left);
      });
      it('bounds.right === right', function () {
        expect(t.right).toBe(t.bounds({x: 0, y: 0}, {x: 0, y: 0}).right);
      });
      it('bounds.bottom === bottom', function () {
        expect(t.bottom).toBe(t.bounds({x: 0, y: 0}, {x: 0, y: 0}).bottom);
      });
      it('bounds.top === top', function () {
        expect(t.top).toBe(t.bounds({x: 0, y: 0}, {x: 0, y: 0}).top);
      });
    });

    describe('index: (1, -2) offset: (10, 50)', function () {
      var bds;
      it('compute bounds', function () {
        bds = t.bounds(
          {x: 1, y: -2},
          {x: 10, y: 55}
        );
      });
      it('bounds.left', function () {
        expect(bds.left).toBe(-10);
      });
      it('bounds.right', function () {
        expect(bds.right).toBe(0);
      });
      it('bounds.bottom', function () {
        expect(bds.bottom).toBe(-5);
      });
      it('bounds.top', function () {
        expect(bds.top).toBe(-15);
      });
    });
  });
});
