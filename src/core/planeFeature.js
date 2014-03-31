//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, inherit, document$*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class planeFeature
 *
 * @class
 * @returns {geo.planeFeature}
 */
//////////////////////////////////////////////////////////////////////////////
geo.planeFeature = function(arg) {
  "use strict";
  if (!(this instanceof geo.planeFeature)) {
    return new geo.planeFeature(arg);
  }
  arg = arg || {};

  // Defaults
  arg.ul = arg.ul === undefined ? [0.0, 1.0, 0.0] : arg.ul;
  arg.lr = arg.lr === undefined ? [1.0, 0.0, 0.0] : arg.lr;
  arg.depth = arg.depth === undefined ? 0.0 : arg.depth;

  geo.polygonFeature.call(this, arg);

  var m_origin = [arg.ul.x, arg.lr.y, arg.depth],
      m_upperLeft = [arg.ul.x, arg.ul.y, arg.depth],
      m_lowerRight = [arg.lr.x, arg.lr.y, arg.depth],
      m_defaultDepth = arg.depth,
      s_init = this._init;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set origin
   *
   * @returns {geo.planeFeature}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.origin = function(val) {
    if (val === undefined ) {
      return m_origin;
    } else if (val instanceof Array) {
      if (val.length > 3 || val.length < 2) {
        throw "Upper left point requires point in 2 or 3 dimension";
      }
      m_origin = val.slice(0);
      if (m_origin.length === 2) {
        m_origin[2] = m_defaultDepth;
      }
    } else if (val instanceof geo.latlng) {
      m_origin = [val.x(), val.y(), m_defaultDepth];
    }
    this.dataTime().modified();
    this.modified();
    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set pt1
   *
   * @returns {geo.planeFeature}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.upperLeft = function(val) {
    if (val === undefined ) {
      return m_upperLeft;
    } else if (val instanceof Array) {
      if (val.length > 3 || val.length < 2) {
        throw "Upper left point requires point in 2 or 3 dimension";
      }
      m_upperLeft = val.slice(0);
      if (m_upperLeft.length === 2) {
        m_upperLeft[2] = m_defaultDepth;
      }
    } else if (val instanceof geo.latlng) {
      m_upperLeft = [val.x(), val.y(), m_defaultDepth];
    }
    this.dataTime().modified();
    this.modified();
    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set origin
   *
   * @returns {geo.planeFeature}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.lowerRight = function(val) {
    if (val === undefined ) {
      return m_lowerRight;
    } else if (val instanceof Array) {
      if (val.length > 3 || val.length < 2) {
        throw "Upper left point requires point in 2 or 3 dimension";
      }
      m_lowerRight = val.slice(0);
      if (m_lowerRight.length === 2) {
        m_lowerRight[2] = m_defaultDepth;
      }
      this.dataTime().modified();
    } else if (val instanceof geo.latlng) {
      m_lowerRight = [val.x(), val.y(), m_defaultDepth];
    }
    this.dataTime().modified();
    this.modified();
    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function(arg) {
    var style = null;
    s_init.call(this, arg);
    style = this.style();
    if (style.image === undefined) {
      style.image = null;
    }
    this.style(style);
  };

  this._init(arg);
  return this;
};

inherit(geo.planeFeature, geo.polygonFeature);
