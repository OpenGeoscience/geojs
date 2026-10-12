// Run after the DOM loads
$(function () {
  'use strict';

  // Define a function we will use to generate points.
  function makePoints(data, layer, color) {

    // The data is an array of arbitrary objects.  Each object in
    // the array is assumed to be a "point".  You provide accessors
    // that return styles and positions.
    // Here we also use the option `selectionAPI` to turn on the
    // optional mouse handling API.
    return layer.createFeature('point', {selectionAPI: true})
      .data(data)                                               // bind data
        .position(function (d) { return {x: d.x, y: d.y}; })    // position accessor
        .style('radius', 100)                                   // circle radius
        .style('fillColor', color)
        .style('fillOpacity', function (d) { return d.opacity; })
        .style('strokeColor', {r: 0, g: 0, b: 0})
        .style('strokeWidth', 2)

        // Here we bind mouse event handlers to the markers.  In this case,
        // we are increasing the opacity of the feature on mouse hover.
        // You are given access to the original data as `evt.data`,
        // the index in the data as `evt.index`, as well as all
        // information given by `geo.event.mousemove` events.
        .geoOn(geo.event.feature.mouseover, function (evt) {
          evt.data.opacity = 0.5;
          this.modified();        // mark the feature as modified
          this.draw();            // we must redraw as necessary
        })
        .geoOn(geo.event.feature.mouseout, function (evt) {
          evt.data.opacity = 0.1;
          this.modified();
          this.draw();
        })

        // You must call the draw method after setting all feature
        // properties.
        .draw();
  }

  // Create a map object with the OpenStreetMaps base layer.
  var map = geo.map({
    node: '#map',
    center: {
      x: -98.0,
      y: 39.5
    },
    zoom: 4.9
  });

  // Create an osm layer with custom tile url for a white background.
  map.createLayer(
    'osm',
    {
      url: function () {
        return 'white.jpg';
      }
    }
  );

  // Create a webgl feature layer
  var webglLayer = map.createLayer(
    'feature',
    {
      renderer: 'webgl'
    }
  );

  // Create an svg feature layer
  var svgLayer = map.createLayer(
    'feature',
    {
      renderer: 'svg'
    }
  );

  // Define unique colors for each layer
  var webglColor = 'red';
  var svgColor = 'blue';

  // Generate some data for webgl
  var data = d3.range(2).map(function (i) {
    return {
      x: -95,             // longitude
      y: 39.5 + 4.5 * i,  // latitude
      c: webglColor,      // fill color
      opacity: 0.1        // fill opacity
    };
  });
  makePoints(data, webglLayer, webglColor);

  // Generate some data for svg
  data = d3.range(2).map(function (i) {
    return {
      x: -101,            // longitude
      y: 39.5 + 4.5 * i,  // latitude
      c: svgColor,        // fill color
      opacity: 0.1        // fill opacity
    };
  });
  makePoints(data, svgLayer, svgColor);
});
