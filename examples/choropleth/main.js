// Run after the DOM loads
$(function () {
  'use strict';

  // Define a function we will use to generate contours.
  function makeChoropleth(geoData, scalarData, layer) {
    /* There are two example data sets.  One has a position array which
     * consists of objects each with x, y, z values.  The other has a values
     * array which just has our contour values. */
    var choropleth = layer
        .createFeature('choropleth')
        .data(geoData)
        .scalar(scalarData)
        .choropleth({});

    return choropleth;
  }

  // Create a map object with the OpenStreetMaps base layer.
  var map = geo.map({
    node: '#map',
    center: {
      x: -98.5795,
      y: 39.8283
    },
    zoom: 4
  });

  // Add the osm layer
  map.createLayer(
    'osm'
  );

  // Create a feature layer.  We could either ask for a layer via a specific
  // render {renderer: 'vgl'} or for a layer that supports our feature
  // {features: ['choropleth']}.
  var choroplethLayer = map.createLayer(
    'feature',
    {
      features: ['choropleth']
    }
  );

  // Load the data
  $.ajax({
    url: 'states.json',
    dataType: 'json',
    success: function (geoData) {

      var mockScalarData = geoData
          .features
          .map(function (feature) {

            //create some mock value for each state
            return {
              value: Math.random() * 10,
              id: feature.properties.GEO_ID
            };
          });

      var choropleth =
          makeChoropleth(geoData.features, mockScalarData, choroplethLayer);

      setTimeout(function () {
        var mockScalarData2 = geoData
            .features
            .map(function (feature) {
              return {
                value: Math.random() * 10,
                id: feature.properties.GEO_ID
              };
            });

        choropleth
          .scalar(mockScalarData2);
        choropleth.draw();
      }, 5000);
      choropleth.draw();
    }
  });
});
