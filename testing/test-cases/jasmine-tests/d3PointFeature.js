/*global describe, it, expect*/

describe("d3 point feature", function () {
  "use strict";

  var map, width = 800, height = 600, layer, feature1, feature2, feature3;

  it("Setup map", function () {
    map = geo.map({node: "#map", center: [0, 0], zoom: 3});
    map.createLayer("osm");
    layer = map.createLayer("feature", {"renderer": "d3"});

    map.resize(0, 0, width, height);
  });

  it("Add features to a layer", function () {
    var selection;
    feature1 = layer.createFeature("point", {selectionAPI: true})
      .data([{y: 0, x: 0}, {y: 10, x: 0}, {y: 0, x: 10}])
      .draw();

    selection = d3.select("#map svg").selectAll("circle");
    expect(selection[0].length).toBe(3);

    feature2 = layer.createFeature("point")
      .data([{y: -10, x: -10}, {y: 10, x: -10}])
      .draw();

    selection = d3.select("#map svg").selectAll("circle");
    expect(selection[0].length).toBe(5);

    feature3 = layer.createFeature("point")
      .data([{y: -10, x: 10}])
      .draw();

    selection = d3.select("#map svg").selectAll("circle");
    expect(selection[0].length).toBe(6);
  });

  it("Validate selection API option", function () {
    expect(feature1.selectionAPI()).toBe(true);
    expect(feature2.selectionAPI()).toBe(false);
  });

  it("Remove a feature from a layer", function () {
    var selection;

    layer.deleteFeature(feature2).draw();

    selection = d3.select("#map svg").selectAll("circle");
    expect(selection[0].length).toBe(4);
  });
  it("Remove all features from a layer", function () {
    var selection;

    layer.clear().draw();
    map.draw();

    selection = d3.select("#map svg").selectAll("circle");
    expect(selection[0].length).toBe(0);
  });
});
