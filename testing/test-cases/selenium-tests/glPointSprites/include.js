window.startTest = function (done) {
  'use strict';

  var mapOptions = { center : { y: 40.0, x: -105.0 } };

  var myMap = window.geoTests.createOsmMap(mapOptions);

  // Load image to be used for drawing dots
  var image = new Image();
  image.src = '/data/spark.png';

  image.onload = function () {
      window.geoTests.loadCitiesData(function (citieslatlon) {
          var layer = myMap.createLayer('feature');
          layer.createFeature('point', {primitiveShape: 'sprites'})
            .data(citieslatlon)
            .position(function (d) { return {x: d.lon, y: d.lat, z: d.elev}; });
          myMap.draw();
          myMap.onIdle(done);
        });
    };
};
