var svgWidget = require('./svgWidget');
var inherit = require('../inherit');
var registerWidget = require('../registry').registerWidget;

/**
 * Create a new instance of class sliderWidget
 *
 * @class geo.gui.sliderWidget
 * @extends {geo.gui.svgWidget}
 * @returns {geo.gui.sliderWidget}
 */
var sliderWidget = function (arg) {
  'use strict';
  if (!(this instanceof sliderWidget)) {
    return new sliderWidget(arg);
  }
  svgWidget.call(this, arg);

  var d3 = require('../d3/d3Renderer').d3;
  var geo_event = require('../event');

  var m_this = this,
      s_exit = this._exit,
      m_xscale,
      m_yscale,
      m_plus,
      m_minus,
      m_nub,
      m_width = arg.width || 20, // Size of the widget in pixels
      m_height = arg.height || 160,  // slider height + 3 * width
      m_nubSize = arg.width ? arg.width * 0.5 : 10,
      m_plusIcon,
      m_minusIcon,
      m_group,
      m_lowContrast,
      m_highlightDur = 100;

  /* http://icomoon.io */
  /* CC BY 3.0 http://creativecommons.org/licenses/by/3.0/ */
  m_plusIcon = 'M512 81.92c-237.568 0-430.080 192.614-430.080 430.080 0 237.568 192.563 430.080 430.080 430.080s430.080-192.563 430.080-430.080c0-237.517-192.563-430.080-430.080-430.080zM564.326 564.326v206.182h-104.653v-206.182h-206.234v-104.653h206.182v-206.234h104.704v206.182h206.182v104.704h-206.182z';
  m_minusIcon = 'M512 81.92c-237.568 0-430.080 192.614-430.080 430.080 0 237.568 192.563 430.080 430.080 430.080s430.080-192.563 430.080-430.080c0-237.517-192.563-430.080-430.080-430.080zM770.56 459.674v104.704h-517.12v-104.704h517.12z';

  // Define off-white gray colors for low contrast ui (unselected).
  m_lowContrast = {
    white: '#f4f4f4',
    black: '#505050'
  };

  /**
   * Add an icon from a path string.  Returns a d3 group element.
   *
   * @function
   * @argument {String} icon svg path string
   * @argument {Array} base where to append the element (d3 selection)
   * @argument {Number} cx Center x-coordinate
   * @argument {Number} cy Center y-coordinate
   * @argument {Number} size Icon size in pixels
   * @returns {object}
   * @private
   */
  function put_icon(icon, base, cx, cy, size) {
    var g = base.append('g');

    // the scale factor
    var s = size / 1024;

    g.append('g')
      .append('g')
        .attr(
          'transform',
          'translate(' + cx + ',' + cy + ') scale(' + s + ') translate(-512,-512)'
      )
      .append('path')
        .attr('d', icon)
        .attr('class', 'geo-glyphicon');

    return g;
  }

  this.size = function () {
    return {width: m_width, height: m_height};
  };

  /**
   * Initialize the slider widget in the map.
   *
   * @function
   * @returns {geo.gui.sliderWidget}
   * @private
   */
  this._init = function () {
    m_this._createCanvas();
    m_this._appendCanvasToParent();

    m_this.reposition();

    var svg = d3.select(m_this.canvas()),
        map = m_this.layer().map();

    svg.attr('width', m_width).attr('height', m_height);

    // create d3 scales for positioning
    // TODO: make customizable and responsive
    m_xscale = d3.scale.linear().domain([-4, 4]).range([0, m_width]);
    m_yscale = d3.scale.linear().domain([0, 1]).range([m_width * 1.5, m_height - m_width * 1.5]);

    // Create the main group element
    svg = svg.append('g').classed('geo-ui-slider', true);
    m_group = svg;

    // Create + zoom button
    m_plus = svg.append('g');
    m_plus.append('circle')
      .datum({
        fill: 'white',
        stroke: null
      })
      .classed('geo-zoom-in', true)
      .attr('cx', m_xscale(0))
      .attr('cy', m_yscale(0.0) - m_width + 2)
      .attr('r', (m_width - 2) / 2)
      .style({
        'cursor': 'pointer'
      })
      .on('click', function () {
        var z = map.zoom();
        map.transition({
          zoom: z + 1,
          ease: d3.ease('cubic-in-out'),
          duration: 500
        });
      })
      .on('mousedown', function () {
        d3.event.stopPropagation();
      });

    put_icon(
      m_plusIcon,
      m_plus,
      m_xscale(0),
      m_yscale(0) - m_width + 2,
      m_width + 4
    ).style('cursor', 'pointer')
      .style('pointer-events', 'none')
      .select('path')
      .datum({
        fill: 'black',
        stroke: null
      });

    // Create the - zoom button
    m_minus = svg.append('g');
    m_minus.append('circle')
      .datum({
        fill: 'white',
        stroke: null
      })
      .classed('geo-zoom-out', true)
      .attr('cx', m_xscale(0))
      .attr('cy', m_yscale(1.0) + m_width - 2)
      .attr('r', (m_width - 2) / 2)
      .style({
        'cursor': 'pointer'
      })
      .on('click', function () {
        var z = map.zoom();
        map.transition({
          zoom: z - 1,
          ease: d3.ease('cubic-in-out'),
          duration: 500
        });
      })
      .on('mousedown', function () {
        d3.event.stopPropagation();
      });

    put_icon(
      m_minusIcon,
      m_minus,
      m_xscale(0),
      m_yscale(1) + m_width - 2,
      m_width + 4
    ).style('cursor', 'pointer')
      .style('pointer-events', 'none')
      .select('path')
      .datum({
        fill: 'black',
        stroke: null
      });

    // Respond to a mouse event on the widget
    function respond(evt, trans) {
      var z = m_yscale.invert(d3.mouse(svg.node())[1]),
          zrange = map.zoomRange();
      z = (1 - z) * (zrange.max - zrange.min) + zrange.min;
      if (trans) {
        map.transition({
          zoom: z,
          ease: d3.ease('cubic-in-out'),
          duration: 500,
          done: m_this._update()
        });
      } else {
        map.zoom(z);
        m_this._update();
      }
      evt.stopPropagation();
    }

    // Create the track
    svg.append('rect')
      .datum({
        fill: 'white',
        stroke: 'black'
      })
      .classed('geo-zoom-track', true)
      .attr('x', m_xscale(0) - m_width / 6)
      .attr('y', m_yscale(0))
      .attr('rx', m_width / 10)
      .attr('ry', m_width / 10)
      .attr('width', m_width / 3)
      .attr('height', m_height - m_width * 3)
      .style({
        'cursor': 'pointer'
      })
      .on('click', function () {
        respond(d3.event, true);
      });

    // Create the nub
    m_nub = svg.append('rect')
      .datum({
        fill: 'black',
        stroke: null
      })
      .classed('geo-zoom-nub', true)
      .attr('x', m_xscale(-4))
      .attr('y', m_yscale(0.5) - m_nubSize / 2)
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('width', m_width)
      .attr('height', m_nubSize)
      .style({
        'cursor': 'pointer'
      })
      .on('mousedown', function () {
        d3.select(document).on('mousemove.geo.slider', function () {
          respond(d3.event);
        });
        d3.select(document).on('mouseup.geo.slider', function () {
          respond(d3.event);
          d3.select(document).on('.geo.slider', null);
        });
        d3.event.stopPropagation();
      });

    var mouseOver = function () {
      d3.select(this).attr('filter', 'url(#geo-highlight)');
      m_group.selectAll('rect,path,circle').transition()
        .duration(m_highlightDur)
        .style('fill', function (d) {
          return d.fill || null;
        })
        .style('stroke', function (d) {
          return d.stroke || null;
        });

    };

    var mouseOut = function () {
      d3.select(this).attr('filter', null);
      m_group.selectAll('circle,rect,path').transition()
        .duration(m_highlightDur)
        .style('fill', function (d) {
          return m_lowContrast[d.fill] || null;
        })
        .style('stroke', function (d) {
          return m_lowContrast[d.stroke] || null;
        });
    };

    m_group.selectAll('*')
      .on('mouseover', mouseOver)
      .on('mouseout', mouseOut);

    // Update the nub position on zoom
    m_this.geoOn(geo_event.zoom, m_this._update);

    mouseOut();
    m_this._update();
  };

  /**
   * Removes the slider element from the map and unbinds all handlers.
   *
   * @function
   * @returns {geo.gui.sliderWidget}
   * @private
   */
  this._exit = function () {
    m_this.geoOff(geo_event.zoom, m_this._update);
    m_group.remove();
    s_exit();
  };

  /**
   * Update the slider widget state in reponse to map changes.  I.e. zoom
   * range changes.
   *
   * @function
   * @returns {geo.gui.sliderWidget}
   * @private
   */
  this._update = function (obj) {
    var map = m_this.layer().map(),
        zoomRange = map.zoomRange(),
        zoom = map.zoom(),
        zoomScale = d3.scale.linear();

    obj = obj || {};
    zoom = obj.value || zoom;
    zoomScale.domain([zoomRange.min, zoomRange.max])
      .range([1, 0])
      .clamp(true);

    m_nub.attr('y', m_yscale(zoomScale(zoom)) - m_nubSize / 2);
  };
};

inherit(sliderWidget, svgWidget);

registerWidget('dom', 'slider', sliderWidget);
module.exports = sliderWidget;
