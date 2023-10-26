var vgl = require('./vgl');
var inherit = require('../inherit');

/**
 * Create a new instance of class graphicsObject.
 *
 * @class
 * @alias vgl.graphicsObject
 * @param {number} type A GL type.
 * @returns {vgl.graphicsObject}
 */
vgl.graphicsObject = function (type) {
  'use strict';

  if (!(this instanceof vgl.graphicsObject)) {
    return new vgl.graphicsObject();
  }
  vgl.object.call(this);

  var m_this = this;

  /**
   * Setup (initialize) the object.
   *
   * @param {vgl.renderState} renderState
   * @returns {boolean}
   */
  this._setup = function (renderState) {
    return false;
  };

  /**
   * Remove any resources acquired before deletion.
   *
   * @param {vgl.renderState} renderState
   * @returns {boolean}
   */
  this._cleanup = function (renderState) {
    return false;
  };

  return m_this;
};

inherit(vgl.graphicsObject, vgl.object);
