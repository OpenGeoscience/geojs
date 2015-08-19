// Run after the DOM loads
$(function () {
  'use strict';

  // Define a function we will use to generate contours.
  function makeContour(data, layer) {
    /* There are two example data sets.  One has a position array which
     * consists of objects each with x, y, z values.  The other has a values
     * array which just has our contour values. */
    var contour = layer.createFeature('contour')
      .data(data.position || data.values)
      .style({
        opacity: 0.75
      })
      .contour({
        gridWidth: data.gridWidth,
        gridHeight: data.gridHeight,
        /* The color range doesn't have to be linear:
        rangeValues: [0, 25, 50, 75, 100, 125, 250, 500, 750, 2000],
         */
        /* Or, you could plot iso-contour lines using a varying opacity:
        rangeValues: [100, 100, 200, 200, 300, 300, 400, 400, 500, 500],
        opacityRange: [1, 0, 1, 0, 1, 0, 1, 0, 1],
         */
        /* You can make smooth contours instead of stepped contours:
        stepped: false,
         */
        min: 0
      });
    if (data.position) {
      contour
      .position(function (d) { return {x: d.x, y: d.y, z: d.z}; })
      .style({
        value: function (d) { return d.z > -9999 ? d.z : null; }
        /* You can get better contours if you set a minimum value and set
         * sea locations to a small negative number:
        value: function (d) { return d.z > -9999 ? d.z : -10; }
         */
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
    return contour;
  }

  // Create a map object with the OpenStreetMaps base layer.
  var map = geo.map({
    node: '#map',
    center: {
      x: -157.965,
      y: 21.482
    },
    zoom: 8
  });

  // Add the osm layer
  map.createLayer(
    'osm'
  );

  // Create a gl feature layer
  var vglLayer = map.createLayer(
    'feature',
    {
      renderer: 'vgl'
    }
  );

  // Load the data
  $.ajax({
    url: 'oahu.json',
    success: function (data) {
      var contour = makeContour(data, vglLayer);
      // Draw the map
      map.draw();
      /* After 10 second, load a denser data set */
      window.setTimeout(function () {
        $.ajax({
          url: 'oahu-dense.json',
          success: function (data) {
            vglLayer.deleteFeature(contour);
            contour = makeContour(data, vglLayer, contour);
            map.draw();
          }
        });
      }, 10000);
    }
  });
});
