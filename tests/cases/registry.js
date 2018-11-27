describe('geo.registry', function () {
  'use strict';

  var geo = require('../test-utils').geo;
  var mockWebglRenderer = geo.util.mockWebglRenderer;
  var restoreWebglRenderer = geo.util.restoreWebglRenderer;

  describe('Check rendererForFeatures', function () {
    it('specific features', function () {
      mockWebglRenderer();
      expect(geo.rendererForFeatures()).toBe('webgl');
      expect(geo.rendererForFeatures(['point'])).toBe('webgl');
      expect(geo.rendererForFeatures(['heatmap'])).toBe('canvas');
      expect(geo.rendererForFeatures(['point', 'graph'])).toBe('svg');
      expect(geo.rendererForFeatures(['contour'])).toBe('webgl');
      expect(geo.rendererForFeatures(['contour', 'graph'])).toBe(false);
      expect(geo.rendererForFeatures(['quad', 'graph'])).toBe('svg');
      expect(geo.rendererForFeatures([geo.quadFeature.capabilities.imageFull, 'graph'])).toBe(false);
      expect(geo.rendererForFeatures([geo.quadFeature.capabilities.image, 'graph'])).toBe('svg');
      restoreWebglRenderer();
    });
    it('unsupported webgl renderer', function () {
      mockWebglRenderer(false);
      expect(geo.rendererForFeatures()).toBe('canvas');
      expect(geo.rendererForFeatures(['point'])).toBe('svg');
      restoreWebglRenderer();
    });
    it('expose registries', function () {
      expect(geo.registries.unknown).toBe(undefined);
      expect(geo.registries.annotations).not.toBe(undefined);
      expect(geo.registries.features).not.toBe(undefined);
    });
  });
});
