// Run after the DOM loads
$(function () {
  'use strict';

  // Create a map object
  var map = geo.map({
    node: '#map',
    center: {
      x: -98.0,
      y: 39.5
    },
    zoom: 3
  });

  // Add the osm layer with a custom tile url
  map.createLayer(
    'osm',
    {
      url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tile data from <a href="https://basemap.nationalmap.gov/">USGS</a>'
    }
  );
});
