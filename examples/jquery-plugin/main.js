// Run after the DOM loads
$(function () {
  'use strict';

  // Create a map object
  $('#map').geojsMap({
    center: {
      x: -100,
      y: 40
    },
    zoom: 1,
    renderer: 'd3Renderer',
    points: {
      radius: function (d) { return 3 + d.exp; },
      position: function (d) { return {x: d.position.x, y: d.position.y}; },
      fill: true,
      fillColor: function (d) { return d.color; },
      fillOpacity: function (d) { return 0.5 + d.unif / 2; },
      stroke: true,
      strokeColor: 'black',
      strokeOpacity: 1,
      strokeWidth: 2
    }
  });

  // Load a data file
  $.ajax({
    dataType: 'json',
    url: 'data.json',
    success: function (data) {
      // Draw the points in the map
      $('#map').geojsMap('points', {data: data});
    }
  });
});
