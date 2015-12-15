window.startTest = function (done) {
  'use strict';

  var mapOptions = {
    center : {y: 40.0, x: -105.0},
    parallelProjection: true,
    discreteZoom: true,
    zoom: 8
  };
  var osmOpts = {
    url: '/data/tilefancy.png'
  };

  var myMap = window.geoTests.createOsmMap(mapOptions, osmOpts);

  myMap.draw();
  myMap.onIdle(done);
};
