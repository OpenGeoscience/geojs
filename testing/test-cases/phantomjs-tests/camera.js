/*global describe, it, expect, geo*/

/**
 * Testing for the core camera class.
 */


describe('geo.camera', function () {
  'use strict';

  /**
   * Test that two points are close to each other.
   * (l^\infty norm)
   */
  function near(a, b, tol) {
    var dx = Math.abs(a.x - b.x),
        dy = Math.abs(a.y - b.y);
    tol = tol || 1e-6;
    if (dx > tol || dy > tol) {
      console.log(
        JSON.stringify(a) + ' != ' + JSON.stringify(b)
      );
    }
    expect(dx).toBeLessThan(tol);
    expect(dy).toBeLessThan(tol);
  }

  function generateBoundsTest(xs, xe, ys, ye, projection) {
    return function () {
      var c = geo.camera(), w = 1, h = 1;

      function w2d(p, q) {
        return function () {
          near(c.worldToDisplay(p, w, h), q);
        };
      }

      c = new geo.camera();
      if (projection) {
        c.projection = projection;
      }
      c.bounds = {
        left: xs,
        right: xe,
        bottom: ys,
        top: ye
      };
      it('bottom left ', w2d({x: xs, y: ys}, {x: 0, y: 1}));
      it('top left', w2d({x: xs, y: ye}, {x: 0, y: 0}));
      it('bottom right', w2d({x: xe, y: ys}, {x: 1, y: 1}));
      it('top right', w2d({x: xe, y: ye}, {x: 1, y: 0}));
      it('center', w2d({x: (xs + xe) / 2, y: (ys + ye) / 2}, {x: 0.5, y: 0.5}));
    };
  }

  /**
   * Test coordinate conversion to and from window and world space.
   */
  function roundTrip(camera, size, pt, tol) {
    return function () {
      var copy = $.extend({}, pt);
      pt = camera.worldToDisplay(pt, size.width, size.height);
      expect(
        pt.x >= 0 && pt.x <= size.width &&
        pt.y >= 0 && pt.y <= size.height
      ).toBe(true);
      pt = camera.displayToWorld(pt, size.width, size.height);
      near(pt, copy, tol);
    };
  }

  /**
   * Test that the converted coordinates are outside of the viewport.
   */
  function outOfBounds(camera, size, pt) {
    return function () {
      pt = camera.worldToDisplay(pt, size.width, size.height);
      expect(pt.x < 0 || pt.x > size.width || pt.y < 0 || pt.y > size.height).toBe(true);
    };
  }

  /**
   * Use the roundTrip method to run various tests on the given camera.
   */
  function roundTripTest(camera) {
    return function () {
      var size = {}, pt = {};

      camera.bounds = {
        left: -990,
        right: 10,
        bottom: 100,
        top: 600
      };

      size.width = 1000;
      size.height = 500;
      pt.x = -500;
      pt.y = 500;
      it('Round trip case 1', roundTrip(camera, size, pt, 1e-2));
      it('Out of window case 1', outOfBounds(camera, size, {x: -1000, y: 500}));

      camera.bounds = {
        left: -990,
        right: 10,
        bottom: -800,
        top: -900
      };

      size.width = 10;
      size.height = 1;
      pt.x = -100;
      pt.y = -810;
      it('Round trip case 2', roundTrip(camera, size, pt, 1e-2));
    };
  }

  describe('Initialization', function () {
    describe('default projection', function () {
      describe(
        'bounds [-1, 1] x [-1, 1]',
        generateBoundsTest(-1, 1, -1, 1)
      );
      describe(
        'bounds [-10, 10] x [-1, 1]',
        generateBoundsTest(-10, 10, -1, 1)
      );
      describe(
        'bounds [-1, 0] x [0, 1000]',
        generateBoundsTest(-1, 0, 0, 1000)
      );
      describe(
        'bounds [-1, 10] x [-51, 1000]',
        generateBoundsTest(-1, 10, -51, 1000)
      );
    });
    describe('parallel', function () {
      describe(
        'bounds [-1, 1] x [-1, 1]',
        generateBoundsTest(-1, 1, -1, 1, 'parallel')
      );
      describe(
        'bounds [-10, 10] x [-1, 1]',
        generateBoundsTest(-10, 10, -1, 1, 'parallel')
      );
      describe(
        'bounds [-1, 0] x [0, 1000]',
        generateBoundsTest(-1, 0, 0, 1000, 'parallel')
      );
      describe(
        'bounds [-1, 10] x [-51, 1000]',
        generateBoundsTest(-1, 10, -51, 1000, 'parallel')
      );
    });
    describe('perspective', function () {
      describe(
        'bounds [-1, 1] x [-1, 1]',
        generateBoundsTest(-1, 1, -1, 1, 'perspective')
      );
      describe(
        'bounds [-10, 10] x [-10, 10]',
        generateBoundsTest(-10, 10, -10, 10, 'perspective')
      );
      describe(
        'bounds [-1000, 0] x [0, 1000]',
        generateBoundsTest(-1000, 0, 0, 1000, 'perspective')
      );
      describe(
        'bounds [-1, 10] x [-10, 1]',
        generateBoundsTest(-1, 10, -10, 1, 'perspective')
      );
    });
  });

  describe('Coordinate conversion', function () {
    var parallel = geo.camera(),
        perspective = geo.camera();
    parallel.projection = 'parallel';
    perspective.projection = 'perspective';
    describe('parallel projection', roundTripTest(parallel));
    describe('perspective projection', roundTripTest(perspective));
  });
});
