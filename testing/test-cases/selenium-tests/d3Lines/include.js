window.startTest = function (done) {
  'use strict';

  var mapOptions = { center: { y: 40, x: -105 } };

  var myMap = window.geoTests.createOsmMap(mapOptions);

  function draw(citieslatlon) {
    var layer = myMap.createLayer('feature', {'renderer': 'd3'});
    var n = citieslatlon.length / 2;
    var group1 = citieslatlon.filter(function (d, i) { return i < n; })
      .sort(function (d1, d2) {
        return d1.lon < d2.lon ? 1 : -1;
      });

    var group2 = citieslatlon.filter(function (d, i) { return i >= n; })
      .sort(function (d1, d2) {
        return d1.lat < d2.lat ? 1 : -1;
      });

    layer.createFeature('line')
      .data([group1, group2])
      .style('strokeColor', function (d, i, e, j) {
        if (j === 0) {
          return 'red';
        } else {
          return 'blue';
        }
      })
      .style('strokeOpacity', 0.5)
      .style('strokeWidth', 4)
      .position(function (d) {
        return { x: d.lon, y: d.lat };
      });

    myMap.draw();

    myMap.onIdle(done);
  }

  window.geoTests.loadCitiesData(draw, 100);
};
