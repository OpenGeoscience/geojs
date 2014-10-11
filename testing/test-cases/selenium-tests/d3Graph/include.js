window.startTest = function (done) {
  'use strict';

  $('#map').width('100%');
  $('#map').height('100%');

  var mapOptions = { center : { y: 40, x: -105 }};

  var myMap = window.geoTests.createOsmMap(mapOptions);


  function draw(citieslatlon) {
    citieslatlon.forEach(function (c, i) {
        c.children = [
          citieslatlon[(i + 1) % citieslatlon.length],
          citieslatlon[(i + 2) % citieslatlon.length]
        ];
        c.x = c.lon;
        c.y = c.lat;
      }
    );

    // Load image to be used for drawing dots
    var layer = myMap.createLayer('feature', {'renderer' : 'd3Renderer'}),
        style = {
        nodes: {
          stroke: function () { return false; },
          fillOpacity: function () { return 0.5; }
        },
        linkType: 'path'
      };
    layer.createFeature('graph')
        .data(citieslatlon)
        .style(style);
    myMap.draw();

    myMap.onIdle(done);
  }

  window.geoTests.loadCitiesData(draw, 10);
};
