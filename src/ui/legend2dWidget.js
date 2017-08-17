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

  var oldInit = this._init;

  this._init = function () {
    oldInit();
    var canvas = m_this.canvas();
    d3.select(canvas)
      .style({
        'padding': '10px',
        'border': '1.5px solid black',
        'border-radius': '3px',
        'transition': '250ms background linear',
        'background-color': 'rgba(255, 255, 255, 0.75)'
      })
      .on('mouseover', function () {
        d3.select(this)
          .style('background-color', 'rgba(255, 255, 255, 1)');
      })
      .on('mouseout', function () {
        d3.select(this)
          .style('background-color', 'rgba(255, 255, 255, 0.75)');
      });

    m_this.popup = d3.select(canvas).append('div')
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
        'opacity': 0,
      })

    if (arg.categories) {
      this.categories(arg.categories);
    }
  }

  this.draw = function () {
    d3.select(m_this.canvas()).selectAll('div.legends').remove();

    var container = d3.select(m_this.canvas())
      .append('div')
      .attr('class', 'legends');

    var width = 300;
    var margin = 20;

    m_categories.forEach(function (category, index) {
      var legendContainer = container
        .append('div')
        .style({
          'margin-bottom': '10px'
        });

      legendContainer
        .append('div')
        .text(category.name)
        .style({
          'text-align': 'center'
        })

      var legendSvg = legendContainer
        .append('svg')
        .attr({
          'display': 'block',
          'width': width,
          'height': '40px',
          'viewBox': -margin + ' 0 ' + width + ' 40'
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
      m_this._renderDiscreteColors(svg, category.domain, colorScale, width, function (d) { return d; });

      axisScale = d3.scale.ordinal()
        .domain(category.domain)
        .rangeRoundBands([0, width]);
      var axis = d3.svg.axis()
        .scale(axisScale);
      m_this._renderAxis(svg, axis);

    }
    else if (category.scale === 'quantile') {
      var valueRange = [0, category.colors.length];
      var steps = range(0, category.colors.length - 1);
      var valueScale = d3.scale.quantile().domain(category.domain).range(steps);
      var colorScale = d3.scale.quantize().domain(valueRange).range(category.colors);
      m_this._renderDiscreteColors(svg, steps, colorScale, width, function (d) {
        return valueScale.invertExtent(d).join(' - ');
      });

      var axisDomain = [valueScale.invertExtent(0)[0]];
      axisDomain = axisDomain.concat(steps.map(function (step) { return valueScale.invertExtent(step)[1] }));

      var ticks = steps.slice();
      ticks.push(category.colors.length);
      var axisScale = d3.scale.ordinal()
        .domain(axisDomain)
        .rangePoints([0, width]);
      var axis = createDiscreteContinousAxis(axisScale);
      m_this._renderAxis(svg, axis);
    }
    else if (['linear', 'log', 'sqrt', 'pow'].indexOf(category.scale) != -1) {
      var valueRange = [0, category.colors.length];
      var valueScale = d3.scale[category.scale]().domain(category.domain).range(valueRange).nice();
      var colorScale = d3.scale.quantize().domain(valueRange).range(category.colors);
      var steps = range(0, category.colors.length - 1);
      var precision = Math.max.apply(null, category.domain.map(function (number) { return getPrecision(number) }));
      m_this._renderDiscreteColors(svg, steps, colorScale, width, function (d) {
        return m_this._popupFormatter(valueScale.invert(d), precision) + ' - ' + m_this._popupFormatter(valueScale.invert(d + 1), precision);
      });

      var ticks = steps.slice();
      ticks.push(category.colors.length);
      var axisScale = d3.scale.ordinal()
        .domain(ticks.map(function (tick) {
          return valueScale.invert(tick);
        }))
        .rangePoints([0, width]);
      var axis = createDiscreteContinousAxis(axisScale);
      m_this._renderAxis(svg, axis);
    }

    function createDiscreteContinousAxis(axisScale) {
      return d3.svg.axis()
        .scale(axisScale)
        .tickFormat(d3.format('.2s'))
        .tickValues(function () {
          var skip = Math.ceil(axisScale.domain().length / 6);
          return axisScale.domain().filter(function (d, i) { return i % skip === 0; });
        });
    }
  }

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
    var precision = Math.max.apply(null, category.domain.map(function (number) { return getPrecision(number) }));

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
      .on('mousemove', function (d) {
        var value = axisScale.invert(d3.mouse(this)[0]);
        var text = m_this._popupFormatter(value, precision);
        m_this._showPopup(text);
      })
      .on('mouseout', m_this._hidePopup)

    var axis = d3.svg.axis()
      .scale(axisScale)
      .ticks(6, '.2s');

    this._renderAxis(svg, axis);
  }

  this._popupFormatter = function (number, precision) {
    number = parseFloat(number.toFixed(8));
    var precision = Math.min(precision, getPrecision(number));
    precision = Math.min(precision, Math.max(3, 7 - Math.trunc(number).toString().length))
    return d3.format('.' + precision + 'f')(number);
  }

  this._showPopup = function (text) {
    var offset = d3.mouse(m_this.canvas());
    m_this.popup
      .text(text)
      .style({
        'left': offset[0] + 'px',
        'top': (offset[1] - 22) + 'px'
      })
    m_this.popup
      .transition()
      .duration(200)
      .style('opacity', 1)
  }

  this._hidePopup = function () {
    m_this.popup.transition()
      .duration(200)
      .style('opacity', 0);
  }

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

inherit(legend2dWidget, domWidget);

registerWidget('dom', 'legend2d', legend2dWidget);
module.exports = legend2dWidget;
