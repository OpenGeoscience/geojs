window.startTest = function (done) {
  'use strict';

  var mapOptions = { zoom: 3.5, center : { y: 40, x: -105 } };

  var myMap = window.geoTests.createOsmMap(mapOptions);

  function draw(citieslatlon) {
    var layer = myMap.createLayer('feature', {'renderer' : 'd3'});
    var color = d3.scale.category20().domain(d3.range(20));

    var vectors = layer.createFeature('vector')
      .data(citieslatlon)
      .origin(function (d) { return { x: d.lon, y: d.lat }; })
      .style('strokeColor', function (d, i) {
        return color(i % 20);
      })
      .style('strokeWidth', 2.5);

    function setDelta() {
      var center = myMap.center();
      vectors.delta(function (d) {
        return {
          x: center.x - d.lon,
          y: center.y - d.lat
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
