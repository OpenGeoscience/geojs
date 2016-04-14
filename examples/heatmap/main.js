// Run after the DOM loads
$(function () {
  'use strict';

  var map = geo.map({
    node: '#map',
    center: {
      x: -98,
      y: 39
    },
    zoom: 3
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
                      .data(rows)
                      .intensity(function (d) {
                        return d[0];
                      })
                      .position(function (d) {
                        return {
                          x: d[2],
                          y: d[1]
                        };
                      })
                      .style('radius', 10)
                      .style('blurRadius', 30)
                      .style('opacity', 1.0)
                      .style('color',
                        {0:    {r: 0, g: 0, b: 0, a: 0.0},
                         0.25: {r: 0, g: 1, b: 0, a: 0.5},
                         0.5:  {r: 1, g: 1, b: 0, a: 0.8},
                         1:    {r: 1, g: 0, b: 0, a: 1.0}});
      map.draw();
    }
  });

  var base = map.createLayer('osm');
  map.draw();
});
