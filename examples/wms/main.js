// Run after the DOM loads
$(function () {
  'use strict';

  // Create a map object
  var map = geo.map({
    node: '#map',
    zoom: 2,
    center: {x: -98.0, y: 39.5}
  });

  // Add an OSM layer
  var osm = map.createLayer('osm',{
    baseUrl: 'http://otile1.mqcdn.com/tiles/1.0.0/sat'
  });

  // Add an OSM layer with a WMS server as the source of its titles
  var wms = map.createLayer('osm');

  // Set the geographic coordinate system for the layer
  wms.gcs('EPSG:4326');

  wms.tileUrl(
    function (zoom, x, y) {
      // Compute the bounding box
      var xLowerLeft = geo.mercator.tilex2long(x, zoom);
      var yLowerLeft = geo.mercator.tiley2lat(y + 1, zoom);
      var xUpperRight = geo.mercator.tilex2long(x + 1, zoom);
      var yUpperRight = geo.mercator.tiley2lat(y, zoom);

      // Set the WMS server parameters
      var params = {
        'SERVICE': 'WMS',
        'VERSION': '1.3.0',
        'REQUEST': 'GetMap',
        'LAYERS': 'topp:states',  // US Population
        'STYLES': '',
        'BBOX': xLowerLeft + ',' + yLowerLeft + ',' + xUpperRight + ',' + yUpperRight,
        'WIDTH': wms.width(),
        'HEIGHT': wms.height(),
        'FORMAT': 'image/png',
        'TRANSPARENT': true,
        'TILED': true
      };

      var baseUrl = 'http://demo.boundlessgeo.com/geoserver/ows';  // OpenGeo Demo Web Map Service
      return baseUrl + '?' + $.param(params);
    }
  );
});
