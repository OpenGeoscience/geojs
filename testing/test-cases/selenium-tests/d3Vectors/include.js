window.startTest = function (done) {
  'use strict';

  var mapOptions = { center : { y: 40, x: -105 } };

  var myMap = window.geoTests.createOsmMap(mapOptions);

  function draw(citieslatlon) {
    var layer = myMap.createLayer('feature', {'renderer' : 'd3'});

    var vectors = layer.createFeature('vector')
      .data(citieslatlon)
      .origin(function (d) { return { x: d.lon, y: d.lat }; });

    function setDelta() {
      var center = myMap.center();
      vectors.delta(function (d) {
        return {
          x: center.x - d.lon,
          y: d.lat - center.y
        };
      }).draw();
    }

    setDelta();
    myMap.draw();

    myMap.onIdle(done);
    layer.geoOn(geo.event.pan, setDelta);
  }

  window.geoTests.loadCitiesData(draw, 30);
};
