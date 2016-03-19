// Test renderer functions

describe('renderers', function () {
  'use strict';

  var supported = true;
  var fallback = 'd3';
  var geo = require('../test-utils').geo;
  var mockVGLRenderer = require('../test-utils').mockVGLRenderer;
  var restoreVGLRenderer = require('../test-utils').restoreVGLRenderer;

  function create_simple_renderer() {
    var simpleRenderer = function (arg) {
      if (!(this instanceof simpleRenderer)) {
        return new simpleRenderer(arg);
      }
      geo.renderer.call(this, arg);
      this._init(arg);
      return this;
    };
    geo.util.inherit(simpleRenderer, geo.renderer);

    geo.util.registerRenderer('simple', simpleRenderer);

    simpleRenderer.supported = function () {
      return supported;
    };

    simpleRenderer.fallback = function () {
      return fallback;
    };
  }

  describe('basic functions', function () {
    beforeEach(function () {
      sinon.stub(console, 'warn', function () {});
    });
    afterEach(function () {
      console.warn.restore();
    });
    it('geo.createRenderer', function () {
      create_simple_renderer();
      expect(geo.util.createRenderer('simple')).not.toBe(null);
      expect(geo.util.createRenderer('unknown')).toBe(null);
    });
    it('geo.checkRenderer', function () {
      expect(geo.util.checkRenderer('simple')).toBe('simple');
      expect(geo.util.checkRenderer('simple', true)).toBe('simple');

      supported = false;
      expect(geo.util.checkRenderer('simple')).toBe('d3');
      expect(console.warn.calledOnce).toBe(true);
      expect(console.warn.calledWith(
        'simple renderer is unavailable, using d3 renderer instead'
      )).toBe(true);
      console.warn.reset();

      expect(geo.util.checkRenderer('simple', true)).toBe(false);
      fallback = 'unknown';
      expect(geo.util.checkRenderer('simple')).toBe(false);
      supported = true;
      expect(geo.util.checkRenderer('simple')).toBe('simple');

      expect(geo.util.checkRenderer(null)).toBe(null);

      expect(geo.util.checkRenderer('d3')).toBe('d3');

      sinon.stub(geo.d3.renderer, 'supported').returns(false);
      expect(geo.util.checkRenderer('d3')).toBe(null);
      geo.d3.renderer.supported.restore();

      expect(geo.util.checkRenderer('d3')).toBe('d3');

      mockVGLRenderer(false);
      expect(geo.util.checkRenderer('vgl')).toBe(null);
      restoreVGLRenderer();

      mockVGLRenderer();
      expect(geo.util.checkRenderer('vgl')).toBe('vgl');
      restoreVGLRenderer();

      expect(geo.util.checkRenderer('unknown')).toBe(false);
    });
  });
});
