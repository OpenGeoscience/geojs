// Run after the DOM loads
$(function () {
  'use strict';

  // Create a map object
  var map = geo.map({
    node: '#map',
    zoom: 4,
    center: {x: -98.0, y: 39.5}
  });

  // Add an OSM layer with a WMS server as the source of its titles
  var wms = map.createLayer('osm', {keepLower: false, attribution: null});

  var projection = 'EPSG:3857';

  wms.url(
    function (x, y, zoom) {
      // Compute the bounding box
      var bb = this.gcsTileBounds({x: x, y: y, level: zoom}, projection);
      var bbox_mercator = bb.left + ',' + bb.bottom + ',' + bb.right + ',' + bb.top;

      // Set the WMS server parameters
      var params = {
        'SERVICE': 'WMS',
        'VERSION': '1.3.0',
        'REQUEST': 'GetMap',
        'LAYERS': 'topp:states',  // US Population
        'STYLES': '',
        'BBOX': bbox_mercator,
        'WIDTH': 256, //Use 256x256 tiles
        'HEIGHT': 256,
        'FORMAT': 'image/png',
        'TRANSPARENT': true,
        'SRS': projection,
        'TILED': true
      };

      // OpenGeo Demo Web Map Service
      var baseUrl = 'https://demo.boundlessgeo.com/geoserver/ows';
      return baseUrl + '?' + $.param(params);
    }
  );
});
