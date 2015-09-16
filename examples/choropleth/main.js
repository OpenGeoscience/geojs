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
	.data(geoData.features)
        .scalar(scalarData)
	.choropleth({});

    return choropleth;
  }

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
  var vglLayer = map.createLayer(
    'feature',
    {
      renderer: 'vgl'
    }
  );

  // Load the data
  $.ajax({
    url: 'states.json',
    dataType: "json",
    success: function (geoData) {

      var mockScalarData = geoData
          .features
          .map(function(feature){
	    //create some mock value for each state
	    return {
              value: Math.random()*10,
              id: feature.properties.GEO_ID
            };
          });

      makeChoropleth(geoData, mockScalarData, vglLayer);
      // Draw the map
      map.draw();
    }
  });
});
