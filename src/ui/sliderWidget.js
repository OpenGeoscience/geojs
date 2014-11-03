

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
      m_nubSize = 6;

  this._init = function () {
    var svg = m_this.layer().renderer().canvas(),
        x0 = 40,
        y0 = 40 + m_width,
        map = m_this.layer().map();

    // create d3 scales for positioning
    // TODO: make customizable and responsive
    m_xscale = d3.scale.linear().domain([-4, 4]).range([x0, x0 + m_width]);
    m_yscale = d3.scale.linear().domain([0, 1]).range([y0, y0 + m_height]);

    m_plus = svg.append('circle')
      .attr('cx', m_xscale(0))
      .attr('cy', m_yscale(0.0) - m_width + 2)
      .attr('r', m_width / 2)
      .style({
        'fill': 'red',
        'cursor': 'pointer'
      })
      .on('click', function () {
        var z = map.zoom();
        map.zoom(z + 1);
      })
      .on('mousedown', function () {
        d3.event.stopPropagation();
      });

    m_minus = svg.append('circle')
      .attr('cx', m_xscale(0))
      .attr('cy', m_yscale(1.0) + m_width - 2)
      .attr('r', m_width / 2)
      .style({
        'fill': 'blue',
        'cursor': 'pointer'
      })
      .on('click', function () {
        var z = map.zoom();
        map.zoom(z - 1);
      })
      .on('mousedown', function () {
        d3.event.stopPropagation();
      });

    m_track = svg.append('rect')
      .attr('x', m_xscale(0) - m_width / 10)
      .attr('y', m_yscale(0))
      .attr('rx', m_width / 10)
      .attr('ry', m_width / 10)
      .attr('width', m_width / 5)
      .attr('height', m_height)
      .style({
        'fill': 'lightgray',
        'cursor': 'pointer'
      });

    m_nub = svg.append('rect')
      .attr('x', m_xscale(-4))
      .attr('y', m_yscale(0.5) - m_nubSize / 2)
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('width', m_width)
      .attr('height', m_nubSize)
      .style({
        'fill': 'darkgray',
        'cursor': 'pointer'
      })
      .on('mousedown', function () {
        function respond() {
          var z = m_yscale.invert(d3.mouse(m_this.layer().node()[0])[1]),
              zrange = map.zoomRange(), evt = d3.event;
          z = (1 - z) * (zrange.max - zrange.min) + zrange.min;
          map.zoom(z);
          m_this._update();
          evt.stopPropagation();
        }
        d3.select(document).on('mousemove.geo.slider', function () {
          respond();
        });
        d3.select(document).on('mouseup.geo.slider', function () {
          respond(true);
          d3.select(document).on('.geo.slider', null);
        });
        d3.event.stopPropagation();
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
