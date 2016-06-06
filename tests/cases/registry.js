describe('geo.registry', function () {
  'use strict';

  var geo = require('../test-utils').geo;
  var mockVGLRenderer = require('../test-utils').mockVGLRenderer;
  var restoreVGLRenderer = require('../test-utils').restoreVGLRenderer;

  describe('Check rendererForFeatures', function () {
    it('specific features', function () {
      mockVGLRenderer();
      expect(geo.rendererForFeatures()).toBe('vgl');
      expect(geo.rendererForFeatures(['point'])).toBe('vgl');
      expect(geo.rendererForFeatures(['heatmap'])).toBe('canvas');
      expect(geo.rendererForFeatures(['point', 'graph'])).toBe('d3');
      expect(geo.rendererForFeatures(['contour'])).toBe('vgl');
      expect(geo.rendererForFeatures(['contour', 'graph'])).toBe(false);
      expect(geo.rendererForFeatures(['quad', 'graph'])).toBe('d3');
      expect(geo.rendererForFeatures(['quad.img-full', 'graph'])).toBe(false);
      expect(geo.rendererForFeatures(['quad.img', 'graph'])).toBe('d3');
      restoreVGLRenderer();
    });
    it('unsupported vgl renderer', function () {
      mockVGLRenderer(false);
      expect(geo.rendererForFeatures()).toBe('canvas');
      expect(geo.rendererForFeatures(['point'])).toBe('d3');
      restoreVGLRenderer();
    });
  });
});
