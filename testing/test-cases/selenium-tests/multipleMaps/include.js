
window.startTest = function (done) {
  'use strict';

  var map1 = geo.map({node: '#map1'}),
      map2 = geo.map({node: '#map2'}),
      done1, done2;
      
  map1.createLayer('osm', {m_baseUrl: '/data/tiles/'});
  map2.createLayer('osm', {m_baseUrl: '/data/tiles/'});


  function resizeCanvas() {
    var width = $('#map1').width(),
        height = $('#map1').height();
    map1.resize(0, 0, width, height);
    map1.draw();
    map2.resize(0, 0, width, height);
    map2.draw();
  }

  resizeCanvas();

  /// Resize the canvas to fill browser window dynamically
  window.addEventListener('resize', resizeCanvas, false);

  // give the tiles a chance to load
  map1.onIdle(function () {
    done1 = true;
    if (done2) { done(); }
  });
  map2.onIdle(function () {
    done2 = true;
    if (done1) { done(); }
  });
};
