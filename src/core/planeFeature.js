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
  geo.polygonFeature.call(this, arg);

  var m_origin = [arg.ul.x, arg.lr.y, arg.depth],
      m_upperLeft = [arg.ul.x, arg.ul.y, arg.depth],
      m_lowerRight = [arg.lr.x, arg.lr.y, arg.depth];

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
    } else {
      m_origin = val.slice(0);
      this.modified();
      return this;
    }
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
    } else {
      // Copy incoming array of positions
      m_upperLeft = val.slice(0);
      this.modified();
      return this;
    }
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
    } else {
      // Copy incoming array of positions
      m_lowerRight = val.slice(0);
      this.modified();
      return this;
    }
  };

  return this;
};

inherit(geo.planeFeature, geo.polygonFeature);
