//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global geo*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class object
 *
 * @class
 * @returns {geo.object}
 */
//////////////////////////////////////////////////////////////////////////////
geo.object = function() {
  'use strict';

  if (!(this instanceof geo.object)) {
    return new geo.object();
  }

  /** @private */
  var m_modifiedTime = geo.timestamp();
  m_modifiedTime.modified();

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Mark the object modified
   */
  ////////////////////////////////////////////////////////////////////////////
  this.modified = function() {
    m_modifiedTime.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return modified time of the object
   *
   * @returns {*}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getMTime = function() {
    return m_modifiedTime.getMTime();
  };

  return this;
};
