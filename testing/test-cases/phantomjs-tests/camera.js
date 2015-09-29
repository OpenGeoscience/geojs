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
  function near(a, b, tol, c) {
    var dx = Math.abs(a.x - b.x),
        dy = Math.abs(a.y - b.y);
    tol = tol || 1e-6;
    if (dx > tol || dy > tol) {
      if (c) {
        console.log(c.debug());
      }
      console.log(
        JSON.stringify(a) + ' != ' + JSON.stringify(b)
      );
    }
    expect(dx).toBeLessThan(tol);
    expect(dy).toBeLessThan(tol);
  }

  function generateBoundsTest(xs, xe, ys, ye, projection) {
    var viewport = {width: 1, height: 1};

    return function () {
      var c;

      function w2d(p, q) {
        return function () {
          near(c.worldToDisplay(p), q, undefined, c);
        };
      }

      it('setup', function () {
        c = new geo.camera({viewport: viewport});
        if (projection) {
          c.projection = projection;
        }
        c.bounds = {
          left: xs,
          right: xe,
          bottom: ys,
          top: ye
        };
      });
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
      camera = camera();
      var copy = $.extend({}, pt);
      camera.viewport = size;
      pt = camera.worldToDisplay(pt);
      expect(
        pt.x >= 0 && pt.x <= size.width &&
        pt.y >= 0 && pt.y <= size.height
      ).toBe(true);
      camera.viewport = size;
      pt = camera.displayToWorld(pt);
      near(pt, copy, tol);
    };
  }

  /**
   * Test that the converted coordinates are outside of the viewport.
   */
  function outOfBounds(camera, size, pt) {
    return function () {
      camera = camera();
      camera.viewport = size;
      pt = camera.worldToDisplay(pt);
      expect(pt.x < 0 || pt.x > size.width || pt.y < 0 || pt.y > size.height).toBe(true);
    };
  }

  /**
   * Use the roundTrip method to run various tests on the given camera.
   */
  function roundTripTest(projection) {
    return function () {
      var size = {}, pt = {};

      function setup1() {
        var camera = geo.camera();
        camera.projection = projection;
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
        return camera;
      }

      it('Round trip case 1', roundTrip(setup1, size, pt, 1e-2));
      it('Out of window case 1', outOfBounds(setup1, size, {x: -1000, y: 500}));

      function setup2() {
        var camera = geo.camera();
        camera.projection = projection;
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
        return camera;
      }
      it('Round trip case 2', roundTrip(setup2, size, pt, 1e-2));
    };
  }

  describe('Initialization', function () {
    describe('default projection', function () {
      describe(
        'bounds [-1, 1] x [-1, 1]',
        generateBoundsTest(-1, 1, -1, 1)
      );
      describe(
        'bounds [-10, 10] x [-10, 10]',
        generateBoundsTest(-10, 10, -10, 10)
      );
      describe(
        'bounds [-1, 0] x [0, 1]',
        generateBoundsTest(-1, 0, 0, 1)
      );
      describe(
        'bounds [-1, 10] x [-51, -40]',
        generateBoundsTest(-1, 10, -51, -40)
      );
    });
    describe('parallel', function () {
      describe(
        'bounds [-1, 1] x [-1, 1]',
        generateBoundsTest(-1, 1, -1, 1, 'parallel')
      );
      describe(
        'bounds [-10, 10] x [-10, 10]',
        generateBoundsTest(-10, 10, -10, 10, 'parallel')
      );
      describe(
        'bounds [-1, 0] x [0, 1]',
        generateBoundsTest(-1, 0, 0, 1, 'parallel')
      );
      describe(
        'bounds [-1, 10] x [-51, -40]',
        generateBoundsTest(-1, 10, -51, -40, 'parallel')
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
    describe('parallel projection', roundTripTest('parallel'));
    describe('perspective projection', roundTripTest('perspective'));
  });

  describe('Setting bounds with different aspect ratios', function () {
    it('(1, 1) -> (2, 1)', function () {
      var c = geo.camera({viewport: {width: 1, height: 1}});

      c.bounds = {left: 0, right: 2, bottom: 0, top: 1};

      expect(c.bounds.left).toEqual(0);
      expect(c.bounds.right).toEqual(2);
      expect(c.bounds.bottom).toEqual(-0.5);
      expect(c.bounds.top).toEqual(1.5);
    });

    it('(1, 1) -> (1, 2)', function () {
      var c = geo.camera({viewport: {width: 1, height: 1}});

      c.bounds = {left: 0, right: 1, bottom: 0, top: 2};

      expect(c.bounds.left).toEqual(-0.5);
      expect(c.bounds.right).toEqual(1.5);
      expect(c.bounds.bottom).toEqual(0);
      expect(c.bounds.top).toEqual(2);
    });
  });

  describe('Camera CSS', function () {
    var idparent = 'geo-test-parent',
        idnode = 'geo-test-node';

    /**
     * Generate a node on the current page with known transforms.
     */
    function make_node() {
      var parent, node;

      $('#' + idparent).remove();
      $('#' + idnode).remove();

      parent = $('<div id=' + idparent + '/>');
      node = $('<div id=' + idnode + '/>');

      parent.css({
        position: 'relative',
        width: '100px',
        height: '100px'
      });

      node.css({
        position: 'absolute',
        width: '100px',
        height: '100px',
        transform: 'none'
      });

      $('body').append(parent);
      parent.append(node);
      return node;
    }
    it('Simple panning', function () {
      var node = make_node(),
          camera = geo.camera();

      camera.viewport = {width: 100, height: 100};
      camera.bounds = geo.camera.bounds;
      camera.pan({x: 10, y: 0});

      node.css('transform', geo.camera.css(camera.view));
      expect(node.position().left).toBe(10);
      expect(node.position().top).toBe(0);

      camera.pan({x: 0, y: -5});

      node.css('transform', geo.camera.css(camera.view));
      expect(node.position().left).toBe(10);
      expect(node.position().top).toBe(-5);

      camera.pan({x: -10, y: 5});

      node.css('transform', geo.camera.css(camera.view));
      expect(node.position().left).toBe(0);
      expect(node.position().top).toBe(0);
    });
    it('Simple zooming', function () {
      var node = make_node(),
          camera = geo.camera();

      camera.viewport = {width: 100, height: 100};
      camera.bounds = geo.camera.bounds;

      camera.zoom(0.5);

      node.css('transform', geo.camera.css(camera.view));
      expect(node.position().left).toBe(25);
      expect(node.position().top).toBe(25);

      camera.zoom(6);

      node.css('transform', geo.camera.css(camera.view));
      expect(node.position().left).toBe(-100);
      expect(node.position().top).toBe(-100);

      camera.zoom(1 / 3);

      node.css('transform', geo.camera.css(camera.view));
      expect(node.position().left).toBe(0);
      expect(node.position().top).toBe(0);
    });
    it('Zooming + panning', function () {
      var node = make_node(),
          camera = geo.camera();

      camera.viewport = {width: 100, height: 100};
      camera.bounds = geo.camera.bounds;

      camera.pan({x: -25, y: -25});
      camera.zoom(0.5);

      node.css('transform', geo.camera.css(camera.view));
      expect(node.position().left).toBe(0);
      expect(node.position().top).toBe(0);

      camera.pan({x: 50, y: 50});
      camera.zoom(2);

      node.css('transform', geo.camera.css(camera.view));
      expect(node.position().left).toBe(0);
      expect(node.position().top).toBe(0);
    });
  });

  it('View setter', function (done) {
    var c = geo.camera(),
        view;

    view = mat4.clone([
      0, 1, 2, 3,
      4, 5, 6, 7,
      8, 9, 10, 11,
      12, 13, 14, 15
    ]);

    c.geoOn(geo.event.camera.view, function (evt) {
      var i;
      for (i = 0; i < 16; i += 1) {
        expect(evt.camera.view[i]).toBe(i);
      }
      done();
    });

    c.view = view;
  });
});
