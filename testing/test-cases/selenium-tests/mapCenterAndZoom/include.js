window.startTest = function(done) {
  'use strict';

  var options = { center: { x: 78, y: 21 } };
  var myMap = window.geoTests.createOsmMap(options);

  // give the tiles a chance to load
  myMap.onIdle(done);
};
