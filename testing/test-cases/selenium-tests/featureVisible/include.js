
window.startTest = function (done) {
  'use strict';

  window.geo_mouse_moves = 0;
  $('#map').attr('geo-moves', window.geo_mouse_moves);
  var map = window.geoTests.createOsmMap({zoom: 8}, {}, true);
  var feature = map.createLayer('feature').createFeature('point', {selectionAPI: true});

  feature.data([0])
      .position(function () { return {x: 0, y: 0}; })
      .style({radius: 1000})
      .geoOn(geo.event.feature.mousemove, function () {
        // keep track of the number of mouse moves triggered
        window.geo_mouse_moves += 1;
        $('#map').attr('geo-moves', window.geo_mouse_moves);
      });
  window.geo_feature = feature;
  window.geo_wait_count = 0;

  // Used to block the python process waiting for an action to finish
  window.geo_is_done = function (i) {
    return window.geo_wait_count >= i;
  };
  window.geo_wait = function () {
    var c = window.geo_wait_count + 1;
    map.draw();
    map.onIdle(function () {
      window.geo_wait_count += 1;
    });
    return c;
  };

  map.draw();
  map.onIdle(done);
};
