window.startTest = function (done) {
  'use strict';

  var mapOptions = { center : { y: 40.0, x: -105.0 } };

  var myMap = window.geoTests.createOsmMap(mapOptions);

  window.geoTests.loadCitiesData(function (citieslatlon) {
      var layer = myMap.createLayer('feature');
      layer.createFeature('point')
        .data(citieslatlon)
        .style('stroke', false)
        .style('fillColor', function (d) {
          if (d.lon < -100) {
            return {r: 1.0, g: 0.0, b: 0.0};
          }
          return {r: 0.0, g: 0.0, b: 1.0};
        })
        .style('fillOpacity', function (d) {
          if (d.lon < -100) {
            return 0.5;
          } else {
            return 0.25;
          }
        })
        .position(function (d) { return {x: d.lon, y: d.lat, z: d.elev}; });
      myMap.draw();
      myMap.onIdle(done);
    });
};
