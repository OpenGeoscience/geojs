// Test renderer functions
/*global describe, it, expect, geo, mockVGLRenderer*/

describe('renderers', function () {
  'use strict';

  var supported = true;
  var fallback = 'd3';

  function create_simple_renderer() {
    var simpleRenderer = function (arg) {
      if (!(this instanceof simpleRenderer)) {
        return new simpleRenderer(arg);
      }
      geo.renderer.call(this, arg);
      this._init(arg);
      return this;
    };
    inherit(simpleRenderer, geo.renderer);

    geo.registerRenderer('simple', simpleRenderer);

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
      expect(geo.createRenderer('simple')).not.toBe(null);
      expect(geo.createRenderer('unknown')).toBe(null);
    });
    it('geo.checkRenderer', function () {
      expect(geo.checkRenderer('simple')).toBe('simple');
      expect(geo.checkRenderer('simple', true)).toBe('simple');
      supported = false;
      expect(geo.checkRenderer('simple')).toBe('d3');
      expect(geo.checkRenderer('simple', true)).toBe(false);
      fallback = 'unknown';
      expect(geo.checkRenderer('simple')).toBe(false);
      supported = true;
      expect(geo.checkRenderer('simple')).toBe('simple');

      expect(geo.checkRenderer(null)).toBe(null);

      expect(geo.checkRenderer('d3')).toBe('d3');
      var oldd3 = window.d3;
      window.d3 = undefined;
      expect(geo.checkRenderer('d3')).toBe(null);
      window.d3 = oldd3;
      expect(geo.checkRenderer('d3')).toBe('d3');

      expect(geo.checkRenderer('vgl')).toBe(null);
      mockVGLRenderer();
      expect(geo.checkRenderer('vgl')).toBe('vgl');

      expect(geo.checkRenderer('unknown')).toBe(false);
    });
  });
});
