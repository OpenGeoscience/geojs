window.startTest = function (done) {
  'use strict';

  var mapOptions = {
    node: '#map',
    zoom : 6,
    center : [0.0, 0.0]
  },
  myMap = geo.map(mapOptions),
  layer = myMap.createLayer('feature');

  function resizeCanvas() {
    $('#map').width('100%');
    $('#map').height('100%');
    updateAndDraw($('#map').width(), $('#map').height());
  }

  // Resize the canvas to fill browser window dynamically
  window.addEventListener('resize', resizeCanvas, false);

  resizeCanvas();

  function updateAndDraw(width, height) {
    myMap.resize(0, 0, width, height);
    myMap.draw();
  }

  layer.createFeature('plane')
    .origin(geo.latlng(0.0, 0.0))
    .upperLeft(geo.latlng(1.0, 0.0))
    .lowerRight(geo.latlng(0.0, 2.0))
    .style('image', '/data/land_shallow_topo_2048.png');
  myMap.draw();

  done();
};
