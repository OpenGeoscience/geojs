var inherit = require('./inherit');
var feature = require('./feature');

/**
 * Create a new instance of class graphFeature
 *
 * @class geo.graphFeature
 * @extends geo.feature
 * @returns {geo.graphFeature}
 */
var graphFeature = function (arg) {
  'use strict';

  if (!(this instanceof graphFeature)) {
    return new graphFeature(arg);
  }
  arg = arg || {};
  feature.call(this, arg);

  var $ = require('jquery');
  var util = require('./util');
  var registry = require('./registry');

  /**
   * @private
   */
  var m_this = this,
      s_draw = this.draw,
      s_style = this.style,
      m_nodes = null,
      m_points = null,
      m_children = function (d) { return d.children; },
      m_links = [],
      s_init = this._init,
      s_exit = this._exit;

  /**
   * Initialize
   */
  this._init = function (arg) {
    s_init.call(m_this, arg);

    var defaultStyle = $.extend(true, {},
      {
        nodes: {
          radius: 5.0,
          fill: true,
          fillColor: { r: 1.0, g: 0.0, b: 0.0 },
          strokeColor: { r: 0, g: 0, b: 0 }
        },
        links: {
          strokeColor: { r: 0.0, g: 0.0, b: 0.0 }
        },
        linkType: 'path' /* 'path' || 'line' */
      },
      arg.style === undefined ? {} : arg.style
    );

    m_this.style(defaultStyle);
    m_this.nodes(function (d) { return d; });
  };

  /**
   * Call child _build methods
   */
  this._build = function () {
    m_this.children().forEach(function (child) {
      child._build();
    });
  };

  /**
   * Call child _update methods
   */
  this._update = function () {
    m_this.children().forEach(function (child) {
      child._update();
    });
  };

  /**
   * Custom _exit method to remove all sub-features
   */
  this._exit = function () {
    m_this.data([]);
    m_links.forEach(function (link) {
      link._exit();
      m_this.removeChild(link);
    });
    m_links = [];
    m_points._exit();
    m_this.removeChild(m_points);
    s_exit();
    return m_this;
  };

  /**
   * Get/Set style
   */
  this.style = function (arg, arg2) {
    var out = s_style.call(m_this, arg, arg2);
    if (out !== m_this) {
      return out;
    }
    // set styles for sub-features
    m_points.style(arg.nodes);
    m_links.forEach(function (l) {
      l.style(arg.links);
    });
    return m_this;
  };

  /**
   * Get/Set links accessor.
   */
  this.links = function (arg) {
    if (arg === undefined) {
      return m_children;
    }

    m_children = util.ensureFunction(arg);
    return m_this;
  };

  /**
   * Get/Set nodes
   */
  this.nodes = function (val) {
    if (val === undefined) {
      return m_nodes;
    }
    m_nodes = val;
    m_this.modified();
    return m_this;
  };

  /**
   * Get internal node feature
   */
  this.nodeFeature = function () {
    return m_points;
  };

  /**
   * Get internal link features
   */
  this.linkFeatures = function () {
    return m_links;
  };

  /**
   * Build the feature for drawing
   */
  this.draw = function () {

    var layer = m_this.layer(),
        data = m_this.data(),
        nLinks = 0,
        style;

    // get the feature style object
    style = m_this.style();

    // Bind data to the point nodes
    m_points.data(data);
    m_points.style(style.nodes);

    // get links from node connections
    data.forEach(function (source) {
      (source.children || []).forEach(function (target) {
        var link;
        nLinks += 1;
        if (m_links.length < nLinks) {
          link = registry.createFeature(
            style.linkType, layer, layer.renderer()
          ).style(style.links);
          m_this.addChild(link);
          m_links.push(link);
        }
        m_links[nLinks - 1].data([source, target]);
      });
    });

    m_links.splice(nLinks, m_links.length - nLinks).forEach(function (l) {
      l._exit();
      m_this.removeChild(l);
    });

    s_draw();
    return m_this;
  };

  m_points = registry.createFeature(
    'point',
    this.layer(),
    this.layer().renderer()
  );
  m_this.addChild(m_points);

  if (arg.nodes) {
    this.nodes(arg.nodes);
  }

  this._init(arg);
  return this;
};

inherit(graphFeature, feature);
module.exports = graphFeature;
