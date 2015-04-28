
window.startTest = function (done) {
  'use strict';

  window.geo_mouse_moves = 0;
  $('#map').attr('geo-moves', window.geo_mouse_moves);
  var map = window.geoTests.createOsmMap({}, {}, true);
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
  map.draw();
  done();
};
