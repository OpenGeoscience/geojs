var vgl = require('./vgl');
var inherit = require('../inherit');

/**
 * Create a new instance of class node.
 *
 * @class
 * @alias vgl.node
 * @returns {vgl.node}
 */
vgl.node = function () {
  'use strict';

  if (!(this instanceof vgl.node)) {
    return new vgl.node();
  }
  vgl.boundingObject.call(this);

  var m_parent = null,
      m_material = null,
      m_visible = true;

  /**
   * Return active material used by the node.
   *
   * @returns {vgl.material}
   */
  this.material = function () {
    return m_material;
  };

  /**
   * Set material to be used the node.
   *
   * @param {vgl.material} material
   * @returns {boolean}
   */
  this.setMaterial = function (material) {
    if (material !== m_material) {
      m_material = material;
      this.modified();
      return true;
    }

    return false;
  };

  /**
   * Check if the node is visible or node.
   *
   * @returns {boolean}
   */
  this.visible = function () {
    return m_visible;
  };

  /**
   * Turn ON/OFF visibility of the node.
   *
   * @param {boolean} flag
   * @returns {boolean}
   */
  this.setVisible = function (flag) {
    if (flag !== m_visible) {
      m_visible = flag;
      this.modified();
      return true;
    }

    return false;
  };

  /**
   * Return current parent of the node.
   *
   * @returns {vgl.node}
   */
  this.parent = function () {
    return m_parent;
  };

  /**
   * Set parent of the node.
   *
   * @param {vgl.node} parent
   * @returns {boolean}
   */
  this.setParent = function (parent) {
    if (parent !== m_parent) {
      if (m_parent !== null) {
        m_parent.removeChild(this);
      }
      m_parent = parent;
      this.modified();
      return true;
    }

    return false;
  };

  /**
   * Mark that the bounds are modified.
   */
  this.boundsModified = function () {
    this.boundsDirtyTimestamp().modified();

    if (m_parent !== null) {
      m_parent.boundsModified();
    }
  };

  return this;
};

inherit(vgl.node, vgl.boundingObject);
