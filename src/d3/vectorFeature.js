//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of vectorFeature
 *
 * @class
 * @extends geo.vectorFeature
 * @extends geo.d3.object
 * @returns {geo.d3.vectorFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.d3.vectorFeature = function (arg) {
  'use strict';
  if (!(this instanceof geo.d3.vectorFeature)) {
    return new geo.d3.vectorFeature(arg);
  }
  arg = arg || {};
  geo.vectorFeature.call(this, arg);
  geo.d3.object.call(this);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      s_init = this._init,
      s_exit = this._exit,
      s_update = this._update,
      m_buildTime = geo.timestamp(),
      m_style = {};

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Generate a unique ID for a marker definition
   * @private
   * @param {object} d Unused datum (for d3 compat)
   * @param {number} i The marker index
   */
  ////////////////////////////////////////////////////////////////////////////
  function markerID(d, i) {
    return m_this._d3id() + '_marker_' + i;
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add marker styles for vector arrows.
   * @private
   * @param {object[]} data The vector data array
   * @param {function} stroke The stroke accessor
   * @param {function} opacity The opacity accessor
   */
  ////////////////////////////////////////////////////////////////////////////
  function updateMarkers(data, stroke, opacity, originStyle, endStyle, featureID) {

    var markers = [
      {
        type: 'arrow',
        attrs: {'class': 'geo-vector', 'viewBox': '0 0 10 10', 'refX': '1', 'refY': '5', 'markerHeight': '5', 'markerWidth': '5', 'orient': 'auto'},
        path: 'M 0 0 L 10 5 L 0 10 z'
      },
      {
        type: 'point',
        attrs: {'class': 'geo-vector', 'viewBox': '0 0 12 12', 'refX': '6', 'refY': '6', 'markerHeight': '8', 'markerWidth': '8', 'orient': 'auto'},
        path: 'M 6 3 A 3 3 0 1 1 5.99999 3 Z'
      },
      {
        type: 'bar',
        attrs: {'class': 'geo-vector', 'viewBox': '0 0 10 10', 'refX': '0', 'refY': '5', 'markerHeight': '6', 'markerWidth': '6', 'orient': 'auto'},
        path: 'M 0 0 L 2 0 L 2 10 L 0 10 z'
      },
      {
        type: 'wedge',
        attrs: {'class': 'geovector', 'viewBox': '0 0 10 10', 'refX': '10', 'refY': '5', 'markerHeight': '5', 'markerWidth': '5', 'orient': 'auto'},
        path: 'M 0 0 L 1 0 L 10 5 L 1 10 L 0 10 L 9 5 L 0 0'
      },
    ];

    var renderer = m_this.renderer();

    //markers don't correspond 1:1 to the data array,
    // there should be <=2 markers for each vector feature (which may be a set of vectors)
    // however, when the data array is empty, we want to remove any associated markers from the DOM
    var markerSet = markers.filter(function(m){
      return (m.type === originStyle() || m.type === endStyle()) && data.length; //return [] if there is no data to render
    });

    var sel = m_this.renderer()._definitions()
      .selectAll('marker.geo-vector[data-feature-id=' + featureID + ']')
      .data(markerSet);

    sel.enter()
      .append('marker')
      .each(function(marker, i){
        var domMarker = d3.select(this);
        Object.keys(marker.attrs).map(function(attrName){
          domMarker.attr(attrName, marker.attrs[attrName]);
        });
        domMarker.attr('id', markerID(marker, i));
        domMarker.attr('data-feature-id', featureID);
        domMarker.append('path')
        .attr('d', marker.path);
      });

    sel.exit().remove();

    m_style.markers = sel;

    sel.style('stroke', renderer._convertColor(stroke))
      .style('fill', renderer._convertColor(stroke))
      .style('opacity', opacity);
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
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
      'marker-end': function (d, i) {
        var marker = m_style.markers.filter(function(m){
          return m.type === s_style.endStyle();
        });
        var url = marker.size() ? 'url(#' + marker.attr('id') + ')' : null;
        return url;
      },
      'marker-start': function (d, i) {
        var marker = m_style.markers.filter(function(m){
          return m.type === s_style.originStyle();
        });
        var url = marker.size() ? 'url(#' + marker.attr('id') + ')' : null;
        return url;
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

    // Add markers to the defition list
    updateMarkers(data, s_style.strokeColor, s_style.strokeOpacity, s_style.originStyle, s_style.endStyle, m_style.id);

    // pass to renderer to draw
    m_this.renderer()._drawFeatures(m_style);

    // update time stamps
    m_buildTime.modified();
    m_this.updateTime().modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
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
        m_style.style.endStyle,
        m_style.id
      );
    }

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Exit
   * @protected
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    s_exit.call(m_this);
    m_style = {};
    updateMarkers([], null, null, null, null, m_style.id);
  };

  this._init(arg);
  return this;
};

inherit(geo.d3.vectorFeature, geo.vectorFeature);

// Now register it
geo.registerFeature('d3', 'vector', geo.d3.vectorFeature);
