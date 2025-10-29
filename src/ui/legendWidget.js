var svgWidget = require('./svgWidget');
var inherit = require('../inherit');
var registerWidget = require('../registry').registerWidget;

/**
 * @typedef {object} geo.gui.legendWidget.categorySpec
 *
 * @property {string} name The name of the category.
 * @property {string} type The type of the category.  `point` shows as a
 *   circle, `line` as a line segment, all others as a rounded rectangle.
 * @property {geo.gui.legendWidget.styleSpec} style The style for the category.
 */

/**
 * Style specification for a legend category.
 *
 * @typedef {geo.feature.styleSpec} geo.gui.legendWidget.styleSpec
 * @extends geo.feature.styleSpec
 * @property {boolean|Function} [stroke=true] True to stroke legend.
 * @property {geo.geoColor|Function} [strokeColor] Color to stroke each legend.
 * @property {number|Function} [strokeOpacity=1] Opacity for each legend's
 *   stroke.  Opacity is on a [0-1] scale.
 * @property {number|Function} [strokeWidth=1.5] The weight of the legend's
 *   stroke in pixels.
 * @property {boolean|Function} [fill=true] True to fill legend.
 * @property {geo.geoColor|Function} [fillColor] Color to fill each legend.
 * @property {number|Function} [fillOpacity=1] Opacity for each legend.
 *   Opacity is on a [0-1] scale.
 */

/**
 * Create a new instance of class geo.gui.legendWidget.
 *
 * @class
 * @alias geo.gui.legendWidget
 * @extends geo.gui.svgWidget
 * @param {geo.gui.widget.spec} arg Options for the widget.
 * @returns {geo.gui.legendWidget}
 */
var legendWidget = function (arg) {
  'use strict';
  if (!(this instanceof legendWidget)) {
    return new legendWidget(arg);
  }
  svgWidget.call(this, arg);

  var d3 = require('../svg/svgRenderer').d3;
  var geo_event = require('../event');

  var m_this = this,
      m_categories = [],
      m_top = null,
      m_group = null,
      m_border = null,
      m_spacing = 20, // distance in pixels between lines
      m_padding = 12; // padding in pixels inside the border

  /**
   * Get or set the category array associated with the legend.
   *
   * @param {geo.gui.legendWidget.categorySpec[]} [arg] The categories to
   *   display.
   * @returns {geo.gui.legendWidget.categorySpec[]|this} The current categories
   *   or the widget instance.
   */
  this.categories = function (arg) {
    if (arg === undefined) {
      return m_categories.slice();
    }
    m_categories = arg.slice().map(function (d) {
      if (d.type === 'line') {
        d.style.fill = false;
        d.style.stroke = true;
      }
      return d;
    });
    m_this.draw();
    return m_this;
  };

  /**
   * Return the size of the widget.
   *
   * @returns {geo.screenSize}
   */
  this.size = function () {
    var width = 1, height;
    var test = d3.select(m_this.canvas()).append('text')
          .style('opacity', 1e-6);

    m_categories.forEach(function (d) {
      test.text(d.name);
      width = Math.max(width, test.node().getBBox().width);
    });
    test.remove();

    height = m_spacing * (m_categories.length + 1);
    return {
      width: width + 50,
      height: height
    };
  };

  /**
   * Redraw the legend.
   *
   * @returns {this}
   */
  this.draw = function () {

    m_this._init();
    function applyColor(selection) {
      selection.style('fill', function (d) {
        if (d.style.fill || d.style.fill === undefined) {
          return d.style.fillColor;
        } else {
          return 'none';
        }
      })
        .style('fill-opacity', function (d) {
          if (d.style.fillOpacity === undefined) {
            return 1;
          }
          return d.style.fillOpacity;
        })
        .style('stroke', function (d) {
          if (d.style.stroke || d.style.stroke === undefined) {
            return d.style.strokeColor;
          } else {
            return 'none';
          }
        })
        .style('stroke-opacity', function (d) {
          if (d.style.strokeOpacity === undefined) {
            return 1;
          }
          return d.style.strokeOpacity;
        })
        .style('stroke-width', function (d) {
          if (d.style.strokeWidth === undefined) {
            return 1.5;
          }
          return d.style.strokeWidth;
        });
    }

    m_border.attr('height', m_this.size().height + 2 * m_padding)
      .style('display', null);

    var scale = m_this._scale();

    var labels = m_group.selectAll('g.geo-label')
          .data(m_categories, function (d) { return d.name; });

    var g = labels.enter().append('g')
          .attr('class', 'geo-label')
          .attr('transform', function (d, i) {
            return 'translate(0,' + scale.y(i) + ')';
          });

    applyColor(g.filter(function (d) {
      return d.type !== 'point' && d.type !== 'line';
    }).append('rect')
      .attr('x', 0)
      .attr('y', -6)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('width', 40)
      .attr('height', 12)
    );

    applyColor(g.filter(function (d) {
      return d.type === 'point';
    }).append('circle')
      .attr('cx', 20)
      .attr('cy', 0)
      .attr('r', 6)
    );

    applyColor(g.filter(function (d) {
      return d.type === 'line';
    }).append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 40)
      .attr('y2', 0)
    );

    g.append('text')
      .attr('x', '50px')
      .attr('y', 0)
      .attr('dy', '0.3em')
      .text(function (d) {
        return d.name;
      });

    m_this.reposition();

    return m_this;
  };

  /**
   * Get scales for the x and y axis for the current size.
   *
   * @returns {object} An object with `x` and `y`, each containing a d3 scale.
   */
  this._scale = function () {
    return {
      x: d3.scaleLinear()
        .domain([0, 1])
        .range([0, m_this.size().width]),
      y: d3.scaleLinear()
        .domain([0, m_categories.length - 1])
        .range([m_padding / 2, m_this.size().height - m_padding / 2])
    };
  };

  /**
   * Private initialization.  Creates the widget's DOM container and internal
   * variables.
   * @private
   */
  this._init = function () {
    // adding categories redraws the entire thing by calling _init, see
    // the m_top.remove() line below
    if (!m_top) {
      m_this._createCanvas();
      m_this._appendCanvasToParent();
    }

    // total size = interior size + 2 * padding + 2 * width of the border
    var w = m_this.size().width + 2 * m_padding + 4,
        h = m_this.size().height + 2 * m_padding + 4;

    // @todo - removing after creating to maintain the appendChild structure
    if (m_top) {
      m_top.remove();
    }

    d3.select(m_this.canvas()).attr('width', w).attr('height', h);

    m_top = d3.select(m_this.canvas()).append('g');
    m_group = m_top
      .append('g')
      .attr('transform', 'translate(' + [m_padding + 2, m_padding + 2] + ')');
    m_border = m_group.append('rect')
      .attr('x', -m_padding)
      .attr('y', -m_padding)
      .attr('width', w - 4)
      .attr('height', h - 4)
      .attr('rx', 3)
      .attr('ry', 3);
    m_border
      .style('stroke', 'black')
      .style('stroke-width', '1.5px')
      .style('fill', 'white')
      .style('fill-opacity', 0.75)
      .style('display', 'none');
    m_group.on('mousedown', function (evt) {
      evt.stopPropagation();
    });
    m_group.on('mouseover', function () {
      m_border.transition()
        .duration(250)
        .style('fill-opacity', 1);
    });
    m_group.on('mouseout', function () {
      m_border.transition()
        .duration(250)
        .style('fill-opacity', 0.75);
    });

    m_this.reposition();
  };

  this.geoOn(geo_event.resize, function () {
    m_this.draw();
  });

};

inherit(legendWidget, svgWidget);

registerWidget('dom', 'legend', legendWidget);
module.exports = legendWidget;
