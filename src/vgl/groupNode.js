var vgl = require('./vgl');
var inherit = require('../inherit');

/**
 * Create a new instance of class groupNode.
 *
 * @class
 * @alias vgl.groupNode
 * @returns {vgl.groupNode}
 */
vgl.groupNode = function () {
  'use strict';

  if (!(this instanceof vgl.groupNode)) {
    return new vgl.groupNode();
  }
  vgl.node.call(this);

  var m_children = [];

  /**
   * Make the incoming node a child of the group node.
   *
   * @param {vgl.node} childNode
   * @returns {boolean}
   */
  this.addChild = function (childNode) {
    if (childNode instanceof vgl.node) {
      if (m_children.indexOf(childNode) === -1) {
        childNode.setParent(this);
        m_children.push(childNode);
        this.boundsDirtyTimestamp().modified();
        return true;
      }
      return false;
    }

    return false;
  };

  /**
   * Remove parent-child relationship between the group and incoming node.
   *
   * @param {vgl.node} childNode
   * @returns {boolean}
   */
  this.removeChild = function (childNode) {
    if (childNode.parent() === this) {
      var index = m_children.indexOf(childNode);
      if (index >= 0) {
        m_children.splice(index, 1);
        childNode.setParent(null);
        this.boundsDirtyTimestamp().modified();
        return true;
      }
    }
    return false;
  };

  /**
   * Remove parent-child relationship between child nodes and the group node.
   */
  this.removeChildren = function () {
    while (m_children.length) {
      this.removeChild(m_children[0]);
    }

    this.modified();
  };

  /**
   * Return children of this group node.
   *
   * @returns {vgl.node[]}
   */
  this.children = function () {
    return m_children;
  };

  /**
   * Return true if this group node has node as a child, false otherwise.
   *
   * @param {vgl.node} node
   * @returns {boolean}
   */
  this.hasChild = function (node) {
    var i = 0, child = false;

    for (i = 0; i < m_children.length; i += 1) {
      if (m_children[i] === node) {
        child = true;
        break;
      }
    }

    return child;
  };

  return this;
};

inherit(vgl.groupNode, vgl.node);
