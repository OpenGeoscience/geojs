window.startTest = function (done) {
  'use strict';

  var options = {
    center: { x: -80, y: 30 },
    zoom: 2,
    clampZoom: true,
    clampBoundsX: false,
    clampBoundsY: false,
    maxZoom: 4
  };
  var myMap = window.geoTests.createOsmMap(options).draw();
  myMap.bounds({left: 113, right: 153, bottom: -45, top: -5});

  window.setTimeout(function () {
    myMap.onIdle(done);
  }, 250);
};
