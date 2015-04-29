
window.startTest = function (done) {
  'use strict';

  $(function () {
    $('#map').geojsMap({
      center: {latitude: 10, longitude: -10},
      zoom: 1,
      tileUrl: '/data/grid.jpg',
      layers: [{
        renderer: 'vgl',
        features: [{
          type: 'point',
          data: [{x: 10, y: -10}],
          radius: 50,
          fill: true,
          fillColor: 'brown',
          fillOpacity: 0.5,
          stroke: true,
          strokeColor: '#ffebcd',
          strokeWidth: 10
        }, {
          data: [[{x: 7, y: -7}, {x: -7, y: 14}]],
          type: 'line',
          strokeWidth: 5,
          strokeColor: 'darkorange',
          strokeOpacity: 0.75
        }]
      }, {
        renderer: 'd3',
        features: [{
          type: 'line',
          data: [[{x: -10, y: 10}, {x: -20, y: 15}, {x: -30, y: 20}, {x: -40, y: 25}]],
          strokeColor: 'slategrey',
          strokeWidth: 10
        }, {
          type: 'point',
          data: [{x: -10, y: 10}, {x: -20, y: 15}, {x: -30, y: 20}, {x: -40, y: 25}],
          size: function (d, i) { return [0.1, 0.11, 0.111, 0.1111][i]; },
          radius: 100,
          fillColor: function (d, i) { return 'a' + i.toString(); },
          strokeColor: 'midnightblue',
          strokeWidth: 5,
          strokeOpacity: 0.5
        }, {
          type: 'point',
          data: [{x: 10, y: 15}],
          size: 10000,
          fillColor: 'black',
          strokeColor: 'lightgrey',
          strokeWidth: 2
        }]
      }]
    });

    window.swapTiles = function (_) {
      $('#map').geojsMap('tileUrl', '/data/white.jpg').geojsMap('map').onIdle(_);
    };

    $('#map').geojsMap('map').onIdle(done);
  });
};
