window.startTest = function (done) {
  'use strict';

  var mapOptions = { center : { y: 40.0, x: -105.0 } };

  var myMap = window.geoTests.createOsmMap(mapOptions);

  window.geoTests.loadCitiesData(function (citieslatlon) {
      var layer = myMap.createLayer('feature');
      layer.createFeature('point')
        .data(citieslatlon)
        .style('fill', function (d) {
          return false;
        })
        .position(featurenction (d) { return {x: d.lon, y: d.lat, z: d.elev}; });
      myMap.draw();
      myMap.onIdle(done);
    });
};
