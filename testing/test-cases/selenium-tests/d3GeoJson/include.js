window.startTest = function (done) {
  'use strict';

  $('#map').width('100%');
  $('#map').height('100%');

  var mapOptions = {
    node: '#map',
    zoom : 2,
    center : [40, -105]
  };

  var myMap = geo.map(mapOptions),
      table = [],
      citieslatlon = [],
      width, height;

  function resizeCanvas() {
    width = $('#map').width();
    height = $('#map').height();
    updateAndDraw(width, height);
  }

  // Resize the canvas to fill browser window dynamically
  window.addEventListener('resize', resizeCanvas, false);

  function updateAndDraw(width, height) {
    myMap.resize(0, 0, width, height);
    myMap.draw();
  }

  resizeCanvas();

  // Load image to be used for drawing dots
  myMap.createLayer('osm');
  var layer = myMap.createLayer('feature', {'renderer' : 'd3Renderer'});

  var reader = geo.createFileReader("jsonReader", {"layer": layer});
  reader.read('/data/sample.json', function (features) {
    myMap.draw();
  });

  myMap.onIdle(done);
};
