// Run after the DOM loads
$(function () {
  'use strict';

  // Create a map object
  var map = geo.map({
    node: '#map',
    center: {
      x: -98.0,
      y: 39.5
    },
    zoom: 3
  });

  // Add the osm layer with a custom tile url
  map.createLayer(
    'osm',
    {
      url: 'http://tile.stamen.com/toner-lite/{z}/{x}/{y}.png',
      attribution: ['Map tiles by <a href="http://stamen.com">Stamen Design</a>,',
        'under <a href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.',
        'Data by <a href="https://openstreetmap.org">OpenStreetMap</a>, under',
        '<a href="https://openstreetmap.org/copyright">ODbL</a>.'
      ].join(' ')
    }
  );
});
