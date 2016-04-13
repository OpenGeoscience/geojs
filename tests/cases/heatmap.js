// Test geo.core.osmLayer
var geo = require('../test-utils').geo;
var $ = require('jquery');

beforeEach(function () {
  $('<div id="map-canvas-heatmap-feature"/>').appendTo('body')
    .css({width: '500px', height: '400px'});
});

afterEach(function () {
  $('#map-canvas-heatmap-feature').remove();
});

describe('canvas heatmap feature', function () {
  'use strict';

  var mockAnimationFrame = require('../test-utils').mockAnimationFrame;
  var stepAnimationFrame = require('../test-utils').stepAnimationFrame;
  var unmockAnimationFrame = require('../test-utils').unmockAnimationFrame;

  var map, width = 800, height = 600, layer, feature1,
      testData = [[0.6, 42.8584, -70.9301],
                  [0.233, 42.2776, -83.7409],
                  [0.2, 42.2776, -83.7409]];

  it('Setup map', function () {
    map = geo.map({node: '#map-canvas-heatmap-feature', center: [0, 0], zoom: 3});
    layer = map.createLayer('feature', {'renderer': 'canvas'});
    map.resize(0, 0, width, height);
  });

  it('Add features to a layer', function () {
    feature1 = layer.createFeature('heatmap')
      .data(testData)
      .intensity(function (d) {
        return d[0];
      })
      .position(function (d) {
        return {
          x: d[2],
          y: d[1]
        };
      })
      .style('radius', 5)
      .style('blurRadius', 15)
      .style('opacity', 1.0);

    mockAnimationFrame();
    map.draw();
    stepAnimationFrame(new Date().getTime());
    expect(layer.children().length).toBe(1);
    unmockAnimationFrame();
  });

  it('Validate selection API option', function () {
    expect(feature1.selectionAPI()).toBe(false);
  });

  it('Validate position', function () {
    expect(feature1.position()([0.6, 42.8584, -70.9301]))
      .toEqual({x:-70.9301, y:42.8584});
  });

  it('Validate maximum intensity', function () {
    expect(feature1.maxIntensity()).toBe(0.6);
  });

  it('Validate minimum intensity', function () {
    expect(feature1.minIntensity()).toBe(0.2);
  });

  it('Remove a feature from a layer', function () {
    layer.deleteFeature(feature1).draw();
    expect(layer.children().length).toBe(0);
  });

  it('Compute gradient', function () {
    feature1.style('color', {0:    {r: 0, g: 0, b: 0.0, a: 0.0},
                             0.25: {r: 0, g: 0, b: 1, a: 0.5},
                             0.5:  {r: 0, g: 1, b: 1, a: 0.6},
                             0.75: {r: 1, g: 1, b: 0, a: 0.7},
                             1:    {r: 1, g: 0, b: 0, a: 0.1}});
    feature1._computeGradient();
    expect(layer.node()[0].children[0].getContext('2d')
      .getImageData(1, 0, 1, 1).data.length).toBe(4);
  });
});
