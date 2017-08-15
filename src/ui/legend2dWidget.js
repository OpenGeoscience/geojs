var domWidget = require('./domWidget');
var inherit = require('../inherit');
var registerWidget = require('../registry').registerWidget;
require('./legend2dWidget.styl');

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

    m_categories.forEach(function (category, index) {
      var legendSvg = container
        .append('div')
        .style({
          'width': width + 'px',
          'height': '50px'
        })
        .append('svg')
        .attr({
          'width': '100%',
          'height': '100%'
        })

      if (category.type === 'discrete') {
        var steps;
        var colorScale = d3.scale[category.scale.type]().domain(category.scale.domain).range(category.scale.range);
        var axisScale;
        if (category.scale.type === 'ordinal') {
          steps = category.scale.domain;

          axisScale = d3.scale.ordinal()
            .domain(category.scale.domain)
            .rangePoints([0, width]);
          var axis = d3.svg.axis()
            .scale(axisScale);
        }
        else if (category.scale.type === 'quantize') {
          steps = category.scale.range.map(function (color) {
            var range = colorScale.invertExtent(color);
            // console.log(color, range);
            return (range[1] - range[0]) / 2 + range[0];
          });

          var steps2 = category.scale.range.map(function (color) {
            return colorScale.invertExtent(color)[0];
          });

          var ticks = steps2.slice();
          ticks.push(colorScale.invertExtent(
            category.scale.range[category.scale.range.length - 1])[1]
          );

          axisScale = d3.scale.ordinal()
            .domain(ticks)
            .rangePoints([0, width]);
          var axis = d3.svg.axis()
            .scale(axisScale)
            .tickFormat(d3.format(".2s"));
        }

        legendSvg.selectAll('rect')
          .data(steps)
          .enter()
          .append('rect')
          .attr('width', width / steps.length)
          .attr('height', '20px')
          .attr('fill', function (d) {
            // console.log(d, colorScale(d));
            return colorScale(d);
          })
          .attr('transform', function (d, i) {
            return 'translate(' + i * width / steps.length + ' ,0)';
          })

      }

      else if (category.type === 'continuous') {
        var axisScale = d3.scale[category.scale.type]().domain(category.scale.domain).range([0, width]);
        if (category.scale.type === 'log') {
          axisScale.base(Math.E);
        }
        if (category.scale.type === 'pow') {
          axisScale.exponent(1.5);
        }

        var gradient = legendSvg
          .append('defs')
          .append('linearGradient')
          .attr('id', 'gradient' + index);
        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', category.scale.range[0]);
        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', category.scale.range[1]);
        legendSvg.append('rect')
          .attr('fill', 'url(#gradient' + index + ')')
          .attr('width', '100%')
          .attr('height', '20px');

        var axis = d3.svg.axis()
          .scale(axisScale)
          .tickFormat(d3.format(".2s"))
      }

      legendSvg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0, 20)')
        .call(function (g) {
          g.call(axis);
          g.selectAll('path.domain, line')
            .attr({
              'fill': 'none',
              'stroke': 'black'
            });
        });
    });

  }

  this.categories = function (categories) {
    m_categories = categories;
    this.draw();
  }

  return this;
};

inherit(legend2dWidget, domWidget);

registerWidget('dom', 'legend2d', legend2dWidget);
module.exports = legend2dWidget;
