var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var vectorFeature = require('../vectorFeature');

/**
 * Create a new instance of vectorFeature
 *
 * @class geo.d3.vectorFeature
 * @extends geo.vectorFeature
 * @extends geo.d3.object
 * @returns {geo.d3.vectorFeature}
 */
var d3_vectorFeature = function (arg) {
  'use strict';
  if (!(this instanceof d3_vectorFeature)) {
    return new d3_vectorFeature(arg);
  }

  var object = require('./object');
  var timestamp = require('../timestamp');
  var d3 = require('./d3Renderer').d3;

  arg = arg || {};
  vectorFeature.call(this, arg);
  object.call(this);

  /**
   * @private
   */
  var m_this = this,
      s_init = this._init,
      s_exit = this._exit,
      s_update = this._update,
      m_buildTime = timestamp(),
      m_style = {};

  /**
   * Generate a unique ID for a marker definition
   * @private
   * @param {object} d Unused datum (for d3 compat)
   * @param {number} i The marker index
   * @param {string} position The marker's vector position (head or tail)
   */
  function markerID(d, i, position) {
    return m_this._d3id() + '_marker_' + i + '_' + position;
  }

  /**
   * Add marker styles for vector arrows.
   * @private
   * @param {object[]} data The vector data array
   * @param {function} stroke The stroke accessor
   * @param {function} opacity The opacity accessor
   * @param {function} originStyle The marker style for the vector head
   * @param {function} endStyle The marker style for the vector tail
   */
  function updateMarkers(data, stroke, opacity, originStyle, endStyle) {

    var markerConfigs = {
      'arrow': {
        attrs: {'class': 'geo-vector-arrow geo-vector-marker', 'viewBox': '0 0 10 10', 'refX': '1', 'refY': '5', 'markerHeight': '5', 'markerWidth': '5', 'orient': 'auto'},
        path: 'M 0 0 L 10 5 L 0 10 z'
      },
      'point': {
        attrs: {'class': 'geo-vector-point geo-vector-marker', 'viewBox': '0 0 12 12', 'refX': '6', 'refY': '6', 'markerHeight': '8', 'markerWidth': '8', 'orient': 'auto'},
        path: 'M 6 3 A 3 3 0 1 1 5.99999 3 Z'
      },
      'bar': {
        attrs: {'class': 'geo-vector-bar geo-vector-marker', 'viewBox': '0 0 10 10', 'refX': '0', 'refY': '5', 'markerHeight': '6', 'markerWidth': '6', 'orient': 'auto'},
        path: 'M 0 0 L 2 0 L 2 10 L 0 10 z'
      },
      'wedge': {
        attrs: {'class': 'geo-vector-wedge geo-vector-marker', 'viewBox': '0 0 10 10', 'refX': '10', 'refY': '5', 'markerHeight': '5', 'markerWidth': '5', 'orient': 'auto'},
        path: 'M 0 0 L 1 0 L 10 5 L 1 10 L 0 10 L 9 5 L 0 0'
      }
    };

    //this allows for multiple VectorFeatures in a layer
    var markerGroup = m_this.renderer()._definitions()
      .selectAll('g.marker-group#' + m_this._d3id())
      .data(data.length ? [1] : []);

    markerGroup
      .enter()
      .append('g')
      .attr('id', m_this._d3id)
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
        Object.keys(markerData.attrs).map(function (attrName) {
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
   * Initialize
   * @protected
   */
  this._init = function (arg) {
    s_init.call(m_this, arg);
    return m_this;
  };

  /**
   * Build
   * @protected
   */
  this._build = function () {
    var data = m_this.data(),
        s_style = m_this.style.get(),
        m_renderer = m_this.renderer(),
        orig_func = m_this.origin(),
        size_func = m_this.delta(),
        cache = [],
        scale = m_this.style('scale'),
        max = Number.NEGATIVE_INFINITY;

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
      scale = 75 / max;
    }

    function getScale() {
      return scale / m_renderer.scaleFactor();
    }

    // fill in d3 renderer style object defaults
    m_style.id = m_this._d3id();
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
    m_style.classes = ['d3VectorFeature'];
    m_style.visible = m_this.visible;

    // Add markers to the defition list
    updateMarkers(data, s_style.strokeColor, s_style.strokeOpacity, s_style.originStyle, s_style.endStyle);

    // pass to renderer to draw
    m_this.renderer()._drawFeatures(m_style);

    // update time stamps
    m_buildTime.modified();
    m_this.updateTime().modified();
    return m_this;
  };

  /**
   * Update
   * @protected
   */
  this._update = function () {
    s_update.call(m_this);

    if (m_this.getMTime() >= m_buildTime.getMTime()) {
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
   * Exit
   * @protected
   */
  this._exit = function () {
    s_exit.call(m_this);
    m_style = {};
    updateMarkers([], null, null, null, null);
  };

  this._init(arg);
  return this;
};

inherit(d3_vectorFeature, vectorFeature);

// Now register it
registerFeature('d3', 'vector', d3_vectorFeature);
module.exports = d3_vectorFeature;
