
window.startTest = function(done) {
    var mapOptions = {node: '#map',
                      zoom : 3,
                      center : [0.0, 0.0]},
      myMap = geo.map(mapOptions),
      layer = geo.osmLayer({'renderer' : 'vglRenderer'});

    /// Add layer to the map
    myMap.addLayer(layer);

    /// Resize the canvas to fill browser window dynamically
    window.addEventListener('resize', resizeCanvas, false);


    function updateAndDraw(width, height) {
      myMap.resize(0, 0, width, height);
      myMap.draw();
    }

    function resizeCanvas() {
      $('#map').width('100%');
      $('#map').height('100%');
      updateAndDraw($('#map').width(), $('#map').height());
    }
    resizeCanvas();

    // give the tiles a chance to load
    // we should add signals in geojs to do this...
    window.setTimeout(done, 1000);
};
