//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class legendWidget
 *
 * @class
 * @returns {geo.gui.legendWidget}
 */
//////////////////////////////////////////////////////////////////////////////
geo.gui.legendWidget = function (arg) {
  'use strict';
  if (!(this instanceof geo.gui.legendWidget)) {
    return new geo.gui.legendWidget(arg);
  }
  geo.gui.widget.call(this, arg);

  /** @private */
  var m_this = this,
      m_categories = [],
      m_group = null,
      m_border = null,
      m_spacing = 16, // distance in pixels between lines
      m_padding = 12; // padding in pixels inside the border

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Get or set the category array associated with
   * the legend.  Each element of this array is
   * an object: ::
   *     {
   *         name: string,
   *         style: object,
   *         type: 'point' | 'line' | ...
   *     }
   *
   * The style property can contain the following feature styles:
   *     * fill: bool
   *     * fillColor: object | string
   *     * fillOpacity: number
   *     * stroke: bool
   *     * strokeColor: object | string
   *     * strokeWidth: number
   *     * strokeOpacity: number
   *
   * The type controls how the element is displayed, point as a circle,
   * line as a line segment.  Any other value will display as a rounded
   * rectangle.
   *
   * @param {object[]?} categories The categories to display
   */
  //////////////////////////////////////////////////////////////////////////////
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

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Get or set the widget's size
   * @param {{width: number, height: number}} size The size in pixels
   */
  //////////////////////////////////////////////////////////////////////////////
  this.size = function (arg) {
    var width, height;
    if (arg === undefined) {
      width = 100;
      height = m_spacing * (m_categories.length + 1);
      return {
        width: width,
        height: height
      };
    }
    return m_this;
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Redraw the legend
   */
  //////////////////////////////////////////////////////////////////////////////
  this.draw = function () {

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

    var labels = m_group.selectAll('g.label')
      .data(m_categories, function (d) { return d.name; });

    labels.exit().remove();
    var g = labels.enter().append('g')
      .attr('class', 'label')
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

    return m_this;
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Get scales for the x and y axis for the current size.
   * @private
   */
  //////////////////////////////////////////////////////////////////////////////
  this._scale = function () {
    return {
      x: d3.scale.linear()
        .domain([0, 1])
        .range([0, m_this.size().width]),
      y: d3.scale.linear()
        .domain([0, m_categories.length - 1])
        .range([m_padding / 2, m_this.size().height - m_padding / 2])
    };
  };

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Private initialization.  Creates the widget's DOM container and internal
   * variables.
   * @private
   */
  //////////////////////////////////////////////////////////////////////////////
  this._init = function () {
    var w = m_this.size().width + 2 * m_padding,
        h = m_this.size().height + 2 * m_padding,
        nw = m_this.layer().map().node().width(),
        margin = 20;
    m_group = m_this.layer().renderer().canvas().append('g')
        .attr('transform', 'translate(' + (nw - w - margin) + ',' + margin + ')')
      .append('g')
        .attr('transform', 'translate(' + [m_padding - 1.5, m_padding] + ')');
    m_border = m_group.append('rect')
      .attr('x', -m_padding)
      .attr('y', -m_padding)
      .attr('width', w)
      .attr('height', h)
      .attr('rx', 2)
      .attr('ry', 2)
      .style({
        'stroke': 'black',
        'stroke-width': '1.5px',
        'fill': 'none',
        'display': 'none'
      });
  };
};

inherit(geo.gui.legendWidget, geo.gui.widget);

geo.registerWidget('d3', 'legend', geo.gui.legendWidget);
