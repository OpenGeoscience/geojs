/*global describe, it, expect*/

describe("d3 vector feature", function () {
  "use strict";

  var map, width = 800, height = 600, layer, feature1;

  map = geo.map({node: "#map",
    center: [0, 0],
    zoom: 3,
    width: 100,
    height: 100
  });

  var cl = map.createLayer;
  map.createLayer = function (type, opts) {
    opts = opts || {};
    opts.renderer = 'd3';
    return cl.call(map, type, opts);
  };

  map.displayToGcs = function (pt) {
    return pt;
  };
  map.gcsToDisplay = function (pt) {
    return pt;
  };

  layer = map.createLayer("feature", {"renderer": "d3"});

  it("Add features to a layer", function () {
    var vectorLines, featureGroup, markers;
    feature1 = layer.createFeature("vector")
    .data([{y: 0, x: 0}, {y: 10, x: 0}, {y: 0, x: 10}])
    .origin(function (d) {
      return {
        x: d.x,
        y: d.y
      };
    })
    .delta(function (d) {
      var target = {x: 5, y: 5};
      return {
        x: target.x - d.x,
        y: target.y - d.y
      };
    })
    .style({
      originStyle: 'none',
      endStyle: 'arrow'
    })
    .draw();

    vectorLines = d3.select("#map svg").selectAll('line');
    expect(vectorLines.size()).toBe(3);

    featureGroup = d3.selectAll('g#' + feature1._d3id());
    expect(featureGroup.size()).toBe(1);

    markers = d3.selectAll('marker');
    expect(markers.size()).toBe(3);
  });

  it("Remove a feature from a layer", function () {
    var selection, markers;

    layer.deleteFeature(feature1).draw();

    selection = d3.select("#map svg").selectAll('line');
    expect(selection.size()).toBe(0);

    markers = d3.selectAll('markers');
    expect(markers.size()).toBe(0);
  });
});
