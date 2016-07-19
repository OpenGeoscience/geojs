// Run after the DOM loads
$(function () {
  'use strict';

  // Create an svg layer and return a reference to its dom element.
  function getSvgLayer(map, opts) {

    opts.renderer = 'd3';
    var layer = map.createLayer('feature', opts);

    // The canvas is a d3 context to geojs managed svg element.
    return {
      layer: layer,
      svg: layer.canvas()
    };
  }

  // This function creates a top layer that blocks mouse events.
  function topLayer(map) {
    var obj = getSvgLayer(map, {sticky: false});

    // Give the layer a slight yellow tint.
    obj.svg.append('rect')
      .classed('top-layer-overlay', true)
      .attr('x', -10000)
      .attr('y', -10000)
      .attr('width', 20000)
      .attr('height', 20000);

    return obj.layer;
  }

  // Create a map object
  var map = geo.map({
    node: '#map',
    center: {
      x: -98.0,
      y: 39.5
    },
    zoom: 4
  });

  // Add a base layer
  map.createLayer('osm');

  // Get the map size in pixels
  var height = $('#map').height();
  var width = $('#map').width();

  // Create a fixed layer that contains some descriptive text.
  var info = getSvgLayer(map, {sticky: false}).svg
    .append('text')
      .attr('x', 30)
      .attr('y', 30)
      .attr('dy', '1em')
      .text('Try panning and zooming the map over the boxes.');

  // Create the main svg layer.
  var svg = getSvgLayer(map, {}).svg;

  // This is a helper function to create a box with a
  // uniform style that receives mouse events.
  function addEventBox(x, y, str) {
    var width = 300, height = 200;
    var text = svg.append('text')
      .attr('x', x - 75)
      .attr('y', y)
      .style('display', 'none')
      .style('pointer-events', 'none')
      .text(str);

    return svg.insert('rect', 'text')
      .classed('evt-box', true)
      .attr('x', x - width / 2)
      .attr('y', y - height / 2)
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('width', width)
      .attr('height', height)
      .on('mouseenter', function () {
        text.style('display', null);
        d3.select(this).style('fill-opacity', '75%');
      })
      .on('mouseleave', function () {
        text.style('display', 'none');
        d3.select(this).style('fill-opacity', null);
      });
  }

  // Add a red box that blocks mouse clicks.
  addEventBox(width / 4, height / 2, 'Blocking click')
    .style('fill', 'firebrick')
    .on('mousedown', function () {
      d3.event.stopPropagation();
    });

  // Add a blue box that blocks the mouse wheel.
  addEventBox(3 * width / 4, height / 2, 'Blocking wheel')
    .style('fill', 'steelblue')
    .on('wheel', function () {
      d3.event.stopPropagation();
    });

  // Connect the button that adds or removes the top layer.
  var top = null;
  $('.layer-toggle ').text('Add top layer')
    .click(function () {
      if (top) {
        $(this).text('Add top layer');
        info.text(
          'Try panning and zooming the map over the boxes.'
        );
        map.deleteLayer(top);
        top = null;
      } else {
        top = topLayer(map);
        $(this).text('Remove top layer');
        info.text(
          'Top layer active, no mouse events reach the boxes.'
        );
      }
    });
});
