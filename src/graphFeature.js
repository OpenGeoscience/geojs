var inherit = require('./inherit');
var feature = require('./feature');

/**
 * Object specification for a graph feature.
 *
 * @typedef {geo.feature.spec} geo.graphFeature.spec
 * @extends geo.feature.spec
 * @property {geo.graphFeature.styleSpec} [style] Style object with default
 *   style options.
 */

/**
 * Style specification for a graph feature.
 *
 * @typedef {geo.feature.styleSpec} geo.graphFeature.styleSpec
 * @extends geo.feature.styleSpec
 * @property {geo.pointFeature.styleSpec} [nodes] Point style for nodes.
 * @property {geo.lineFeature.styleSpec|geo.pathFeature.styleSpec} [links] Line
 *   or path style for links.
 * @property {string} [linkType='path'] Link type, either `'line'` or `'path'`.
 */

/**
 * Create a new instance of class graphFeature.
 *
 * @class
 * @alias geo.graphFeature
 * @extends geo.feature
 * @param {geo.graphFeature.spec} arg Feature options.
 * @returns {geo.graphFeature}
 */
var graphFeature = function (arg) {
  'use strict';

  if (!(this instanceof graphFeature)) {
    return new graphFeature(arg);
  }
  arg = arg || {};
  feature.call(this, arg);

  var util = require('./util');
  var registry = require('./registry');

  var m_this = this,
      s_draw = this.draw,
      s_style = this.style,
      m_nodes = null,
      m_points = null,
      m_children = function (d) { return d.children; },
      m_links = [],
      s_init = this._init,
      s_exit = this._exit;

  this.featureType = 'graph';

  /**
   * Initialize.
   *
   * @param {geo.graphFeature.spec} arg The feature specification.
   * @returns {this}
   */
  this._init = function (arg) {
    s_init.call(m_this, arg);

    var defaultStyle = util.deepMerge(
      {},
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
      arg.style === undefined ? {} : arg.style);

    m_this.style(defaultStyle);
    m_this.nodes(util.identityFunction);
    return m_this;
  };

  /**
   * Call child _build methods.
   */
  this._build = function () {
    m_this.children().forEach(function (child) {
      child._build();
    });
  };

  /**
   * Call child _update methods.
   */
  this._update = function () {
    m_this.children().forEach(function (child) {
      child._update();
    });
  };

  /**
   * Custom _exit method to remove all sub-features.
   *
   * @returns {this}
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
   * Get/Set style used by the feature.  Styles can be constant values or
   * functions.  If a function, the style is typically called with parameters
   * such as `(dataElement, dataIndex)` or, if the specific style of a feature
   * has a subfeature style, with `(subfeatureElement, subfeatureIndex,
   * dataElement, dataIndex)`.
   *
   * See the <a href="#.styleSpec">style specification
   * <code>styleSpec</code></a> for available styles.
   *
   * @param {string|object} [arg1] If `undefined`, return the current style
   *    object.  If a string and `arg2` is undefined, return the style
   *    associated with the specified key.  If a string and `arg2` is defined,
   *    set the named style to the specified value.  Otherwise, extend the
   *    current style with the values in the specified object.
   * @param {*} [arg2] If `arg1` is a string, the new value for that style.
   * @returns {object|this} Either the entire style object, the value of a
   *    specific style, or the current class instance.
   */
  this.style = function (arg1, arg2) {
    var out = s_style.call(m_this, arg1, arg2);
    if (out !== m_this) {
      return out;
    }
    // set styles for sub-features
    m_points.style(arg1.nodes);
    m_links.forEach(function (l) {
      l.style(arg1.links);
    });
    return m_this;
  };

  this.style.get = s_style.get;

  /**
   * Get/Set links accessor.
   *
   * @param {function|array} [arg] If specified, the list of links or a
   *    function that returns the list of links.  If unspecified, return the
   *    existing value.
   * @returns {function|this} Either a function that returns the list of links,
   *    or the feature.
   */
  this.links = function (arg) {
    if (arg === undefined) {
      return m_children;
    }

    m_children = util.ensureFunction(arg);
    return m_this;
  };

  /**
   * Get/Set nodes.
   *
   * @param {geo.geoPosition[]} [val] If specified, set the nodes to this list,
   *    otherwise return the current list of nodes.
   * @returns {geo.geoPostion[]|this} Either the current list of nodes or this
   *    feature.
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
   * Get internal node feature.
   *
   * @returns {geo.pointFeature} The point feature used for nodes.
   */
  this.nodeFeature = function () {
    return m_points;
  };

  /**
   * Get internal link features.
   *
   * @returns {geo.lineFeature[]|geo.pathFeature[]} An array or line or path
   *    features used for links.
   */
  this.linkFeatures = function () {
    return m_links;
  };

  /**
   * Draw the feature, building as necessary.
   *
   * @returns {this}
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
