/* jshint -W101 */
window.startTest = function (done) {
  'use strict';

  /* Get a URL parameter or return null if it doesn't exist.
   *
   * @param name: name of the parameter to fetch.
   * @returns: the decoded parameter.
   */
  function getQueryParameter(name) {
    var match = new RegExp('[?&]' + name + '=([^&]*)').exec(
        window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }

  var mapOptions = {
    center: {
      x: -157.965,
      y: 21.482
    },
    zoom: 8
  };

  var myMap = window.geoTests.createOsmMap(mapOptions, {}, true);

  var layer = myMap.createLayer('feature', {renderer: 'vgl'});
  var url = '/data/' + (getQueryParameter('url') || 'oahu.json');
  $.getJSON(url, {format: 'json'}).done(function (data) {
    var contour = layer.createFeature('contour')
      .data(data.position || data.values)
      .style({
        opacity: 0.75
      })
      .contour({
        gridWidth: data.gridWidth,
        gridHeight: data.gridHeight,
        min: 0
      });
    if (data.position) {
      contour
      .position(function (d) { return {x: d.x, y: d.y, z: d.z}; })
      .style({
        value: function (d) { return d.z > -9999 ? d.z : null; }
      });
    } else {
      contour
      .style({
        value: function (d) { return d > -9999 ? d : null; }
      })
      .contour({
        /* The geometry can be specified using 0-point coordinates and deltas
         * since it is a regular grid. */
        x0: data.x0, y0: data.y0, dx: data.dx, dy: data.dy
      });
    }
    var range = getQueryParameter('range');
    if (range) {
      contour
      .style({
        opacity: 1
      })
      .contour({
        minColor: 'blue',
        minOpacity: 0.5,
        maxColor: 'red',
        maxOpacity: 0.5
      });
      switch (range) {
        case 'nonlinear':
          contour
          .contour({
            rangeValues: [0, 25, 50, 75, 100, 125, 250, 500, 750, 2000]
          });
          break;
        case 'iso':
          contour
          .contour({
            rangeValues: [100, 100, 200, 200, 300, 300, 400, 400, 500, 500],
            opacityRange: [1, 0, 1, 0, 1, 0, 1, 0, 1],
            minOpacity: 0,
            maxOpacity: 0
          });
          break;
        default:
          contour
          .contour({
            min: 100,
            max: 500,
            colorRange: ['#FF00FF', '#CC33CC', '#996699',
                         '#669966', '#33CC33', '#00FF00'],
            opacityRange: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
          });
          break;
      }
    }
    if (getQueryParameter('stepped') === 'false') {
      contour
      .contour({
        stepped: false
      });
    }
    myMap.draw();
  });
  myMap.onIdle(done);
};
