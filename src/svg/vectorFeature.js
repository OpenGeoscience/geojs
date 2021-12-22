var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var vectorFeature = require('../vectorFeature');

/* These markers are available to all instances of the vectorFeature. */
var markerConfigs = {
  arrow: {
    attrs: {
      class: 'geo-vector-arrow geo-vector-marker',
      viewBox: '0 0 10 10',
      refX: 1,
      refY: 5,
      markerHeight: 5,
      markerWidth: 5,
      orient: 'auto'
    },
    path: 'M 0 0 L 10 5 L 0 10 z'
  },
  point: {
    attrs: {
      class: 'geo-vector-point geo-vector-marker',
      viewBox: '0 0 12 12',
      refX: 6,
      refY: 6,
      markerHeight: 8,
      markerWidth: 8,
      orient: 'auto'
    },
    path: 'M 6 3 A 3 3 0 1 1 5.99999 3 Z'
  },
  bar: {
    attrs: {
      class: 'geo-vector-bar geo-vector-marker',
      viewBox: '0 0 10 10',
      refX: 0,
      refY: 5,
      markerHeight: 6,
      markerWidth: 6,
      orient: 'auto'
    },
    path: 'M 0 0 L 2 0 L 2 10 L 0 10 z'
  },
  wedge: {
    attrs: {
      class: 'geo-vector-wedge geo-vector-marker',
      viewBox: '0 0 10 10',
      refX: 10,
      refY: 5,
      markerHeight: 5,
      markerWidth: 5,
      orient: 'auto'
    },
    path: 'M 0 0 L 1 0 L 10 5 L 1 10 L 0 10 L 9 5 L 0 0'
  }
};

/**
 * Create a new instance of svg.vectorFeature.
 *
 * @class
 * @alias geo.svg.vectorFeature
 * @extends geo.vectorFeature
 * @extends geo.svg.object
 * @param {geo.vectorFeature.spec} arg Feature options.
 * @returns {geo.vectorFeature}
 */
var svg_vectorFeature = function (arg) {
  'use strict';
  if (!(this instanceof svg_vectorFeature)) {
    return new svg_vectorFeature(arg);
  }

  var object = require('./object');
  var timestamp = require('../timestamp');
  var d3 = require('./svgRenderer').d3;

  arg = arg || {};
  vectorFeature.call(this, arg);
  object.call(this);

  /**
   * @private
   */
  var m_this = this,
      s_exit = this._exit,
      s_update = this._update,
      m_buildTime = timestamp(),
      m_style = {};

  /**
   * Generate a unique ID for a marker definition.
   *
   * @param {object} d The marker datum (unused).
   * @param {number} i The marker index.
   * @param {string} position The marker's vector position (`'head'` or
   *   `'tail'`).
   * @returns {string} The constructed ID.
   */
  function markerID(d, i, position) {
    return m_this._svgid() + '_marker_' + i + '_' + position;
  }

  /**
   * Add marker styles for vector arrows.
   *
   * @param {object[]} data The vector data array.
   * @param {function} stroke The stroke accessor.
   * @param {function} opacity The opacity accessor.
   * @param {function} originStyle The marker style for the vector head.
   * @param {function} endStyle The marker style for the vector tail.
   */
  function updateMarkers(data, stroke, opacity, originStyle, endStyle) {
    //this allows for multiple vectorFeature in a layer
    var markerGroup = m_this.renderer()._definitions()
      .selectAll('g.marker-group#' + m_this._svgid())
      .data(data.length ? [1] : []);

    markerGroup
      .enter()
      .append('g')
      .attr('id', m_this._svgid)
      .attr('class', 'marker-group');

    markerGroup.exit().remove();

    var markers = data.reduce(function (markers, d, i) {
      var head = markerConfigs[endStyle(d, i)];
      var tail = markerConfigs[originStyle(d, i)];
      if (head) {
        markers.push({
          data: d,
          dataIndex: i,
          head: true
        });
      }
      if (tail) {
        markers.push({
          data: d,
          dataIndex: i,
          head: false
        });
      }
      return markers;
    }, []);

    var sel = markerGroup
      .selectAll('marker.geo-vector-marker')
      .data(markers);

    sel.enter()
      .append('marker')
      .append('path');

    var renderer = m_this.renderer();

    sel
      .each(function (d) {
        var marker = d3.select(this);
        var markerData = d.head ? markerConfigs[endStyle(d.data, d.dataIndex)] : markerConfigs[originStyle(d.data, d.dataIndex)];
        Object.keys(markerData.attrs).forEach(function (attrName) {
          marker.attr(attrName, markerData.attrs[attrName]);
        });
      })
      .attr('id', function (d) {
        return markerID(d.data, d.dataIndex, d.head ? 'head' : 'tail');
      })
      .style('stroke', function (d) {
        return renderer._convertColor(stroke)(d.data, d.dataIndex);
      })
      .style('fill', function (d) {
        return renderer._convertColor(stroke)(d.data, d.dataIndex);
      })
      .style('opacity', function (d) {
        return opacity(d.data, d.dataIndex);
      })
      .select('path')
      .attr('d', function (d) {
        return d.head ? markerConfigs[endStyle(d.data, d.dataIndex)].path : markerConfigs[originStyle(d.data, d.dataIndex)].path;
      });

    sel.exit().remove();
  }

  /**
   * Build.
   *
   * @returns {this}.
   */
  this._build = function () {
    var data = m_this.data(),
        s_style = m_this.style.get(),
        m_renderer = m_this.renderer(),
        orig_func = m_this.origin(),
        size_func = m_this.delta(),
        cache = [],
        scale = m_this.style('scale'),
        max = 0;

    // call super-method
    s_update.call(m_this);

    // default to empty data array
    if (!data) { data = []; }

    // cache the georeferencing
    cache = data.map(function (d, i) {
      var origin = m_this.featureGcsToDisplay(orig_func(d, i)),
          delta = size_func(d, i);
      max = Math.max(max, delta.x * delta.x + delta.y * delta.y);
      return {
        x1: origin.x,
        y1: origin.y,
        dx: delta.x,
        dy: -delta.y
      };
    });

    max = Math.sqrt(max);
    if (!scale) {
      scale = 75 / (max ? max : 1);
    }

    function getScale() {
      return scale / m_renderer.scaleFactor();
    }

    // fill in svg renderer style object defaults
    m_style.id = m_this._svgid();
    m_style.data = data;
    m_style.append = 'line';
    m_style.attributes = {
      x1: function (d, i) {
        return cache[i].x1;
      },
      y1: function (d, i) {
        return cache[i].y1;
      },
      x2: function (d, i) {
        return cache[i].x1 + getScale() * cache[i].dx;
      },
      y2: function (d, i) {
        return cache[i].y1 + getScale() * cache[i].dy;
      },
      'marker-start': function (d, i) {
        return 'url(#' + markerID(d, i, 'tail') + ')';
      },
      'marker-end': function (d, i) {
        return 'url(#' + markerID(d, i, 'head') + ')';
      }
    };
    m_style.style = {
      stroke: function () { return true; },
      strokeColor: s_style.strokeColor,
      strokeWidth: s_style.strokeWidth,
      strokeOpacity: s_style.strokeOpacity,
      originStyle: s_style.originStyle,
      endStyle: s_style.endStyle
    };
    m_style.classes = ['svgVectorFeature'];
    m_style.visible = m_this.visible;

    // Add markers to the definition list
    updateMarkers(data, s_style.strokeColor, s_style.strokeOpacity, s_style.originStyle, s_style.endStyle);

    // pass to renderer to draw
    m_this.renderer()._drawFeatures(m_style);

    // update time stamps
    m_buildTime.modified();
    m_this.updateTime().modified();
    return m_this;
  };

  /**
   * Update.
   *
   * @returns {this}
   */
  this._update = function () {
    s_update.call(m_this);

    if (m_this.timestamp() >= m_buildTime.timestamp()) {
      m_this._build();
    } else {
      updateMarkers(
        m_style.data,
        m_style.style.strokeColor,
        m_style.style.strokeOpacity,
        m_style.style.originStyle,
        m_style.style.endStyle
      );
    }

    return m_this;
  };

  /**
   * Exit.  Remove markers.
   */
  this._exit = function () {
    s_exit.call(m_this);
    m_style = {};
    updateMarkers([], null, null, null, null);
  };

  this._init(arg);
  return this;
};

svg_vectorFeature.markerConfigs = markerConfigs;

inherit(svg_vectorFeature, vectorFeature);

// Now register it
registerFeature('svg', 'vector', svg_vectorFeature);
module.exports = svg_vectorFeature;
