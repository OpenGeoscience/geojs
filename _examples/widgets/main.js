// Run after the DOM loads
$(function () {
  'use strict';

  // New York, Austin, and San Francisco coordinates
  var coordinates = [
    {
      x: -74.0059,
      y: 40.7127
    },
    {
      x: -97.7500,
      y: 30.2500
    },
    {
      x: -122.4167,
      y: 37.7833
    }
  ];

  // Determine if a set of lat/long are in the viewport
  function coordinatesInViewport(coords, map) {
    var mapWidth = map.node().width(),
        mapHeight = map.node().height();

    coords = map.gcsToDisplay(coords);

    return ((coords.x >= 0 && coords.y >= 0) &&
            (coords.x <= mapWidth && coords.y <= mapHeight));
  }

  // Create a map object
  var map = geo.map({
    node: '#map',
    center: {
      x: -114.1180,
      y: 35.6364
    },
    zoom: 4
  });

  // Add the default osm layer
  map.createLayer('osm');

  // Plot points for the 3 cities
  var layer = map.createLayer('feature', {'renderer' : 'd3'});

  layer.createFeature('point')
    .data(coordinates)
    .style('radius', 5)
    .style('fillColor', function () { return 'red'; })
    .position(function (d) { return d; })
    .draw();

  // Create a ui layer
  var ui = map.createLayer('ui');

  // Create a time series plot widget
  var widget = ui.createWidget('dom', {
    position: {
      left: 20,
      bottom: 20
    }
  });
  var $widget = $(widget.canvas());
  $widget.attr('id', 'svg-container');

  // When the map pans - hide the widget if none of the cities are in the viewport anymore
  ui.geoOn(geo.event.pan, function () {
    for (var i = 0; i < coordinates.length; i += 1) {
      if (coordinatesInViewport(coordinates[i], map)) {
        $widget.show();
        return;
      }
    }

    $widget.hide();
  });

  // Create a zoom slider widget
  ui.createWidget('slider', {position: {left: 40, top: 40}});
});
