// Test plugin.jquery-plugin

xdescribe('plugin.jquery-plugin', function () {
  'use strict';

  var $ = require('jquery');
  var mockVGLRenderer = require('../test-utils').mockVGLRenderer;
  var restoreVGLRenderer = require('../test-utils').restoreVGLRenderer;
  var geo = require('../test-utils').geo;

  function create_map() {
    var node = $('<div id="map"/>').css({width: '500px', height: '500px'});
    $('#map').remove();
    $('body').append(node);
    $('#map').geojsMap({
      center: {latitude: 10, longitude: -10},
      zoom: 4.1,
      url: '/data/grid.jpg',
      attribution: null,
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
          fillOpacity: 1,
          strokeColor: 'midnightblue',
          strokeWidth: 5,
          strokeOpacity: 0.5
        }, {
          type: 'point',
          data: [{x: 10, y: 15}],
          size: 10000,
          fillColor: 'black',
          fillOpacity: 1,
          strokeColor: 'lightgrey',
          strokeWidth: 2
        }]
      }]
    });
  }

  beforeEach(mockVGLRenderer);
  afterEach(restoreVGLRenderer);

  describe('without jquery-ui', function () {
    it('geojsMap', function () {
      expect(function () { create_map(); }).toThrow(new Error(
        'The geojs jquery plugin requires jquery ui to be available.'
      ));
    });
  });
  describe('initial usage', function () {
    /* This affects future describe() functions, too */
    beforeEach(function (done) {
      $.getScript(['/examples/common/js/jquery-ui.min.js'], function () {
        $(geo.jqueryPlugin.reload);
        done();
      });
    });
    it('geojsMap', function () {
      create_map();
      expect($('#map .webgl-canvas').length).toBe(2);
      expect($('#map g circle').length).toBeGreaterThan(0);
    });
  });
});
