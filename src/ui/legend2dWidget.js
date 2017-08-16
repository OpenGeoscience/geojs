var domWidget = require('./domWidget');
var inherit = require('../inherit');
var registerWidget = require('../registry').registerWidget;

var legend2dWidget = function (arg) {
  'use strict';
  if (!(this instanceof legend2dWidget)) {
    return new legend2dWidget(arg);
  }

  domWidget.call(this, arg);

  var m_this = this,
    m_default_canvas = 'div';
  var m_categories = [];

  /**
   * Initializes DOM Widget.
   * Sets the canvas for the widget, does parent/child relationship management,
   * appends it to it's parent and handles any positioning logic.
   */
  this._init = function () {
    if (arg.hasOwnProperty('parent')) {
      arg.parent.addChild(m_this);
    }

    m_this._createCanvas();
    m_this._appendChild();

    m_this.canvas().addEventListener('mousedown', function (e) {
      e.stopPropagation();
    });

    m_this.reposition();
  };

  /**
   * Creates the widget canvas.
   * This is just a simple DOM element (based on args.el, or defaults to a div)
   */
  this._createCanvas = function () {
    m_this.canvas(document.createElement(arg.el || m_default_canvas));
  };

  this.draw = function () {
    m_this._init();
    var container = d3.select(m_this.canvas()).append('div');

    var width = 700;
    var margin = 15;
    // this.width = width;

    m_categories.forEach(function (category, index) {
      var legendSvg = container
        .append('div')
        .append('svg')
        .attr({
          'width': width,
          'height': '50px',
          'viewBox': -margin + ' 0 ' + width + ' 50'
        })

      if (category.type === 'discrete') {
        m_this._drawDiscrete(legendSvg, width - 2 * margin, category);
      }

      else if (category.type === 'continuous') {
        m_this.drawContinous(legendSvg, width - 2 * margin, category);
      }
    });

  }

  this.categories = function (categories) {
    m_categories = categories;
    this.draw();
  }

  this._drawDiscrete = function (svg, width, category) {
    if (category.scale === 'ordinal') {
      var colorScale = d3.scale.ordinal().domain(category.domain).range(category.colors);
      m_this._renderDiscreteColors(svg, category.domain, colorScale, width);

      axisScale = d3.scale.ordinal()
        .domain(category.domain)
        .rangeRoundBands([0, width]);
      var axis = d3.svg.axis()
        .scale(axisScale);
      m_this._renderAxis(svg, axis);

    }
    else if (['linear', 'log', 'sqrt', 'pow'].indexOf(category.scale) != -1) {
      var valueRange = [0, category.colors.length];
      var valueScale = d3.scale[category.scale]().domain(category.domain).range(valueRange).nice();
      var colorScale = d3.scale.quantize().domain(valueRange).range(category.colors);
      var steps = range(0, category.colors.length - 1);
      m_this._renderDiscreteColors(svg, steps, colorScale, width);


      var ticks = steps.slice();
      ticks.push(category.colors.length);
      var axisScale = d3.scale.ordinal()
        .domain(ticks.map(function (tick) {
          return valueScale.invert(tick);
        }))
        .rangePoints([0, width]);
      var axis = d3.svg.axis()
        .scale(axisScale)
        .tickFormat(d3.format(".1s"));
      m_this._renderAxis(svg, axis);
    }
  }

  this._renderDiscreteColors = function (svg, steps, colorScale, width) {
    svg.selectAll('rect')
      .data(steps)
      .enter()
      .append('rect')
      .attr('width', width / steps.length)
      .attr('height', '20px')
      .attr('fill', function (d) {
        return colorScale(d);
      })
      .attr('transform', function (d, i) {
        return 'translate(' + i * width / steps.length + ' ,0)';
      });
  }

  this._renderAxis = function (svg, axis) {
    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0, 20)')
      .call(function (g) {
        g.call(axis);
        g.selectAll('path.domain, line')
          .style({
            'fill': 'none',
            'stroke': 'black',
            'stroke-width': '0.7'
          });
        g.selectAll('text')
          .style({
            'font-size': '12px'
          });
      });
  }

  this.drawContinous = function (svg, width, category) {
    if (['linear', 'log', 'sqrt', 'pow'].indexOf(category.scale) == -1) {
      throw new Error('unsupported scale');
    }
    var axisScale = d3.scale[category.scale]().domain(category.domain).range([0, width]).nice();
    if (category.scale === 'log' && category.base) {
      axisScale.base(category.base);
    }
    if (category.scale === 'pow' && category.exponent) {
      axisScale.exponent(category.exponent);
    }

    var randomString = Math.random().toString(36).substring(5);

    var gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'gradient' + randomString);
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', category.colors[0]);
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', category.colors[1]);
    svg.append('rect')
      .attr('fill', 'url(#gradient' + randomString + ')')
      .attr('width', width)
      .attr('height', '20px');

    var axis = d3.svg.axis()
      .scale(axisScale)
      .tickFormat(d3.format(".1s"));

    this._renderAxis(svg, axis);
  }

  return this;
};

function range(start, end) {
  var foo = [];
  for (var i = start; i <= end; i++) {
    foo.push(i);
  }
  return foo;
}

inherit(legend2dWidget, domWidget);

registerWidget('dom', 'legend2d', legend2dWidget);
module.exports = legend2dWidget;
