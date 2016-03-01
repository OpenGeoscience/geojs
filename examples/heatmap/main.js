var heatmapDebug = {};

// Run after the DOM loads
$(function () {
  'use strict';

  var map = geo.map({
    node: '#map',
    center: {
      x: -122.445,
      y: 37.8
    },
    zoom: 6
  });

  $.ajax('https://s3.amazonaws.com/uploads.hipchat.com/446632/3114847/4dZfl0YfZpTfYzq/AdderallCities2015.csv', {
    success: function (resp) {
      var rows = resp.split(/\r\n|\n|\r/);
      rows = rows.map( function (r) {
        var fields = r.split(',');
        return [fields[12], fields[24], fields[25]].map(parseFloat);
      });
      rows.splice(0, 1);

      var layer = map.createLayer('feature', {renderer: 'canvas'});
      var heatmap = layer.createFeature('heatmap')
        .intensity(function (d) {
          return d[0];
        })
        .position(function (d) {
          return {
            x: d[2],
            y: d[1]
          };
        })
        .data(rows)
        .style('radius', 5);

      map.draw();
    }
  });

  var base = map.createLayer('osm');
  map.draw();
  heatmapDebug.map = map;
  heatmapDebug.layer = layer;
  heatmapDebug.heatmap = heatmap;
});
