window.startTest = function(done) {
  'use strict';

  var mapOptions = { center : { y: 40, x: -105 } };

  var myMap = window.geoTests.createOsmMap(mapOptions);

  var data = [
    { "type": "Feature", "geometry": { "type": "Polygon", "coordinates": [
      [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ] ] },
      "properties": { "prop0": "value0", "prop1": {"this": "that"} }
    }
  ];

  // Load image to be used for drawing dots
  var layer = myMap.createLayer('feature');
  layer.createFeature('polygon')
      .data(data)
      .polygon(function (d) { return {
        'outer': d.geometry.coordinates[0]
        }
      })
      .position(function (d, index, d2, index2) {
        return {x: d2[0],
                y: d2[1], z: 0.0} })
      .style('fillOpacity', 0.5)
      .style('fillColor', { r: 1, g: 0.8, b: 0 });

  myMap.draw();
  myMap.onIdle(done);
};
