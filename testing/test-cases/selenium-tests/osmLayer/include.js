
window.startTest = function(done) {
    var mapOptions = {node: '#map',
                      zoom : 3,
                      center : [0.0, 0.0]},
      myMap = geo.map(mapOptions),
      layer = myMap.createLayer('osm', {m_baseUrl: '/data/tiles/'});

    window.gjsmap = myMap;

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
    myMap.onIdle(done);
};
