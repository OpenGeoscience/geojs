

//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class sliderWidget
 *
 * @class
 * @returns {geo.sliderWidget}
 */
//////////////////////////////////////////////////////////////////////////////
geo.sliderWidget = function (arg) {
  'use strict';
  if (!(this instanceof geo.sliderWidget)) {
    return new geo.sliderWidget(arg);
  }
  geo.widget.call(this, arg);

  var m_this = this,
      m_xscale,
      m_yscale,
      m_plus,
      m_minus,
      m_track,
      m_nub,
      m_width = 20, // Approximate size of the widget in pixels
      m_height = 100,
      m_nubSize = 6,
      m_plusIcon,
      m_minusIcon;

  /* http://icomoon.io */
  /* CC BY 3.0 http://creativecommons.org/licenses/by/3.0/ */
  /* jshint -W101 */
  m_plusIcon = 'M512 81.92c-237.568 0-430.080 192.614-430.080 430.080 0 237.568 192.563 430.080 430.080 430.080s430.080-192.563 430.080-430.080c0-237.517-192.563-430.080-430.080-430.080zM564.326 564.326v206.182h-104.653v-206.182h-206.234v-104.653h206.182v-206.234h104.704v206.182h206.182v104.704h-206.182z';
  m_minusIcon = 'M512 81.92c-237.568 0-430.080 192.614-430.080 430.080 0 237.568 192.563 430.080 430.080 430.080s430.080-192.563 430.080-430.080c0-237.517-192.563-430.080-430.080-430.080zM770.56 459.674v104.704h-517.12v-104.704h517.12z';
  /* jshint +W101 */

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

  this._init = function () {
    var svg = m_this.layer().renderer().canvas(),
        x0 = 40,
        y0 = 40 + m_width,
        map = m_this.layer().map(),
        main = svg;

    // create d3 scales for positioning
    // TODO: make customizable and responsive
    m_xscale = d3.scale.linear().domain([-4, 4]).range([x0, x0 + m_width]);
    m_yscale = d3.scale.linear().domain([0, 1]).range([y0, y0 + m_height]);

    // Add a background
    var back = svg
      .append('rect')
        .attr('rx', 20)
        .attr('ry', 20)
        .style('fill', 'gray')
        .style('fill-opacity', 1)
        .attr('filter', 'url(#geo-blur)');

    svg = svg.append('g');

    m_plus = svg.append('g');
    m_plus.append('circle')
      .attr('cx', m_xscale(0))
      .attr('cy', m_yscale(0.0) - m_width + 2)
      .attr('r', m_width / 2)
      .style({
        'fill': 'white',
        'cursor': 'pointer'
      })
      .on('click', function () {
        var z = map.zoom();
        map.zoom(z + 1);
      })
      .on('mousedown', function () {
        d3.event.stopPropagation();
      });

    put_icon(
      m_plusIcon,
      m_plus,
      m_xscale(0),
      m_yscale(0) - m_width + 2,
      m_width + 5
    ).style('cursor', 'pointer')
      .style('pointer-events', 'none');


    m_minus = svg.append('g');
    m_minus.append('circle')
      .attr('cx', m_xscale(0))
      .attr('cy', m_yscale(1.0) + m_width - 2)
      .attr('r', m_width / 2)
      .style({
        'fill': 'white',
        'cursor': 'pointer'
      })
      .on('click', function () {
        var z = map.zoom();
        map.zoom(z - 1);
      })
      .on('mousedown', function () {
        d3.event.stopPropagation();
      });

    put_icon(
      m_minusIcon,
      m_minus,
      m_xscale(0),
      m_yscale(1) + m_width - 2,
      m_width + 5
    ).style('cursor', 'pointer')
      .style('pointer-events', 'none');

    // Respond to a mouse event on the widget
    function respond(evt) {
      var z = m_yscale.invert(d3.mouse(m_this.layer().node()[0])[1]),
          zrange = map.zoomRange();
      z = (1 - z) * (zrange.max - zrange.min) + zrange.min;
      map.zoom(z);
      m_this._update();
      evt.stopPropagation();
    }

    m_track = svg.append('rect')
      .attr('x', m_xscale(0) - m_width / 10)
      .attr('y', m_yscale(0))
      .attr('rx', m_width / 10)
      .attr('ry', m_width / 10)
      .attr('width', m_width / 5)
      .attr('height', m_height)
      .style({
        'fill': 'white',
        'stroke': 'black',
        'cursor': 'pointer'
      })
      .on('click', function () {
        respond(d3.event);
      });

    m_nub = svg.append('rect')
      .attr('x', m_xscale(-4))
      .attr('y', m_yscale(0.5) - m_nubSize / 2)
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('width', m_width)
      .attr('height', m_nubSize)
      .style({
        'fill': 'black',
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

    var bbox = svg.node().getBBox();
    back.attr('width', bbox.width + 20)
      .attr('height', bbox.height + 20)
      .attr('x', bbox.x - 10)
      .attr('y', bbox.y - 10)
      .style('opacity', 1e-6);
    main
      .on('mouseenter', function () {
        back.style('opacity', 1);
      })
      .on('mouseleave', function () {
        back.style('opacity', 1e-6);
      });


    svg.selectAll('*')
      .on('mouseover', function () {
        d3.select(this).attr('filter', 'url(#geo-highlight)');
      })
      .on('mouseout', function () {
        d3.select(this).attr('filter', null);
      });


    m_this.layer().geoOn(geo.event.zoom, function () {
      m_this._update();
    });

    m_this._update();
  };

  this._exit = function () {
    m_this.layer().renderer().canvas().remove();
    m_this.layer().geoOff(geo.event.zoom);
  };

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

inherit(geo.sliderWidget, geo.widget);

geo.registerWidget('d3', 'slider', geo.sliderWidget);
