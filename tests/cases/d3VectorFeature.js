var createMap = require('../test-utils').createMap;
var d3 = require('d3');
var mockAnimationFrame = require('../test-utils').mockAnimationFrame;
var stepAnimationFrame = require('../test-utils').stepAnimationFrame;
var unmockAnimationFrame = require('../test-utils').unmockAnimationFrame;

describe('d3 vector feature', function () {
  'use strict';

  var map, layer, feature1;

  it('Create a map with a d3 feature layer', function () {
    mockAnimationFrame();
    map = createMap({
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

    layer = map.createLayer('feature', {'renderer': 'd3'});
  });

  it('Add features to a layer', function () {
    var vectorLines, featureGroup, markers;
    feature1 = layer.createFeature('vector')
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
    stepAnimationFrame();

    vectorLines = d3.select('#map').selectAll('line');
    expect(vectorLines.size()).toBe(3);

    featureGroup = d3.selectAll('g#' + feature1._d3id());
    expect(featureGroup.size()).toBe(1);

    markers = d3.selectAll('marker');
    expect(markers.size()).toBe(3);

    markers.each(function () {
      var m = d3.select(this);
      var markerClass = m.attr('class');
      var match = markerClass.match(/geo-vector-arrow/);
      expect(match).not.toBeNull();
    });

  });

  it('Remove a feature from a layer', function () {
    var selection, markers;

    layer.deleteFeature(feature1).draw();
    stepAnimationFrame();

    selection = d3.select('#map').selectAll('line');
    expect(selection.size()).toBe(0);

    markers = d3.selectAll('markers');
    expect(markers.size()).toBe(0);
  });

  it('Correctly sets the marker references of the specified style for each vector', function () {
    var vectorLines;
    var options = ['arrow', 'wedge', 'bar'];
    var correspondingClasses = ['geo-vector-arrow', 'geo-vector-wedge', 'geo-vector-bar'];
    feature1 = layer.createFeature('vector')
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
      originStyle: function (d, i) {
        return options[i];
      },
      endStyle: 'arrow'
    })
    .draw();
    stepAnimationFrame();

    vectorLines = d3.select('#map').selectAll('line');
    expect(vectorLines.size()).toBe(3);

    vectorLines.each(function (v, i) {
      v = d3.select(this);
      var startId = v.attr('marker-start');
      var endId = v.attr('marker-end');
      //sanity test to make sure head and tail markers get correct prefix in id's.
      expect(startId.search(/tail/)).not.toBe(-1);
      expect(endId.search(/head/)).not.toBe(-1);

      var startMarker = d3.select(startId.match(/url\((.*)\)/)[1]);
      var endMarker = d3.select(endId.match(/url\((.*)\)/)[1]);
      expect(endMarker.classed('geo-vector-arrow')).toBe(true);
      expect(startMarker.classed(correspondingClasses[i])).toBe(true);
    });

  });

  it('Cleanup', function () {
    unmockAnimationFrame();
  });
});
