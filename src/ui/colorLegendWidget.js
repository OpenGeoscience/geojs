var d3 = require('d3');
var domWidget = require('./domWidget');
var inherit = require('../inherit');
var registerWidget = require('../registry').registerWidget;

/**
 * @typedef {object} [geo.gui.colorLegendWidget.category]
 * @property {string} name The text label of the legend.
 * @property {string} type The type of the legend, either discrete or continuous.
 * @property {string} scale The scale of the legend. For discrete type,
 * linear, log, sqrt, pow, ordinal, and quantile is supported.
 * For continuous type, linear, log, sqrt, and pow is supported.
 * @property {number[]|string[]} domain Only for ordinal scale legend, string values are acceptable. For ordinal legend, the number in the domain array should be the same number of colors. For quantile scale legend, the domain should be an array of all values. For other scales, the domain needs to be an array of two number for marking the upper bound and lower bound.
 * @property {string[]} colors The colors of the legend. All valid svg color can be used. For discrete type, multiple values are accepted. For continuous type, an array of two values is supported.
 */

/**
 * A UI widget that enables display discrete colors or two-color continuous transition legend.
 *
 * @class
 * @alias geo.gui.colorLegendWidget
 * @extends geo.gui.domWidget
 * @param {object} [arg] Widget options.
 * @param {object} [args.position] Position setting relatively to the map container.
 * @param {number} [args.position.right] The pixel distance the widget to the right of the map container.
 * @param {number} [args.position.top] The pixel distance the widget to the top of the map container.
 * @param {geo.gui.colorLegendWidget.category[]} [args.categories] An array of category definitions for the initial color legends
 * @returns {geo.gui.colorLegendWidget}
 */
var colorLegendWidget = function (arg) {
  'use strict';
  if (!(this instanceof colorLegendWidget)) {
    return new colorLegendWidget(arg);
  }

  domWidget.call(this, arg);

  var m_this = this;
  var m_categories = [];

  var oldInit = this._init;
  // get the widget container ready
  this._init = function () {
    oldInit();
    var canvas = m_this.canvas();
    d3.select(canvas)
      .style({
        'display': 'none',
        'padding': '10px',
        'border': '1.5px solid black',
        'border-radius': '3px',
        'transition': '250ms background linear',
        'background-color': 'rgba(255, 255, 255, 0.75)'
      })
      .on('mouseenter', function () {
        d3.select(this)
          .style('background-color', 'rgba(255, 255, 255, 1)');
      })
      .on('mouseleave', function () {
        d3.select(this)
          .style('background-color', 'rgba(255, 255, 255, 0.75)');
      });

    m_this.popup = d3.select(canvas).append('div')
      .attr('class', 'color-legend-popup')
      .style({
        'position': 'absolute',
        'background': 'white',
        'height': '22px',
        'font-size': '14px',
        'border': 'solid 1px black',
        'padding': '0 5px',
        'pointer-events': 'none',
        'white-space': 'nowrap',
        'z-index': 100000,
        'opacity': 0
      });

    if (arg.categories) {
      this.categories(arg.categories);
    }
  };

  // clear the DOM container and create legends
  this._draw = function () {
    d3.select(m_this.canvas()).selectAll('div.legends').remove();

    if (!m_categories.length) {
      d3.select(m_this.canvas()).style('display', 'none');
      return;
    } else {
      d3.select(m_this.canvas()).style('display', 'block');
    }

    var container = d3.select(m_this.canvas())
      .append('div')
      .attr('class', 'legends');

    var width = 300;
    var margin = 20;

    m_categories.forEach(function (category, index) {
      var legendContainer = container
        .append('div')
        .attr('class', 'legend')
        .style({
          'margin-bottom': '10px'
        });

      legendContainer
        .append('div')
        .text(category.name)
        .style({
          'text-align': 'center'
        });

      var legendSvg = legendContainer
        .append('svg')
        .attr({
          'display': 'block',
          'width': width,
          'height': '40px',
          'viewBox': -margin + ' 0 ' + width + ' 40'
        });

      if (category.type === 'discrete') {
        m_this._drawDiscrete(legendSvg, width - 2 * margin, category);
      } else if (category.type === 'continuous') {
        m_this._drawContinous(legendSvg, width - 2 * margin, category);
      }
    });

  };

  /**
   * Set or get categories
   * @param {geo.gui.colorLegendWidget.category[]} [categories] If `undefined`, return the current legend categories array. If an array is provided, remove current legends and recreate with the new categories.
   * @returns {geo.gui.colorLegendWidget.category[]}
   */
  this.categories = function (categories) {
    if (categories === undefined) {
      return m_categories;
    }
    m_categories = categories;
    this._draw();
  };

  /**
   * Add additional categories
   *
   * @param {geo.gui.colorLegendWidget.category[]} categories Append additional legend categories to the end the of the current list of legends.
   */
  this.addCategories = function (categories) {
    m_categories = m_categories.concat(categories);
    this._draw();
  };

  /**
   * Remove categories
   *
   * @param {geo.gui.colorLegendWidget.category[]} categories If a category object exists in the current legend categories, that category will be removed.
   */
  this.removeCategories = function (categories) {
    m_categories = m_categories.filter(function (category) {
      return categories.indexOf(category) === -1;
    });
    this._draw();
  };

  // Draw an individual discrete type legend
  this._drawDiscrete = function (svg, width, category) {
    var valueRange, valueScale, colorScale, axisScale, axis, steps, ticks;
    if (category.scale === 'ordinal') {
      colorScale = d3.scale.ordinal().domain(category.domain).range(category.colors);
      m_this._renderDiscreteColors(svg, category.domain, colorScale, width, function (d) { return d; });

      axisScale = d3.scale.ordinal()
        .domain(category.domain)
        .rangeRoundBands([0, width]);
      axis = d3.svg.axis()
        .scale(axisScale)
        .tickValues(function () {
          var skip = Math.ceil(axisScale.domain().length / 6);
          return axisScale.domain().filter(function (d, i) { return i % skip === 0; });
        });
      m_this._renderAxis(svg, axis);

    } else if (category.scale === 'quantile') {
      valueRange = [0, category.colors.length];
      steps = range(0, category.colors.length - 1);
      valueScale = d3.scale.quantile().domain(category.domain).range(steps);
      colorScale = d3.scale.quantize().domain(valueRange).range(category.colors);
      m_this._renderDiscreteColors(svg, steps, colorScale, width, function (d) {
        return valueScale.invertExtent(d).join(' - ');
      });

      var axisDomain = [valueScale.invertExtent(0)[0]];
      axisDomain = axisDomain.concat(steps.map(function (step) { return valueScale.invertExtent(step)[1]; }));

      ticks = steps.slice();
      ticks.push(category.colors.length);
      axisScale = d3.scale.ordinal()
        .domain(axisDomain)
        .rangePoints([0, width]);
      axis = createAxis(axisScale);
      m_this._renderAxis(svg, axis);

    } else if (['linear', 'log', 'sqrt', 'pow'].indexOf(category.scale) !== -1) {
      valueRange = [0, category.colors.length];
      valueScale = d3.scale[category.scale]().domain(category.domain).range(valueRange).nice();
      colorScale = d3.scale.quantize().domain(valueRange).range(category.colors);
      steps = range(0, category.colors.length - 1);
      var precision = Math.max.apply(null, category.domain.map(function (number) { return getPrecision(number); }));
      m_this._renderDiscreteColors(svg, steps, colorScale, width, function (d) {
        return m_this._popupFormatter(valueScale.invert(d), precision) + ' - ' + m_this._popupFormatter(valueScale.invert(d + 1), precision);
      });

      ticks = steps.slice();
      ticks.push(category.colors.length);
      axisScale = d3.scale.ordinal()
        .domain(ticks.map(function (tick) {
          return valueScale.invert(tick);
        }))
        .rangePoints([0, width]);
      axis = createAxis(axisScale);
      m_this._renderAxis(svg, axis);
    }

    function createAxis(axisScale) {
      return d3.svg.axis()
        .scale(axisScale)
        .tickFormat(d3.format('.2s'))
        .tickValues(function () {
          var skip = Math.ceil(axisScale.domain().length / 6);
          return axisScale.domain().filter(function (d, i) { return i % skip === 0; });
        });
    }
  };

  // Actually render colors for discrete type with d3
  this._renderDiscreteColors = function (svg, steps, colorScale, width, getValue) {
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
      })
      .on('mousemove', function (d) {
        m_this._showPopup(getValue(d));
      })
      .on('mouseout', m_this._hidePopup);
  };

  // Draw an individual continous type legend
  this._drawContinous = function (svg, width, category) {
    var axisScale, axis;
    if (['linear', 'log', 'sqrt', 'pow'].indexOf(category.scale) === -1) {
      throw new Error('unsupported scale');
    }
    axisScale = d3.scale[category.scale]().domain(category.domain).range([0, width]).nice();
    if (category.scale === 'log' && category.base) {
      axisScale.base(category.base);
    }
    if (category.scale === 'pow' && category.exponent) {
      axisScale.exponent(category.exponent);
    }
    var randomString = Math.random().toString(36).substring(5);
    var precision = Math.max.apply(null, category.domain.map(function (number) { return getPrecision(number); }));

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
      .attr('height', '20px')
      .on('mousemove', function () {
        var value = axisScale.invert(d3.mouse(this)[0]);
        var text = m_this._popupFormatter(value, precision);
        m_this._showPopup(text);
      })
      .on('mouseout', m_this._hidePopup);

    axis = d3.svg.axis()
      .scale(axisScale)
      .ticks(6, '.2s');

    this._renderAxis(svg, axis);
  };

  // actually render the axis with d3
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
  };

  // formatter of number that tries to maximize the precision while making the output shorter
  this._popupFormatter = function (number, precision) {
    number = parseFloat(number.toFixed(8));
    precision = Math.min(precision, getPrecision(number));
    precision = Math.min(precision, Math.max(3, 7 - Math.trunc(number).toString().length));
    return d3.format('.' + precision + 'f')(number);
  };

  // show the popup based on current mouse event
  this._showPopup = function (text) {
    // The cursor location relative to the container
    var offset = d3.mouse(m_this.canvas());
    m_this.popup
      .text(text);
    var containerWidth = m_this.canvas().clientWidth;
    var popupWidth = m_this.popup[0][0].clientWidth;
    m_this.popup
      .style({
        // If the popup will be longer or almost longer than the container
        'left': offset[0] - (offset[0] + popupWidth - containerWidth > -10 ? popupWidth : 0) + 'px',
        'top': (offset[1] - 22) + 'px'
      })
      .transition()
      .duration(200)
      .style('opacity', 1);
  };

  this._hidePopup = function () {
    m_this.popup.transition()
      .duration(200)
      .style('opacity', 0);
  };

  return this;
};

function range(start, end, step) {
  step = step || 1;
  var foo = [];
  for (var i = start; i <= end; i += step) {
    foo.push(i);
  }
  return foo;
}

function getPrecision(a) {
  if (!isFinite(a)) return 0;
  var e = 1, p = 0;
  while (Math.round(a * e) / e !== a) { e *= 10; p++; }
  return p;
}

inherit(colorLegendWidget, domWidget);

registerWidget('dom', 'colorLegend', colorLegendWidget);
module.exports = colorLegendWidget;
