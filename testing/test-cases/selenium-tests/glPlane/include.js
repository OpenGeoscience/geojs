window.startTest = function (done) {
  'use strict';

  var mapOptions = {
    node: '#map',
    clampBounds: false
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

  var opacity = new RegExp('[\\?&]opacity=([^&#]*)').exec(location.search);
  if (opacity !== null) {
    opacity = decodeURIComponent(opacity[1].replace(/\+/g, ' '));
  }
  layer.createFeature('plane')
    .origin([0.0, 0.0])
    .upperLeft([0, 90])
    .lowerRight([180, 0])
    .style({
      image: '/data/land_shallow_topo_2048.png',
      opacity: opacity ? opacity : undefined
    });
  myMap.bounds({lowerLeft: {x: 0, y: 0}, upperRight: {x: 180, y: 90}});
  myMap.draw();

  myMap.onIdle(done);
};
