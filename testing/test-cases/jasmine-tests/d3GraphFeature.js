/*global describe, it, expect*/

describe("d3 graph feature", function () {
  "use strict";

  var map, width = 800, height = 600, layer, feature;

  map = geo.map({node: "#map", center: [0, 0], zoom: 3});
  map.createLayer("osm");
  layer = map.createLayer("feature", {"renderer": "d3Renderer"});

  map.resize(0, 0, width, height);

  it("Add features to a layer", function () {
    var selection, nodes;
    
    nodes = [
      geo.latlng(0, 0),
      geo.latlng(10, 0),
      geo.latlng(-10, 0),
      geo.latlng(10, 10)
    ];

    nodes[0].children = [nodes[1], nodes[2]];
    nodes[1].children = [nodes[3]];
        
    feature = layer.createFeature("graph")
      .nodes(nodes)
      .style({
        nodes: {
          color: [1, 0, 0],
          size: [5]
        },
        links: {
          color: [1, 1, 1],
          width: [2]
        },
        linkType: "path"
      });

    selection = d3.select("#map svg").selectAll("circle");
    expect(selection[0].length).toBe(0);

    selection = d3.select("#map svg").selectAll("path");
    expect(selection[0].length).toBe(0);
  });

  it("Call draw on feature", function () {
    var selection;

    feature.draw();

    selection = d3.select("#map svg").selectAll("circle");
    expect(selection[0].length).toBe(4);

    selection = d3.select("#map svg").selectAll("path");
    expect(selection[0].length).toBe(3);
  });

  it("Remove feature from a layer", function () {
    var selection;

    layer.deleteFeature(feature).draw();

    selection = d3.select("#map svg").selectAll("circle");
    expect(selection[0].length).toBe(0);

    selection = d3.select("#map svg").selectAll("path");
    expect(selection[0].length).toBe(0);
  });
});
