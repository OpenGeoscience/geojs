window.startTest = function(done) {
  'use strict';

  var mapOptions = { center : { y: 40, x: -105 } };

  var myMap = window.geoTests.createOsmMap(mapOptions);

  function draw(citieslatlon) {
    var layer = myMap.createLayer('feature', {'renderer': 'd3Renderer'});

    citieslatlon.sort(function (d1, d2) {
      return d1.lon < d2.lon ? 1 : -1;
    });
    layer.createFeature('line')
      .data([citieslatlon])
      .style('strokeColor', function () {
        return {r: 1.0, g: 0.0, b: 0.0};
      })
      .style('strokeOpacity', function () {
          return 0.5;
        }
      )
      .style('strokeWidth', function () {
        return 4;
      })
      .position(function (d) { return { x: d.lon, y: d.lat }; });

    myMap.draw();

    myMap.onIdle(done);
  }

  window.geoTests.loadCitiesData(draw, 100);
};
