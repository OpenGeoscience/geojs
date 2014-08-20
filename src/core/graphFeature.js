//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class graphFeature
 *
 * @class
 * @returns {geo.graphFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.graphFeature = function (arg) {
  "use strict";

  if (!(this instanceof geo.graphFeature)) {
    return new geo.graphFeature(arg);
  }
  arg = arg || {};
  geo.feature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      s_style = this.style,
      m_nodes = null,
      m_points = null,
      m_links = [],
      s_init = this._init,
      s_exit = this._exit;


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);

    var defaultStyle = $.extend(true, {},
      {
        nodes: {
          size: 5.0,
          color: [0.0, 0.0, 1.0]
        },
        links: {
          color: [1.0, 1.0, 1.0]
        },
        linkType: "path" /* 'pathFeature' || 'lineFeature' */
      },
      arg.style === undefined ? {} : arg.style
    );

    m_this.style(defaultStyle);
    if (m_nodes) {
      m_this.dataTime().modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Call child _build methods
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function () {
    m_this.children().forEach(function (child) {
      child._build();
    });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Call child _update methods
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function () {
    m_this.children().forEach(function (child) {
      child._update();
    });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Custom _exit method to remove all sub-features
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    m_this.nodes([]);
    m_this.layer().deleteFeature(m_points, true);
    m_this.removeChild(m_points);
    s_exit();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set style
   */
  ////////////////////////////////////////////////////////////////////////////
  this.style = function (arg) {
    var out = s_style.call(m_this, arg);
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set nodes
   */
  ////////////////////////////////////////////////////////////////////////////
  this.nodes = function (val) {
    var layer = m_this.layer(),
        nLinks = 0,
        style;

    if (val === undefined) {
      return m_nodes;
    }

    // get the feature style object
    style = m_this.style();

    // Copy incoming array of nodes
    m_nodes = val.slice(0);

    // create point features
    m_points.positions(m_nodes);

    // get links from node connections
    m_nodes.forEach(function (source) {
      (source.children || []).forEach(function (target) {
        var link;
        nLinks += 1;
        if (m_links.length < nLinks) {
          link = layer.createFeature(
              style.linkType,
              {detached: true}
          ).style(style.links);
          m_this.addChild(link);
          m_links.push(link);
        }
        m_links[nLinks - 1].positions([source, target]);
      });
    });

    m_links.splice(nLinks, m_links.length - nLinks).forEach(function (l) {
      layer.deleteFeature(l, true);
      m_this.removeChild(l);
    });

    m_this.dataTime().modified();
    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get internal node feature
   */
  ////////////////////////////////////////////////////////////////////////////
  this.nodeFeature = function () {
    return m_points;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get internal link features
   */
  ////////////////////////////////////////////////////////////////////////////
  this.linkFeatures = function () {
    return m_links;
  };

  m_points = this.layer().createFeature("point", {detached: true});
  m_this.addChild(m_points);

  if (arg.nodes) {
    this.nodes(arg.nodes);
  }

  this._init(arg);
  return this;
};

inherit(geo.graphFeature, geo.feature);
