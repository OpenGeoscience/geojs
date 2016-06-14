// Run after the DOM loads
$(function () {
  'use strict';

  // First we define some helper functions to draw our layers.

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

  function drawLayer(map, type, text, index, rescale) {
    var layer, svg, obj;

    // The sticky option keeps the element fixed relative
    // to the map, which is the default behavior.
    var sticky = (type !== 'fixed');
    obj = getSvgLayer(map, {'sticky': sticky});

    layer = obj.layer;
    svg = obj.svg;

    // Put everything in a group with classes for styling
    // in the css.
    var g = svg.append('g')
      .classed(type + '-layer', true)
      .classed('layer', true);

    // Get the size of the map for the layout.
    var height = map.node().height() / 4;
    var width = map.node().width() / 4;

    // Translate the group to where we want it.
    g.attr('transform', 'translate(0,' + (index * height) + ')');

    // Attach a description.
    g.append('text')
      .attr('x', 30)
      .attr('y', height / 2)
      .style('font-size', '20px')
      .text(text);

    // Attach a rectangle
    g.append('rect')
      .attr('x', 2 * width)
      .attr('y', height / 4)
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('width', width / 2)
      .attr('height', height / 2)
      .style('stroke-width', '2px');

    // Attach a circle.
    var radius = 5;
    g.append('circle')
      .attr('cx', 3 * width)
      .attr('cy', height / 2)
      .attr('r', radius)
      .style('stroke-width', '2px');

    // Attach a spiral using some d3 magic.
    function theta(d) {
      return 9 * d * Math.PI / 100;
    }
    var alpha = 0.1;
    var xScale = d3.scale.linear()
      .domain([-6, 6])
      .range([width * 3.3, width * 4]);
    var yScale = d3.scale.linear()
      .domain([-6, 6])
      .range([width * 0.7, 0]);
    var spiral = d3.svg.line()
      .x(function (d) {
        var t = theta(d);
        return xScale(alpha * t * Math.cos(t));
      })
      .y(function (d) {
        var t = theta(d);
        return yScale(alpha * t * Math.sin(t));
      })
      .interpolate('basis');

    g.append('path')
      .attr('d', spiral(d3.range(100)))
      .attr('transform', 'translate(0,' + (height - width * 0.7) / 2 + ')')
      .style('stroke-width', '3px');

    // Attach a scaling function
    if (rescale) {
      layer.geoOn([geo.event.zoom, geo.event.resize], function () {
        // Get the scaling factor from the renderer.
        var scl = layer.renderer().scaleFactor();

        // Rescale all properties that require it.  In general, this depends
        // on the design of the elements, but often one wants to rescale stroke
        // widths and point radii.
        g.selectAll('text')
          .style('font-size', (20 / scl) + 'px');

        g.selectAll('rect')
          .style('stroke-width', (2 / scl) + 'px');

        g.selectAll('circle')
          .attr('r', radius / scl)
          .style('stroke-width', 2 / scl);

        g.selectAll('path')
          .style('stroke-width', (3 / scl) + 'px');
      });
    }
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

  // Create the layers
  drawLayer(map, 'fixed', 'This is a fixed layer', 0);
  drawLayer(map, 'unscaled-moving', 'This is a moving layer without rescaling.', 1);
  drawLayer(map, 'scaled-moving', 'This is a moving layer with rescaling.', 2, true);

});
