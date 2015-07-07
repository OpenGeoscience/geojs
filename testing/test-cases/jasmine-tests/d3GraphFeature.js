/*global describe, it, expect*/

describe("d3 graph feature", function () {
  "use strict";

  var map, width = 800, height = 600, layer, feature;

  it("Setup map", function () {
    map = geo.map({node: "#map", center: [0, 0], zoom: 3});
    map.createLayer("osm");
    layer = map.createLayer("feature", {"renderer": "d3"});

    map.resize(0, 0, width, height);
  });

  it("Add features to a layer", function () {
    var selection, nodes;

    nodes = [
      {y: 0, x: 0},
      {y: 10, x: 0},
      {y: -10, x: 0},
      {y: 10, x: 10}
    ];

    nodes[0].children = [nodes[1], nodes[2]];
    nodes[1].children = [nodes[3]];

    feature = layer.createFeature("graph")
      .data(nodes)
      .draw();

    selection = layer.canvas().selectAll("circle");
    expect(selection[0].length).toBe(4);

    selection = layer.canvas().selectAll("path");
    expect(selection[0].length).toBe(3);
  });

  it("Remove feature from a layer", function () {
    var selection;

    layer.deleteFeature(feature).draw();

    selection = layer.canvas().selectAll("circle");
    expect(selection[0].length).toBe(0);

    selection = layer.canvas().selectAll("path");
    expect(selection[0].length).toBe(0);
  });
});
