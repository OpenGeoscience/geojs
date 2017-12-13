describe('d3 point feature', function () {
  var createMap = require('../test-utils').createMap;
  var mockAnimationFrame = require('../test-utils').mockAnimationFrame;
  var stepAnimationFrame = require('../test-utils').stepAnimationFrame;
  var unmockAnimationFrame = require('../test-utils').unmockAnimationFrame;

  describe('d3 point feature', function () {
    'use strict';

    var map, layer, feature1, feature2;

    it('Setup map', function () {
      mockAnimationFrame();
      map = createMap({center: [0, 0], zoom: 3}, {width: '800px', height: '600px'});
      layer = map.createLayer('feature', {'renderer': 'd3'});
    });

    it('Add features to a layer', function () {
      var selection;
      feature1 = layer.createFeature('point', {selectionAPI: true})
        .data([{y: 0, x: 0}, {y: 10, x: 0}, {y: 0, x: 10}])
        .draw();
      stepAnimationFrame();

      selection = layer.node().find('circle');
      expect(selection.length).toBe(3);

      feature2 = layer.createFeature('point')
        .data([{y: -10, x: -10}, {y: 10, x: -10}])
        .draw();
      stepAnimationFrame();

      selection = layer.node().find('circle');
      expect(selection.length).toBe(5);

      layer.createFeature('point')
        .data([{y: -10, x: 10}])
        .draw();
      stepAnimationFrame();

      selection = layer.node().find('circle');
      expect(selection.length).toBe(6);
    });

    it('Validate selection API option', function () {
      expect(feature1.selectionAPI()).toBe(true);
      expect(feature2.selectionAPI()).toBe(false);
    });

    it('Remove a feature from a layer', function () {
      var selection;

      layer.deleteFeature(feature2).draw();
      stepAnimationFrame();

      selection = layer.node().find('circle');
      expect(selection.length).toBe(4);
    });
    it('Remove all features from a layer', function () {
      var selection;

      layer.clear().draw();
      map.draw();
      stepAnimationFrame();

      selection = layer.node().find('circle');
      expect(selection.length).toBe(0);
      unmockAnimationFrame();
    });
  });
});
