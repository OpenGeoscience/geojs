var d3 = require('../svg/svgRenderer').d3;
var domWidget = require('./domWidget');
var inherit = require('../inherit');
var registerWidget = require('../registry').registerWidget;
var util = require('../util');
var uniqueID = require('../svg/uniqueID');

require('./colorLegendWidget.styl');

/**
 * @typedef {object} geo.gui.colorLegendWidget.category
 * @property {string} name The text label of the legend.
 * @property {string} type The type of the legend, either discrete or continuous.
 * @property {string} scale The scale of the legend. For discrete type,
 * linear, log, sqrt, pow, ordinal, and quantile is supported.
 * For continuous type, linear, log, sqrt, and pow is supported.
 * @property {number[]|string[]} domain Only for ordinal scale legend, string
 * values are acceptable. For ordinal legend, the number in the domain array
 * should be the same number of colors. For quantile scale legend, the domain
 * should be an array of all values. For other scales, the domain needs to be
 * an array of two number for marking the upper bound and lower bound.
 * This domain property will be used with d3 scale object internally.
 * @property {geo.geoColor[]} colors The colors of the legend.
 * All valid svg color can be used. For discrete type, multiple values
 * are accepted. For continuous type, an array of two values is supported.
 * @property {number} [base] The base of log when log scale is used.
 * default to 10.
 * @property {number} [exponent] The exponent of power when power scale is used.
 * default to 1.
 * @property {boolean} [endAxisLabelOnly] Only show left most and right most
 * axis label
 * default to null.
 */

/**
 * A UI widget that enables display discrete colors or two-color continuous
 *  transition legend.
 *
 * @class
 * @alias geo.gui.colorLegendWidget
 * @extends geo.gui.domWidget
 * @param {object} [arg] Widget options.
 * @param {geo.gui.widget.position} [arg.position] Position setting relatively to the map
 * container.
 * @param {geo.gui.colorLegendWidget.category[]} [arg.categories] An array
 * of category definitions for the initial color legends
 * @param {number} [arg.width] The width of the widget in pixels.
 * @param {number} [arg.ticks] The maximum number of ticks on the axis of a legend, default is 6.
 * @returns {geo.gui.colorLegendWidget}
 */
var colorLegendWidget = function (arg) {
  'use strict';
  if (!(this instanceof colorLegendWidget)) {
    return new colorLegendWidget(arg);
  }

  domWidget.call(this, arg);

  var m_this = this,
      m_categories = [],
      m_width = arg.width || 300,
      m_ticks = arg.ticks || 6,
      s_init = this._init;
  // get the widget container ready
  this._init = function () {
    s_init();
    var canvas = m_this.canvas();
    d3.select(canvas)
      .attr('class', 'color-legend-container');

    m_this.popup = d3.select(canvas).append('div')
      .attr('class', 'color-legend-popup');

    if (arg.categories) {
      m_this.categories(arg.categories);
    }
  };

  /**
   * Clear the DOM container and create legends.
   */
  this._draw = function () {
    d3.select(m_this.canvas()).selectAll('div.geojs-color-legends').remove();

    if (!m_categories.length) {
      d3.select(m_this.canvas()).style('display', 'none');
      return;
    } else {
      d3.select(m_this.canvas()).style('display', 'block');
    }

    var container = d3.select(m_this.canvas())
      .append('div')
      .attr('class', 'geojs-color-legends');

    var width = m_width;
    var margin = 20;

    m_categories.forEach(function (category, index) {
      var legendContainer = container
        .append('div')
        .attr('class', 'geojs-color-legend');

      legendContainer
        .append('div')
        .attr('class', 'geojs-title')
        .text(category.name);

      var legendSvg = legendContainer
        .append('svg')
        .attr('class', 'svg')
        .attr('width', width)
        .attr('height', '40px')
        .attr('viewBox', -margin + ' 0 ' + width + ' 40');
      if (category.type === 'discrete') {
        m_this._drawDiscrete(legendSvg, width - 2 * margin, category);
      } else if (category.type === 'continuous') {
        m_this._drawContinous(legendSvg, width - 2 * margin, category);
      }
    });

  };

  /**
   * Get or set categories.
   * @param {geo.gui.colorLegendWidget.category[]} [categories] If `undefined`,
   * return the current legend categories array. If an array is provided,
   * remove current legends and recreate with the new categories.
   * @returns {geo.gui.colorLegendWidget.category[]|this}
   * The current list of categories or the current class instance.
   */
  this.categories = function (categories) {
    if (categories === undefined) {
      return m_categories;
    }
    m_categories = m_this._prepareCategories(categories);
    m_this._draw();
    return m_this;
  };

  /**
   * Add additional categories.
   * @param {geo.gui.colorLegendWidget.category[]} categories Append additional
   * legend categories to the end the of the current list of legends.
   * @returns {this} The current class instance.
   */
  this.addCategories = function (categories) {
    m_categories = m_categories.concat(m_this._prepareCategories(categories));
    m_this._draw();
    return m_this;
  };

  /**
   * Remove categories.
   *
   * @param {geo.gui.colorLegendWidget.category[]} categories If a category
   * object exists in the current legend categories, that category will be
   * removed.
   * @returns {this} The current class instance.
   */
  this.removeCategories = function (categories) {
    m_categories = m_categories.filter(function (category) {
      return categories.indexOf(category) === -1;
    });
    m_this._draw();
    return m_this;
  };

  /**
   * This function normalize color input string with the utility function. It modifies the original object.
   * @param {geo.gui.colorLegendWidget.category[]} categories The categories
   * @returns {geo.gui.colorLegendWidget.category[]} prepared categories
   */
  this._prepareCategories = function (categories) {
    categories.forEach(function (category) {
      category.color = category.colors.map(function (color) {
        return util.convertColorToHex(color, true);
      });
    });
    return categories;
  };

  /**
   * Draw an individual discrete type legend.
   * @param {Element} svg svg element that the legend will be drawn
   * @param {number} width width of the svg element in pixel
   * @param {geo.gui.colorLegendWidget.category} category The discrete type legend category
   */
  this._drawDiscrete = function (svg, width, category) {
    /**
     * Render the d3 axis object based on the axis d3 Scale.
     * @param {object} axisScale d3 scale object
     * @returns {object} d3 axis object
     */
    function createAxis(axisScale) {
      var skip = Math.ceil(axisScale.domain().length / m_ticks);
      var values = axisScale.domain().filter(function (d, i) { return i % skip === 0; });
      return d3.axisBottom(axisScale)
        .tickFormat(d3.format('.2s'))
        .tickValues(values);
    }

    if (['linear', 'log', 'sqrt', 'pow', 'quantile', 'ordinal'].indexOf(category.scale) === -1) {
      throw new Error('unsupported scale');
    }
    var valueRange, valueScale, colorScale, axisScale, axis, steps, ticks;
    if (category.scale === 'ordinal') {
      colorScale = d3.scaleOrdinal()
        .domain(category.domain)
        .range(category.colors);
      m_this._renderDiscreteColors(
        svg, category.domain, colorScale, width, function (d) { return d; });

      axisScale = d3.scaleBand()
        .domain(category.domain)
        .rangeRound([0, width]);
      var skip = Math.ceil(category.domain.length / m_ticks);
      var values = category.domain.filter(function (d, i) { return i % skip === 0; });
      axis = d3.axisBottom(axisScale).tickValues(values);
    } else if (category.scale === 'quantile') {
      valueRange = [0, category.colors.length];
      steps = util.range(0, category.colors.length - 1);
      valueScale = d3.scaleQuantile().domain(category.domain).range(steps);
      colorScale = d3.scaleQuantize().domain(valueRange).range(category.colors);
      m_this._renderDiscreteColors(svg, steps, colorScale, width, function (d) {
        return valueScale.invertExtent(d).join(' - ');
      });

      var axisDomain = [valueScale.invertExtent(0)[0]];
      axisDomain = axisDomain.concat(steps.map(
        function (step) { return valueScale.invertExtent(step)[1]; }));

      axisScale = d3.scalePoint()
        .domain(axisDomain)
        .range([0, width]);
      axis = createAxis(axisScale);
    } else if (['linear', 'log', 'sqrt', 'pow'].indexOf(category.scale) !== -1) {
      valueRange = [0, category.colors.length];
      valueScale = d3['scale' + category.scale.charAt(0).toUpperCase() + category.scale.slice(1)]()
        .domain(category.domain).range(valueRange).nice();
      colorScale = d3.scaleQuantize().domain(valueRange).range(category.colors);
      steps = util.range(0, category.colors.length - 1);
      var precision = Math.max.apply(null, category.domain
        .map(function (number) { return getPrecision(number); }));
      m_this._renderDiscreteColors(svg, steps, colorScale, width, function (d) {
        return m_this._popupFormatter(valueScale.invert(d), precision)
          + ' - ' + m_this._popupFormatter(valueScale.invert(d + 1), precision);
      });

      ticks = steps.slice();
      ticks.push(category.colors.length);
      axisScale = d3.scalePoint()
        .domain(ticks.map(function (tick) {
          return valueScale.invert(tick);
        }))
        .range([0, width]);
      axis = createAxis(axisScale);
    }
    if (category.endAxisLabelOnly) {
      axis.tickValues([axisScale.domain()[0], axisScale.domain()[axisScale.domain().length - 1]]);
    }
    m_this._renderAxis(svg, axis);
  };

  /**
   * Render colors for discrete type with d3.
   * @param {Element} svg svg element that the legend will be drawn
   * @param {number[]} steps discrete input scale domain for d3 scale
   * @param {object} colorScale d3 scale for transform input into color
   * @param {number} width width of the svg element in pixel
   * @param {function} getValue function that transforms raw domain into desired discrete range
   */
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
      .on('mousemove', function (evt, d) {
        m_this._showPopup(evt, getValue(d));
      })
      .on('mouseout', m_this._hidePopup);
  };

  /**
   * Draw an individual continuous type legend.
   * @param {Element} svg svg element that the legend will be drawn
   * @param {number} width width of the svg element in pixel
   * @param {geo.gui.colorLegendWidget.category} category The continuous type legend category
   */
  this._drawContinous = function (svg, width, category) {
    var axisScale, axis, i;
    if (['linear', 'log', 'sqrt', 'pow'].indexOf(category.scale) === -1) {
      throw new Error('unsupported scale');
    }
    var range = [0];
    for (i = 1; i < category.domain.length - 1; i++) {
      range.push((width / (category.domain.length - 1) * i));
    }
    range.push(width);
    axisScale = d3['scale' + category.scale.charAt(0).toUpperCase() + category.scale.slice(1)]().domain(category.domain).range(range).nice();
    if (category.scale === 'log' && category.base) {
      axisScale.base(category.base);
    }
    if (category.scale === 'pow' && category.exponent) {
      axisScale.exponent(category.exponent);
    }
    var id = uniqueID();
    var precision = Math.max.apply(null, category.domain
      .map(function (number) { return getPrecision(number); }));

    var gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'gradient' + id);
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', category.colors[0]);
    for (i = 1; i < category.colors.length - 1; i++) {
      gradient.append('stop')
        .attr('offset', (100 / (category.colors.length - 1) * i).toFixed(6) + '%')
        .attr('stop-color', category.colors[i]);
    }
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', category.colors[category.colors.length - 1]);
    svg.append('rect')
      .attr('fill', 'url(#gradient' + id + ')')
      .attr('width', width)
      .attr('height', '20px')
      .on('mousemove', function (event) {
        var value = axisScale.invert(d3.pointer(event)[0]);
        var text = m_this._popupFormatter(value, precision);
        m_this._showPopup(event, text);
      })
      .on('mouseout', m_this._hidePopup);

    axis = d3.axisBottom(axisScale)
      .ticks(m_ticks, '.2s');
    if (category.endAxisLabelOnly) {
      axis.tickValues([category.domain[0], category.domain[category.domain.length - 1]]);
    }
    m_this._renderAxis(svg, axis);
  };

  /**
   * Actually render the axis with d3.
   * @param {Element} svg svg element that the axis will be drawn
   * @param {object} axis d3 axis object
   */
  this._renderAxis = function (svg, axis) {
    svg.append('g')
      .attr('class', 'axis x')
      .attr('transform', 'translate(0, 20)')
      /*
      .call(function (g) {
        g.call(axis);
      });
      */
      .call(axis);
  };

  /**
   * Formatter of number that tries to maximize the precision
   * while making the output shorter.
   * @param {number} number to be formatted
   * @param {number} precision maximum number of decimal places that are kept
   * @returns {string} formatted string output
   */
  this._popupFormatter = function (number, precision) {
    number = parseFloat(number.toFixed(8));
    precision = Math.min(precision, getPrecision(number));
    precision = Math.min(precision, Math.max(3, 7 - Math.trunc(number).toString().length));
    return d3.format('.' + precision + 'f')(number);
  };

  /**
   * Show the popup based on current mouse event.
   * @param {d3.event} event The triggering d3 event.
   * @param {string} text content to be shown in the popup
   */
  this._showPopup = function (event, text) {
    // The cursor location relative to the container
    var offset = d3.pointer(event, m_this.canvas());
    m_this.popup
      .text(text);
    var containerWidth = m_this.canvas().clientWidth;
    var popupWidth = m_this.popup.node().clientWidth;
    m_this.popup
      // If the popup will be longer or almost longer than the container
      .style('left', offset[0] - (offset[0] + popupWidth - containerWidth > -10 ? popupWidth : 0) + 'px')
      .style('top', (offset[1] - 22) + 'px')
      .transition()
      .duration(200)
      .style('opacity', 1);
  };

  /**
   * Hide the popup.
   */
  this._hidePopup = function () {
    m_this.popup.transition()
      .duration(200)
      .style('opacity', 0);
  };

  return this;
};

/**
 * Get the number of decimals of a number.
 *
 * @private
 * @param {number} number the number input
 * @returns {number} the number of decimal
 */
function getPrecision(number) {
  if (!isFinite(number)) return 0;
  var e = 1, p = 0;
  while (Math.round(number * e) / e !== number) {
    if (!isFinite(number * e)) { return 0; }
    e *= 10;
    p++;
  }
  return p;
}

inherit(colorLegendWidget, domWidget);

registerWidget('dom', 'colorLegend', colorLegendWidget);
module.exports = colorLegendWidget;
