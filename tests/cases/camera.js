/**
 * Testing for the core camera class.
 */

var $ = require('jquery');
var mat4 = require('gl-mat4');
var vec3 = require('gl-vec3');
var vec4 = require('gl-vec4');
var geo = require('../test-utils').geo;
var closeToArray = require('../test-utils').closeToArray;

describe('geo.camera', function () {
  'use strict';

  describe('setBounds -> getBounds', function () {
    function setGetBounds(b, vp, proj) {
      return function () {
        var c = geo.camera(), b1;
        c.projection = proj;
        c.viewport = vp || {width: 100, height: 100};
        c.bounds = b;
        b1 = c.bounds;

        expect(b.left).toBe(b1.left);
        expect(b.right).toBe(b1.right);
        expect(b.top).toBe(b1.top);
        expect(b.bottom).toBe(b1.bottom);
      };
    }
    function testcase(proj) {
      return function () {
        it('[-1, 1] x [-1, 1]',
           setGetBounds({left: -1, right: 1, bottom: -1, top: 1}, null, proj));
        it('[0, 1] x [0, 1]',
           setGetBounds({left: 0, right: 1, bottom: 0, top: 1}, null, proj));
        it('[0, 1] x [-1, 1]',
           setGetBounds({left: 0, right: 1, bottom: -1, top: 1},
                        {width: 1, height: 2}, proj));
        it('[-1, 1] x [0, 1]',
           setGetBounds({left: -1, right: 1, bottom: 0, top: 1},
                        {width: 2, height: 1}, proj));
      };
    }

    describe('parallel', testcase('parallel'));
    describe('perspective', testcase('perspective'));
  });

  describe('resize viewport', function () {
    function number_near(n1, n2, tol) {
      return Math.abs(n1 - n2) < tol;
    }
    function bounds_near(b1, b2, tol) {
      tol = tol || 1e-4;
      var n = number_near(b1.left, b2.left, tol) &&
              number_near(b1.right, b2.right, tol) &&
              number_near(b1.bottom, b2.bottom, tol) &&
              number_near(b1.top, b2.top, tol);
      if (!n) {
        console.log(JSON.stringify(b1) + ' != ' + JSON.stringify(b2));
      }
      return n;
    }

    it('100 x 100 -> 90 x 90', function () {
      var c = geo.camera({viewport: {width: 100, height: 100}});

      c.bounds = {left: 0, right: 100, bottom: 0, top: 100};
      c.viewport = {width: 90, height: 90};

      expect(bounds_near(c.bounds, {left: 5, right: 95, bottom: 5, top: 95}))
        .toBe(true);
    });
    it('100 x 100 -> 100 x 90', function () {
      var c = geo.camera({viewport: {width: 100, height: 100}});

      c.bounds = {left: 0, right: 100, bottom: 0, top: 100};
      c.viewport = {width: 100, height: 90};

      expect(bounds_near(c.bounds, {left: 0, right: 100, bottom: 5, top: 95}))
        .toBe(true);
    });
    it('100 x 100 -> 20 x 10', function () {
      var c = geo.camera({viewport: {width: 100, height: 100}});

      c.bounds = {left: 0, right: 100, bottom: 0, top: 100};
      c.viewport = {width: 20, height: 10};

      expect(bounds_near(c.bounds, {left: 40, right: 60, bottom: 45, top: 55}))
        .toBe(true);
    });
    it('100 x 100 -> 140 x 120', function () {
      var c = geo.camera({viewport: {width: 100, height: 100}});

      c.bounds = {left: 0, right: 100, bottom: 0, top: 100};
      c.viewport = {width: 140, height: 120};

      expect(bounds_near(c.bounds, {left: -20, right: 120, bottom: -10, top: 110}))
        .toBe(true);
    });
    it('50 x 100 -> 100 x 100', function () {
      var c = geo.camera({viewport: {width: 50, height: 100}});

      c.bounds = {left: 0, right: 50, bottom: 0, top: 100};
      c.viewport = {width: 100, height: 100};

      expect(bounds_near(c.bounds, {left: -25, right: 75, bottom: 0, top: 100}))
        .toBe(true);
    });
    it('50 x 50 -> 100 x 100', function () {
      var c = geo.camera({viewport: {width: 50, height: 50}});

      c.bounds = {left: 0, right: 50, bottom: 0, top: 50};
      c.viewport = {width: 100, height: 100};

      expect(bounds_near(c.bounds, {left: -25, right: 75, bottom: -25, top: 75}))
        .toBe(true);
    });
  });

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
      function w2d(p, q) {
        return function () {
          var c = new geo.camera({viewport: viewport});
          if (projection) {
            c.projection = projection;
          }
          c.bounds = {
            left: xs,
            right: xe,
            bottom: ys,
            top: ye
          };
          near(c.worldToDisplay(p), q, undefined, c);
        };
      }

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
      pt = camera.worldToDisplay(pt);
      expect(
        pt.x >= 0 && pt.x <= size.width &&
        pt.y >= 0 && pt.y <= size.height
      ).toBe(true);
      pt = camera.displayToWorld(pt);
      near(pt, copy, tol, camera);
    };
  }

  /**
   * Test that the converted coordinates are outside of the viewport.
   */
  function outOfBounds(camera, size, pt) {
    return function () {
      camera = camera();
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
        var camera;

        size.width = 1000;
        size.height = 500;
        pt.x = -500;
        pt.y = 500;

        camera = geo.camera({viewport: size});
        camera.projection = projection;
        camera.bounds = {
          left: -990,
          right: 10,
          bottom: 100,
          top: 600
        };

        return camera;
      }

      it('Round trip case 1', roundTrip(setup1, size, pt, 1e-2));
      it('Out of window case 1', outOfBounds(setup1, size, {x: -1000, y: 500}));

      function setup2() {
        var camera;

        size.width = 10;
        size.height = 1;
        pt.x = -100;
        pt.y = -810;

        camera = geo.camera({viewport: size});
        camera.projection = projection;
        camera.bounds = {
          left: -990,
          right: 10,
          bottom: -800,
          top: -900
        };

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

    afterAll(function () {
      $('#' + idparent).remove();
      $('#' + idnode).remove();
    });

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
        /*,border: '1px solid red'*/
      });
      node.css({
        position: 'absolute',
        width: '100px',
        height: '100px',
        transform: 'none'
        /*,border: '1px solid black'*/
      });

      $('body').append(parent);
      parent.append(node);
      return node;
    }

    function get_node_position() {
      var node = $('#' + idnode),
          box = node.get(0).getBoundingClientRect();
      return {
        bottom: node.position().top + box.height,
        top: node.position().top,
        left: node.position().left,
        right: node.position().left + box.width,
        height: box.height,
        width: box.width
      };
    }

    function assert_position(position) {
      var _ = get_node_position(), k, actual = {};
      for (k in position) {
        if (position.hasOwnProperty(k)) {
          position[k] = position[k].toFixed(2);
          actual[k] = _[k].toFixed(2);
        }
      }
      expect(actual).toEqual(position);
    }

    it('Display and world parameters', function () {
      var camera = geo.camera(), calc;

      camera.viewport = {width: 100, height: 100};
      calc = mat4.invert(geo.util.mat4AsArray(), camera.world);
      expect(closeToArray(calc, camera.display, 4)).toBe(true);
      camera.pan({x: 10, y: 0});
      calc = mat4.invert(geo.util.mat4AsArray(), camera.world);
      expect(closeToArray(calc, camera.display, 4)).toBe(true);
      expect(camera.css('world')).toBe(geo.camera.css(camera.world));
    });
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
          camera = geo.camera(),
          view;

      camera.viewport = {width: 100, height: 100};
      camera.bounds = geo.camera.bounds;

      view = camera.view;
      camera.zoom(1);
      expect(camera.view).toBe(view);

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
    it('Simple rotation', function () {
      var node = make_node(),
          camera = geo.camera(),
          view;

      camera.viewport = {width: 100, height: 100};
      camera.bounds = geo.camera.bounds;

      view = camera.view;
      camera._rotate(0);
      expect(camera.view).toBe(view);

      camera._rotate(30 * Math.PI / 180);
      node.css('transform', geo.camera.css(camera.view));
      expect(node.position().left).toBeLessThan(-18);
      expect(node.position().top).toBeLessThan(-18);

      camera._rotate(-30 * Math.PI / 180);
      node.css('transform', geo.camera.css(camera.view));
      expect(node.position().left).toBeCloseTo(0, 4);
      expect(node.position().top).toBeCloseTo(0, 4);

      camera._rotate(-30 * Math.PI / 180, {x: 50, y: 0});
      node.css('transform', geo.camera.css(camera.view));
      expect(node.position().left).toBeLessThan(-10);
      expect(node.position().top).toBeLessThan(-40);
    });

    describe('World to display', function () {
      it('identity', function () {
        var node = make_node(),
            camera = geo.camera();

        camera.viewport = {width: 100, height: 100};
        camera.bounds = {left: 0, right: 100, bottom: 0, top: 100};

        node.css('transform', camera.css());
        assert_position({
          left: 0,
          right: 100,
          top: 0,
          bottom: 100
        });
      });

      it('zoom', function () {
        var node = make_node(),
            camera = geo.camera();

        camera.viewport = {width: 100, height: 100};
        camera.bounds = {left: 0, right: 100, bottom: 0, top: 100};

        camera.zoom(2);
        node.css('transform', camera.css());
        assert_position({
          left: -50,
          top: -50,
          right: 150,
          bottom: 150
        });

        camera.zoom(1 / 4);
        node.css('transform', camera.css());
        assert_position({
          left: 25,
          top: 25,
          right: 75,
          bottom: 75
        });
      });

      it('pan', function () {
        var node = make_node(),
            camera = geo.camera();

        camera.viewport = {width: 100, height: 100};
        camera.bounds = {left: 0, right: 100, bottom: 0, top: 100};

        camera.pan({x: 50, y: 0});
        node.css('transform', camera.css());
        assert_position({
          left: 50,
          top: 0,
          right: 150,
          bottom: 100
        });

        camera.pan({x: -25, y: 10});
        node.css('transform', camera.css());
        assert_position({
          left: 25,
          top: -10,
          right: 125,
          bottom: 90
        });
      });
      it('pan + zoom', function () {
        var node = make_node(),
            camera = geo.camera();

        camera.viewport = {width: 100, height: 100};
        camera.bounds = {left: 0, right: 100, bottom: 0, top: 100};

        camera.zoom(2);
        camera.pan({x: 10, y: -5});
        node.css('transform', camera.css());
        assert_position({
          left: -30,
          top: -40,
          right: 170,
          bottom: 160
        });

        camera.zoom(0.5);
        node.css('transform', camera.css());
        assert_position({
          left: 20,
          top: 10,
          right: 120,
          bottom: 110
        });
      });
    });
  });

  /*eslint-disable comma-spacing*/
  it('viewFromCenterSizeRotation', function () {
    var c = geo.camera();

    c.viewFromCenterSizeRotation({x: 0, y: 0}, {width: 100, height: 100});
    expect(c.view).toEqual([0.02,0,0,0, 0,0.02,0,0, 0,0,1,0, 0,0,0,1]);

    c.viewFromCenterSizeRotation({x: 10, y: 22}, {width: 100, height: 100});
    expect(c.view).toEqual([0.02,0,0,0, 0,0.02,0,0, 0,0,1,0, -0.2,-0.44,0,1]);

    c.viewFromCenterSizeRotation({x: 10, y: 22}, {width: 50, height: 50});
    expect(c.view).toEqual([0.04,0,0,0, 0,0.04,0,0, 0,0,1,0, -0.4,-0.88,0,1]);

    c.viewFromCenterSizeRotation({x: 0, y: 0}, {width: 100, height: 50});
    expect(c.view).toEqual([0.02,0,0,0, 0,0.02,0,0, 0,0,1,0, 0,0,0,1]);

    c.viewFromCenterSizeRotation(
        {x: 0, y: 0}, {width: 100, height: 100}, 90 * Math.PI / 180);
    expect(closeToArray(
        c.view, [0,-0.02,0,0, 0.02,0,0,0, 0,0,1,0, 0,0,0,1], 3)).toBe(true);

    c.viewFromCenterSizeRotation(
        {x: 0, y: 0}, {width: 100, height: 100}, -90 * Math.PI / 180);
    expect(closeToArray(
        c.view, [0,0.02,0,0, -0.02,0,0,0, 0,0,1,0, 0,0,0,1], 3)).toBe(true);

    c.viewFromCenterSizeRotation(
        {x: 0, y: 0}, {width: 2, height: 1}, 30 * Math.PI / 180);
    expect(closeToArray(
        c.view, [0.866,-0.5,0,0, 0.5,0.866,0,0, 0,0,1,0, 0,0,0,1], 3)).toBe(
        true);

    c.viewFromCenterSizeRotation(
        {x: 0.10, y: 0.22}, {width: 2, height: 1}, 30 * Math.PI / 180);
    expect(closeToArray(
        c.view, [0.866,-0.5,0,0, 0.5,0.866,0,0, 0,0,1,0, -0.1966,-0.1405,0,1],
        3)).toBe(true);
  });
  /*eslint-enable comma-spacing*/

  it('View getter/setter', function (done) {
    var c = geo.camera(),
        view, proj;

    view = mat4.clone([
      0, 1, 2, 3,
      4, 5, 6, 7,
      8, 9, 10, 11,
      12, 13, 14, 15
    ]);
    proj = c.projectionMatrix;

    c.geoOn(geo.event.camera.view, function (evt) {
      var i;
      for (i = 0; i < 16; i += 1) {
        expect(evt.camera.view[i]).toBe(i);
      }
      expect(evt.camera.projectionMatrix).toBe(proj);
      done();
    });

    c.view = view;
  });

  it('Projection getter/setter', function (done) {
    var c = geo.camera(), caught = false;

    c.projection = 'parallel';
    expect(c.projection).toBe('parallel');

    c.geoOn(geo.event.camera.projection, function (evt) {
      expect(evt.camera.projection).toBe('perspective');
      done();
    });

    try {
      c.projection = 'not valid';
    } catch (e) {
      caught = true;
    }
    expect(caught).toBe(true);

    c.projection = 'perspective';
  });

  /**
   * 4 x 4 version of
   * v^T * A * v
   */
  function vTAv(v, A) {
    var t = vec4.create();
    // t <- A * v
    vec4.transformMat4(t, v, A);

    // v^T * t
    return vec4.dot(v, t);
  }

  /**
   * 4 x 4 matrix norm
   */
  function mat4_norm(m) {
    var norm = 0;

    norm += Math.abs(vTAv(
      vec4.fromValues(1, 0, 0, 0),
      m
    ));
    norm += Math.abs(vTAv(
      vec4.fromValues(0, 1, 0, 0),
      m
    ));
    norm += Math.abs(vTAv(
      vec4.fromValues(0, 0, 1, 0),
      m
    ));
    norm += Math.abs(vTAv(
      vec4.fromValues(0, 0, 0, 1),
      m
    ));
    return norm;
  }

  /**
   * A distance metric for 4 x 4 matrices
   */
  function mat4_dist(A, B) {
    var T = mat4.clone(A), i;
    for (i = 0; i < 16; i += 1) {
      T[i] -= B[i];
    }
    return mat4_norm(T);
  }

  it('Transform and inverse getters', function () {
    var c = geo.camera(), eye;

    c.pan({x: 11, y: -50});
    c.zoom(1.5);
    c.pan({x: -5, y: 1});

    eye = mat4.multiply(mat4.create(), c.transform, c.inverse);
    expect(mat4_dist(eye, mat4.create())).toBeLessThan(10e-10);
  });

  it('Camera debugging methods', function () {
    var c = geo.camera(), s = c.debug();
    expect(s.indexOf('{"left":-1,"bottom":-1,"right":1,"top":1}')).toBeGreaterThan(-1);
    expect(s.indexOf('view:')).toBeGreaterThan(-1);
    expect(s.indexOf('projection:')).toBeGreaterThan(-1);
    expect(s.indexOf('transform:')).toBeGreaterThan(-1);

    c.pan({x: 1, y: -1});
    expect(s !== c.debug()).toBe(true);
  });

  it('Camera value is its transform', function () {
    var c = geo.camera();
    c.pan({x: 100, y: 5});
    c.zoom(5);

    expect(c.valueOf()).toBe(c.transform);
  });

  it('Camera string repesentation is its transform', function () {
    var c = geo.camera();
    c.pan({x: 100, y: 5});
    c.zoom(5);

    expect(c.toString()).toEqual(c.ppMatrix(c.transform));
  });

  it('Affine transform generator', function () {
    var t, v;

    t = geo.camera.affine(
      {x: 10, y: 20, z: 30},
      {x: 2, y: 3, z: 4},
      {x: -10, y: -20, z: -30}
    );

    v = vec3.transformMat4(
      vec3.create(),
      vec3.fromValues(1, 0, 0),
      t
    );
    expect(v).toEqual(vec3.fromValues(12, 40, 90));

    v = vec3.transformMat4(
      vec3.create(),
      vec3.fromValues(0, 1, 0),
      t
    );
    expect(v).toEqual(vec3.fromValues(10, 43, 90));

    v = vec3.transformMat4(
      vec3.create(),
      vec3.fromValues(0, 0, 1),
      t
    );
    expect(v).toEqual(vec3.fromValues(10, 40, 94));
  });

  it('Unknown transform error', function () {
    var c = geo.camera();
    expect(function () { c.css('not-valid'); }).toThrow();
  });

  it('Invalid viewport error', function () {
    var c = geo.camera();
    expect(function () { c.viewport = {width: 0, height: 100}; }).toThrow();
    expect(function () { c.viewport = {width: 100, height: -100}; }).toThrow();
  });
});
