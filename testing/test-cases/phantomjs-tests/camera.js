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
    console.log(JSON.stringify(a) + '==' + JSON.stringify(b));
    var dx = Math.abs(a.x - b.x),
        dy = Math.abs(a.y - b.y);
    tol = tol || 1e-6;
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
      console.log(c.debug());
      it('bottom left ', w2d({x: xs, y: ys}, {x: 0, y: 1}));
      it('top left', w2d({x: xs, y: ye}, {x: 0, y: 0}));
      it('bottom right', w2d({x: xe, y: ys}, {x: 1, y: 1}));
      it('top right', w2d({x: xe, y: ye}, {x: 1, y: 0}));
      it('center', w2d({x: (xs + xe) / 2, y: (ys + ye) / 2}, {x: 0.5, y: 0.5}));
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
});
