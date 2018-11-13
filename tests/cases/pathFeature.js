describe('path feature', function () {
  var $ = require('jquery');
  var geo = require('../test-utils').geo;
  var createMap = require('../test-utils').createMap;
  var destroyMap = require('../test-utils').destroyMap;
  var mockAnimationFrame = require('../test-utils').mockAnimationFrame;
  var stepAnimationFrame = require('../test-utils').stepAnimationFrame;
  var unmockAnimationFrame = require('../test-utils').unmockAnimationFrame;

  var map, layer;

  beforeEach(function () {
    mockAnimationFrame();
    map = createMap();
    layer = map.createLayer('feature', {'features': ['path']});
  });

  afterEach(function () {
    destroyMap();
    unmockAnimationFrame();
  });

  describe('create', function () {
    it('direct create', function () {
      var path = geo.pathFeature({layer: layer});
      expect(path instanceof geo.pathFeature).toBe(true);
    });
  });
  describe('Check public class methods', function () {
    it('position', function () {
      var feature = layer.createFeature('path');
      expect(feature.position()('a')).toBe('a');
      expect(feature.position(function () { return 'b'; })).toBe(feature);
      expect(feature.position()('a')).toBe('b');
    });
  });
  describe('usage', function () {
    it('default', function () {
      var feature = layer.createFeature('path');
      expect(feature instanceof geo.pathFeature).toBe(true);
      feature.data([{x: 4, y: 52}, {x: 5, y: 53}, {x: 4, y: 53.05}]).draw();
      stepAnimationFrame();
      expect($('#map svg path').length).toBe(2);
    });
    it('position accessor', function () {
      layer.createFeature('path', {
        style: {strokeColor: 'black', strokeWidth: 4},
        position: function (d, i) { return {x: d[0], y: d[1]}; }
      }).data([[4, 52], [5, 53], [4, 53.05]]).draw();
      stepAnimationFrame();
      expect($('#map svg path').length).toBe(2);
    });
  });
});
