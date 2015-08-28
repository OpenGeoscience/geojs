window.startTest = function (done) {
  'use strict';

  var mapOptions = { center : { y: 40.3, x: -99.0 }, zoom: 2 };

  var myMap = window.geoTests.createOsmMap(mapOptions);
  window.myMap = myMap;

  window.geoTests.loadCitiesData(function (citieslatlon) {
      var layer = myMap.createLayer('feature');
      layer.createFeature('point')
        .clustering(true)
        .data(citieslatlon)
        .style('radius', function (d) {
          if (d.__cluster) {
            return 10.0;
          }
          return 6;
        })
        .style('strokeColor', 'black')
        .style('strokeWidth', function (d) {
          if (d.__cluster) {
            return 2;
          }
          return 0;
        })
        .style('fillColor', function (d) {
          if (d.__cluster) {
            return 'grey';
          }
          return 'red';
        })
        .style('fillOpacity', function (d) {
          if (d.__cluster) {
            return 0.25;
          } else {
            return 1;
          }
        })
        .position(function (d) { return {x: d.lon, y: d.lat, z: d.elev}; });
      myMap.draw();
      myMap.onIdle(done);
    });
};
