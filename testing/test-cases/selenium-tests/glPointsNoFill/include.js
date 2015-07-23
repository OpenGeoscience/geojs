window.startTest = function (done) {
  'use strict';

  var mapOptions = { center : { y: 40.0, x: -105.0 }, zoom: 6};

  var myMap = window.geoTests.createOsmMap(mapOptions, {}, true);

  window.geoTests.loadCitiesData(function (citieslatlon) {
      var layer = myMap.createLayer('feature');
      layer.createFeature('point')
        .data(citieslatlon)
        .style('radius', 10.0)
        .style('fill', false)
        .style('strokeColor', { r: 0.0, g: 1.0, b: 0.0 })
        .style('strokeWidth', 2)
        .position(function (d) { return {x: d.lon, y: d.lat, z: d.elev}; });
      myMap.draw();
      myMap.onIdle(done);
    });
};
