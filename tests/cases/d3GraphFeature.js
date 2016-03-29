var geo = require('../test-utils').geo;
var $ = require('jquery');

beforeEach(function () {
  $('<div id="map-d3-graph-feature"/>').appendTo('body')
    .css({width: '500px', height: '400px'});
});

afterEach(function () {
  $('#map-d3-graph-feature').remove();
});

describe('d3 graph feature', function () {
  'use strict';

  var map, layer, feature;

  it('Setup map', function () {
    map = geo.map({node: '#map-d3-graph-feature', center: [0, 0], zoom: 3});
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

    selection = layer.canvas().selectAll('circle');
    expect(selection[0].length).toBe(4);

    selection = layer.canvas().selectAll('path');
    expect(selection[0].length).toBe(3);
  });

  it('Remove feature from a layer', function () {
    var selection;

    layer.deleteFeature(feature).draw();

    selection = layer.canvas().selectAll('circle');
    expect(selection[0].length).toBe(0);

    selection = layer.canvas().selectAll('path');
    expect(selection[0].length).toBe(0);
  });
});
