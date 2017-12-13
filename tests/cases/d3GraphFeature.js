describe('d3 graph feature', function () {
  var createMap = require('../test-utils').createMap;
  var mockAnimationFrame = require('../test-utils').mockAnimationFrame;
  var stepAnimationFrame = require('../test-utils').stepAnimationFrame;
  var unmockAnimationFrame = require('../test-utils').unmockAnimationFrame;

  describe('d3 graph feature', function () {
    'use strict';

    var map, layer, feature;

    it('Setup map', function () {
      mockAnimationFrame();
      map = createMap({center: [0, 0], zoom: 3});
      layer = map.createLayer('feature', {'renderer': 'd3'});
    });

    it('Add features to a layer', function () {
      var selection, nodes;

      nodes = [
        {y: 0, x: 0},
        {y: 10, x: 0},
        {y: -10, x: 0},
        {y: 10, x: 10}
      ];

      nodes[0].children = [nodes[1], nodes[2]];
      nodes[1].children = [nodes[3]];

      feature = layer.createFeature('graph')
        .data(nodes)
        .draw();
      stepAnimationFrame();

      selection = layer.canvas().selectAll('circle');
      expect(selection[0].length).toBe(4);

      selection = layer.canvas().selectAll('path');
      expect(selection[0].length).toBe(3);
    });

    it('Remove feature from a layer', function () {
      var selection;

      layer.deleteFeature(feature).draw();
      stepAnimationFrame();

      selection = layer.canvas().selectAll('circle');
      expect(selection[0].length).toBe(0);

      selection = layer.canvas().selectAll('path');
      expect(selection[0].length).toBe(0);
      unmockAnimationFrame();
    });
  });
});
