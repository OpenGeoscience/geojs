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
      s_init = this._init;


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(this, arg);

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

    this.style(defaultStyle);
    if (m_nodes) {
      this.dataTime().modified();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set style
   */
  ////////////////////////////////////////////////////////////////////////////
  this.style = function (arg) {
    var out = s_style.call(this, arg);
    if (out !== this) {
      return out;
    }
    // set styles for sub-features
    m_points.style(arg.nodes);
    m_links.forEach(function (l) {
      l.style(arg.links);
    });
    return this;
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
        nLinks += 1;
        if (m_links.length < nLinks) {
          m_links.push(
            layer.createFeature(style.linkType).style(style.links)
          );
        }
        m_links[nLinks - 1].positions([source, target]);
      });
    });

    m_links.splice(nLinks, m_links.length - nLinks).forEach(function (l) {
      layer._delete(l);
    });

    this.dataTime().modified();
    this.modified();
    return this;
  };

  m_points = this.layer().createFeature("point");

  if (arg.nodes) {
    this.nodes(arg.nodes);
  }

  this._init(arg);
  return this;
};

inherit(geo.graphFeature, geo.feature);
