$(
  // Run after the DOM loads
  function () {
    'use strict';

    // create a map object
    var map = geo.map({
      node: '#map',
      center: {
        x: -98.0,
        y: 39.5
      },
      zoom: 1
    });

    // add the osm layer
    map.createLayer('osm');

    // make the map resize with the browser window
    $(window).resize(function () {
      map.resize(0, 0, map.node().width(), map.node().height());
    });
  }
);
