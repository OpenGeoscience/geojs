//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class graphFeature
 *
 * @class
 * @returns {geo.graphFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.graphFeature = function(arg) {
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
      m_lines = [],
      s_init = this._init;


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(this, arg);

    var defaultStyle = $.extend(true, {}, {
                            nodes: {
                              size: 5.0,
                              color: [0.0, 0.0, 1.0],
                            },
                            lines: {
                              color: [1.0, 1.0, 1.0]
                            }
                          },
                          arg.style === undefined ? {} : arg.style);

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
  this.style = function(arg) {
    var out = s_style.call(this, arg);
    if (out !== this) {
      return out;
    }
    // set styles for sub-features
    m_points.style(arg.nodes);
    m_lines.forEach(function (l) {
      l.style(arg.lines);
    });
    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set nodes
   */
  ////////////////////////////////////////////////////////////////////////////
  this.nodes = function(val) {
    var layer = m_this.layer(),
        nLines = 0;

    if (val === undefined ) {
      return m_nodes;
    }
    // Copy incoming array of nodes
    m_nodes = val.slice(0);

    // create point features
    m_points.positions(m_nodes);

    // get lines from node connections
    m_nodes.forEach(function (source) {
      (source.children || []).forEach(function (target) {
        nLines++;
        if (m_lines.length < nLines) {
          m_lines.push(layer.create('lineFeature').style(m_this.style().lines));
        }
        m_lines[nLines - 1].positions([source, target]);
      });
    });

    m_lines.splice(nLines, m_lines.length - nLines).forEach(function (l) {
      layer._delete(l);
    });

    this.dataTime().modified();
    this.modified();
    return this;
  };

  m_points = this.layer().create('pointFeature');

  if (arg.nodes) {
    this.nodes(arg.nodes);
  }

  this._init(arg);
  return this;
};

inherit(geo.graphFeature, geo.feature);
