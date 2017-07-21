/* globals utils */

// Run after the DOM loads
$(function () {
  'use strict';

  var query = utils.getQuery();

  // Create a map object with the OpenStreetMaps base layer.
  var map = geo.map({
        node: '#map',
        center: {
          x: -98.0,
          y: 39.5
        },
        zoom: 4
      }),
      over = 0;

  // Create an osm layer
  map.createLayer('osm');

  // Create a gl feature layer
  var vglLayer = map.createLayer(
    'feature',
    {
      renderer: 'vgl'
    }
  );

  // Create an svg feature layer
  var svgLayer = map.createLayer(
    'feature',
    {
      renderer: 'd3'
    }
  );

  function handleMouseOver() {
    over += 1;
    $('#map').css('cursor', 'pointer');
  }

  function handleMouseOut() {
    if (over > 0) {
      over -= 1;
    }
    if (over === 0) {
      $('#map').css('cursor', '');
    }
  }

  function handleMouseClick(evt) {
    evt.data.clicked = !evt.data.clicked;
    this.modified();
    this.draw();
  }

  function handleBrush(evt) {
    evt.data.clicked = true;
    this.modified();
    this.draw();
  }

  var color = d3.scale.category10();
  vglLayer.createFeature('line', {selectionAPI: true})
    .data([window.randomPath(1000, 0.1, -88, 30), window.randomPath(500, 0.05, -110, 40)])
    .style({
      strokeColor: function (d, i, e, j) { return (j % 2) ? color(0) : color(1); },
      strokeWidth: 5,
      strokeOpacity: function (d, i, e) { return e.clicked ? 1 : 0.5; },
      closed: query.closed === 'true'
    })
    .geoOn(geo.event.feature.mouseover, handleMouseOver)
    .geoOn(geo.event.feature.mouseout, handleMouseOut)
    .geoOn(geo.event.feature.mouseclick, handleMouseClick)
    .geoOn(geo.event.feature.brushend, handleBrush);

  svgLayer.createFeature('line', {selectionAPI: true})
    .data([window.randomPath(1000, 0.1, -108, 30), window.randomPath(500, 0.05, -88, 40)])
    .style({
      strokeColor: function (d, i, l, j) { return (j % 2) ? color(2) : color(3); },
      strokeWidth: 5,
      strokeOpacity: function (d, i, e) { return e.clicked ? 1 : 0.5; },
      closed: query.closed === 'true'
    })
    .geoOn(geo.event.feature.mouseover, handleMouseOver)
    .geoOn(geo.event.feature.mouseout, handleMouseOut)
    .geoOn(geo.event.feature.mouseclick, handleMouseClick)
    .geoOn(geo.event.feature.brushend, handleBrush);

  vglLayer.draw();
  svgLayer.draw();
});
