window.startTest = function (done) {
  'use strict';

  var mapOptions = { center : { y: 40.0, x: -105.0 }, zoom: 4 };

  var myMap = window.geoTests.createOsmMap(mapOptions, {}, true);

  window.geoTests.loadCitiesData(function (citieslatlon) {
      var layer = myMap.createLayer('feature');
      layer.createFeature('point')
        .data(citieslatlon)
        .style('fillColor', {r: 0.0, g: 0.0, b: 1.0})
        .style('strokeColor', {r: 1.0, g: 0.0, b: 0.0})
        .style('fillOpacity', 0.2)
        .style('strokeOpacity', 0.2)
        .position(function (d) { return {x: d.lon, y: d.lat, z: d.elev}; });
      myMap.draw();
      myMap.onIdle(done);
    });
};
