/*global window, geo*/
window.startTest = function (done) {
  "use strict";

  var mapOptions = {center: {y: 40, x: -105}},
      myMap = window.geoTests.createOsmMap(mapOptions),
      layer = myMap.createLayer("feature", {"renderer": "d3Renderer"}),
      points = layer.createFeature("point"),
      clock = myMap.clock();

  function draw(data) {

    points
      .data(data.slice(0, 10))
      .position(function (d) { return {x: d.lon, y: d.lat}; })
      .style({
        radius: 5,
        color: "red",
        stroke: false
      })
      .draw();

    myMap.geoOn(geo.event.clock.change, function () {
      var i = clock.now().valueOf();
      var latlng = data.slice(i, i + 10);
      points.data(latlng).draw();
    });

    clock.start(0).end(100).step(1).now(0);

    myMap.onIdle(done);
  }

  window.geoTests.loadCitiesData(draw);

  window.animateForward = function (nFrames, done) {
    var i;
    for (i = 0; i < nFrames; i += 1) {
      clock.stepForward();
    }
    if (done) {
      myMap.onIdle(done);
    }
  };

  window.animateBackward = function (nFrames, done) {
    var i;
    for (i = 0; i < nFrames; i += 1) {
      clock.stepBackward();
    }
    if (done) {
      myMap.onIdle(done);
    }
  };

  window.animateToEnd = function (done) {
    clock.loop(0);
    clock.state("play");
    myMap.geoOn(geo.event.clock.stop, function () {
      myMap.onIdle(done);
    });
  };
};
