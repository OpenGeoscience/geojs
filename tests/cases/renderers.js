// Test renderer functions

describe('renderers', function () {
  'use strict';

  var supported = true;
  var fallback = 'd3';
  var geo = require('../test-utils').geo;
  var mockVGLRenderer = require('../test-utils').mockVGLRenderer;

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
      expect(geo.util.checkRenderer('simple', true)).toBe(false);
      fallback = 'unknown';
      expect(geo.util.checkRenderer('simple')).toBe(false);
      supported = true;
      expect(geo.util.checkRenderer('simple')).toBe('simple');

      expect(geo.util.checkRenderer(null)).toBe(null);

      expect(geo.util.checkRenderer('d3')).toBe('d3');

      /* This won't work in a webpack build:
      var oldd3 = window.d3;
      window.d3 = undefined;
      expect(geo.util.checkRenderer('d3')).toBe(null);
      window.d3 = oldd3;
      expect(geo.util.checkRenderer('d3')).toBe('d3');

      expect(geo.util.checkRenderer('vgl')).toBe(null);
      */

      mockVGLRenderer();
      expect(geo.util.checkRenderer('vgl')).toBe('vgl');

      expect(geo.util.checkRenderer('unknown')).toBe(false);
    });
  });
});
