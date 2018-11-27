// Test renderer functions

describe('renderers', function () {
  'use strict';

  var supported = true;
  var fallback = 'svg';
  var geo = require('../test-utils').geo;
  var mockVGLRenderer = geo.util.mockVGLRenderer;
  var restoreVGLRenderer = geo.util.restoreVGLRenderer;

  function create_simple_renderer() {
    var simpleRenderer = function (arg) {
      if (!(this instanceof simpleRenderer)) {
        return new simpleRenderer(arg);
      }
      geo.renderer.call(this, arg);
      this._init(arg);
      return this;
    };
    geo.inherit(simpleRenderer, geo.renderer);

    geo.registerRenderer('simple', simpleRenderer);

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
      expect(geo.createRenderer('simple')).not.toBe(null);
      expect(geo.createRenderer('unknown')).toBe(null);
    });
    it('geo.checkRenderer', function () {
      expect(geo.checkRenderer('simple')).toBe('simple');
      expect(geo.checkRenderer('simple', true)).toBe('simple');

      supported = false;
      expect(geo.checkRenderer('simple')).toBe('svg');
      expect(console.warn.calledOnce).toBe(true);
      expect(console.warn.calledWith(
        'simple renderer is unavailable, using svg renderer instead'
      )).toBe(true);
      console.warn.reset();

      expect(geo.checkRenderer('simple', true)).toBe(false);
      fallback = 'unknown';
      expect(geo.checkRenderer('simple')).toBe(false);
      supported = true;
      expect(geo.checkRenderer('simple')).toBe('simple');

      expect(geo.checkRenderer(null)).toBe(null);

      expect(geo.checkRenderer('svg')).toBe('svg');

      sinon.stub(geo.svg.renderer, 'supported').returns(false);
      expect(geo.checkRenderer('svg')).toBe(null);
      geo.svg.renderer.supported.restore();

      expect(geo.checkRenderer('svg')).toBe('svg');

      var oldd3 = __webpack_modules__[require.resolveWeak('d3')];  // eslint-disable-line
      __webpack_modules__[require.resolveWeak('d3')] = null;  // eslint-disable-line
      delete __webpack_require__.c[require.resolveWeak('d3')];  // eslint-disable-line
      expect(geo.checkRenderer('svg')).toBe(null);
      __webpack_modules__[require.resolveWeak('d3')] = oldd3;  // eslint-disable-line
      delete __webpack_require__.c[require.resolveWeak('d3')];  // eslint-disable-line
      expect(geo.checkRenderer('svg')).toBe('svg');

      mockVGLRenderer(false);
      expect(geo.checkRenderer('vgl')).toBe(null);
      restoreVGLRenderer();

      mockVGLRenderer();
      expect(geo.checkRenderer('vgl')).toBe('vgl');
      restoreVGLRenderer();

      expect(geo.checkRenderer('unknown')).toBe(false);
    });
  });
});
