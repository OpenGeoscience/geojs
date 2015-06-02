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

  // Set the geographic coordinate system for the layer to web mercator (EPSG:3857)
  var projection = 'EPSG:3857';
  wms.gcs(projection);

  wms.tileUrl(
    function (zoom, x, y) {
      // Compute the bounding box
      var xLowerLeft = geo.mercator.tilex2long(x, zoom);
      var yLowerLeft = geo.mercator.tiley2lat(y + 1, zoom);
      var xUpperRight = geo.mercator.tilex2long(x + 1, zoom);
      var yUpperRight = geo.mercator.tiley2lat(y, zoom);

      var sw = geo.mercator.ll2m(xLowerLeft, yLowerLeft, true);
      var ne = geo.mercator.ll2m(xUpperRight, yUpperRight, true);
      var bbox_mercator = sw.x + ',' + sw.y + ',' + ne.x + ',' + ne.y;

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

      var baseUrl = 'http://demo.boundlessgeo.com/geoserver/ows';  // OpenGeo Demo Web Map Service
      return baseUrl + '?' + $.param(params);
    }
  );
});
