var vgl = require('./vgl');
var timestamp = require('../timestamp');

/**
 * Create a new instance of class object.
 *
 * @class
 * @alias vgl.object
 * @returns {vgl.object}
 */
vgl.object = function () {
  'use strict';

  if (!(this instanceof vgl.object)) {
    return new vgl.object();
  }

  /** @private */
  var m_modifiedTime = timestamp();
  m_modifiedTime.modified();

  /**
   * Mark the object modified.
   */
  this.modified = function () {
    m_modifiedTime.modified();
  };

  /**
   * Return modified time of the object.
   *
   * @returns {number}
   */
  this.getMTime = function () {
    return m_modifiedTime.getMTime();
  };

  return this;
};
