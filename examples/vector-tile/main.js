$(function () {
  'use strict';

  // Create a map object with the OpenStreetMaps base layer.
  var map = geo.map({
    node: '#map',
    center: {
      x: -75.965,
      y: 39.482
    },
    zoom: 4
  });

  // Add the osm layer
  map.createLayer(
    'osm'
  );

  // Create a gl feature layer
  var layer = map.createLayer(
    'feature', {features: ['vector']}
  );

  function fetch_data() {
    var url = './data/countries.geojson';
    $.ajax(url, {
      success: function (resp) {
        console.log(resp, resp.features)
        layer.createFeature('vector')
             .data(resp.features);
      }
    });
  }
  fetch_data();
  /* We could draw the two features as we create them.  Instead, this ensures
   * that all features get drawn. */
  map.draw();
});
