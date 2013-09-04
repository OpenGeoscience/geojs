//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class groupNode
 *
 * @class
 * @returns {vglModule.groupNode}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.groupNode = function() {
  'use strict';

  if (!(this instanceof vglModule.groupNode)) {
    return new vglModule.groupNode();
  }
  vglModule.node.call(this);

  var m_children = [];

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Turn on / off visibility
   *
   * @param flag
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.setVisible = function(flag) {
    var i;

    if (node.prototype.setVisible.call(this, flag) !== true) {
      return false;
    }

    for (i = 0; i < m_children.length; ++i) {
      m_children[i].setVisible(flag);
    }

    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Make the incoming node as child of the group node
   *
   * @param childNode
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addChild = function(childNode) {
    if (childNode instanceof vglModule.node) {
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove parent-child relationship between the group and incoming node
   *
   * @param childNode
   * @returns {boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.removeChild = function(childNode) {
    if (childNode.parent() === this) {
      var index = m_children.indexOf(childNode);
      m_children.splice(index, 1);
      this.boundsDirtyTimestamp().modified();
      return true;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove parent-child relationship between child nodes and the group node
   */
  ////////////////////////////////////////////////////////////////////////////
  this.removeChildren = function() {
    var i;
    for (i = 0; i < m_children.length; ++i) {
      this.removeChild(m_children[i]);
    }

    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return children of this group node
   *
   * @returns {Array}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.children = function() {
    return m_children;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Accept a visitor and traverse the scene tree
   *
   * @param visitor
   */
  ////////////////////////////////////////////////////////////////////////////
  this.accept = function(visitor) {
    visitor.visit(this);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Traverse the scene
   *
   * @param visitor
   */
  ////////////////////////////////////////////////////////////////////////////
  this.traverse = function(visitor) {
    switch (visitor.type()) {
      case visitor.UpdateVisitor:
        this.traverseChildrenAndUpdateBounds(visitor);
        break;
      case visitor.CullVisitor:
        this.traverseChildren(visitor);
        break;
      default:
        break;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Traverse all of the children and update the bounds for each
   *
   * @param visitor
   */
  ////////////////////////////////////////////////////////////////////////////
  this.traverseChildrenAndUpdateBounds = function(visitor) {
    var i;

    if (this.m_parent && this.boundsDirtyTimestamp().getMTime() >
      this.computeBoundsTimestamp().getMTime()) {
      // Flag parents bounds dirty.
      this.m_parent.boundsDirtyTimestamp.modified();
    }

    this.computeBounds();

    if (visitor.mode() === visitor.TraverseAllChildren) {
      for (i = 0; i < m_children.length(); ++i) {
        m_children[i].accept(visitor);
        this.updateBounds(m_children[i]);
      }
    }

    this.computeBoundsTimestamp().modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Traverse children of the group node
   *
   * @param visitor
   */
  ////////////////////////////////////////////////////////////////////////////
  this.traverseChildren = function(visitor) {
    var i;

    if (visitor.mode() === vglModule.vesVisitor.TraverseAllChildren) {
      for (i = 0; i < m_children.length(); ++i) {
        m_children[i].accept(visitor);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Compute bounds for the group node
   */
  ////////////////////////////////////////////////////////////////////////////
  this.computeBounds = function() {
    var i = 0;

    if (this.computeBoundsTimestamp().getMTime() >
        this.boundsDirtyTimestamp().getMTime()) {
      return;
    }

    for (i = 0; i < m_children.length; ++i) {
      this.updateBounds(m_children[i]);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update bounds for the group node
   *
   * This method is used internally to update bounds of the group node by
   * traversing each of its child.
   *
   * @param child
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateBounds = function(child) {
    // FIXME: This check should not be required and possibly is incorrect
    if (child.overlay()) {
      return;
    }

    // Make sure that child bounds are upto date
    child.computeBounds();

    var bounds = this.bounds(),
        childBounds = child.bounds(),
        istep = 0,
        jstep = 0,
        i;

    for (i = 0; i < 3; ++i) {
      istep = i * 2;
      jstep = i * 2 + 1;
      if (childBounds[istep] < bounds[istep]) {
        bounds[istep] = childBounds[istep];
      }
      if (childBounds[jstep] > bounds[jstep]) {
        bounds[jstep] = childBounds[jstep];
      }
    }

    this.setBounds(bounds[0], bounds[1], bounds[2], bounds[3],
                   bounds[4], bounds[5]);
  };

  return this;
};

inherit(vglModule.groupNode, vglModule.node);
