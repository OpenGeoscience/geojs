window.startTest = function (done) {
  'use strict';

  var options = { center: { x: -85, y: 30 }, zoom: 4 };
  var myMap = window.geoTests.createOsmMap(options).draw();

  window.setTimeout(function () {
    myMap.bounds({lowerLeft: {x: 111, y: -40}, upperRight: {x: 154, y: -5}});
    myMap.onIdle(done);
  }, 250);

};
