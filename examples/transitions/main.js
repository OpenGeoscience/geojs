// Run after the DOM loads
$(function () {
  'use strict';

  // Create a map object
  var map = geo.map({
    node: '#map',
    zoom: 6,
    center: {x: 28.9550, y: 41.0136}
  });

  // Add an OSM layer
  var osm = map.createLayer('osm',{
    baseUrl: 'http://otile1.mqcdn.com/tiles/1.0.0/map'
  });

  // Bind button clicks to map transitions
  $('#pan-to-london').click(function () {
    map.transition({
      center: {x: -0.1275, y: 51.5072},
      duration: 2000
    });
  });

  $('#elastic-to-moscow').click(function () {
    map.transition({
      center: {x: 37.6167, y: 55.7500},
      duration: 2000,
      ease: function (t) {
        return Math.pow(2.0, -10.0 * t) * Math.sin((t - 0.075) * (2.0 * Math.PI) / 0.3) + 1.0;
      }
    });
  });

  $('#bounce-to-istanbul').click(function () {
    map.transition({
      center: {x: 28.9550, y: 41.0136},
      duration: 2000,
      ease: function (t) {
        var r = 2.75;
        var s = 7.5625;
        if (t < 1.0 / r) {
          return s * t * t;
        }
        if (t < 2.0 / r) {
          t -= 1.5 / r;
          return s * t * t + 0.75;
        }
        if (t < 2.5 / r) {
          t -= 2.25 / r;
          return s * t * t + 0.9375;
        }
        t -= 2.625 / r;
        return s * t * t + 0.984375;
      }
    });
  });

  $('#fly-to-bern').click(function () {
    map.transition({
      center: {x: 7.4500, y: 46.9500},
      duration: 2000,
      interp: d3.interpolateZoom
    });
  });
});
