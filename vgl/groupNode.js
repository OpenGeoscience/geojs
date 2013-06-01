/**
 * @module ogs.vgl
 */

/**
 * Create a new instance of class groupNode
 *
 * @class
 * @returns {vglModule.groupNode}
 */
vglModule.groupNode = function() {

  if (!(this instanceof vglModule.groupNode)) {
    return new vglModule.groupNode();
  }
  vglModule.node.call(this);

  var m_children = [];

  this.setVisible = function(flag) {
    if (node.prototype.setVisible.call(this, flag) !== true) {
      return false;
    }

    for ( var i = 0; i < m_children.length; ++i) {
      m_children[i].setVisible(flag);
    }

    return true;
  };

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

  this.removeChild = function(childNode) {
    if (childNode.parent() === this) {
      var index = m_children.indexOf(childNode);
      m_children.splice(index, 1);
      this.boundsDirtyTimestamp().modified();
      return true;
    }
  };

  this.removeChildren = function() {
    var i = 0;
    for (i = 0; i < m_children.length; ++i) {
      this.removeChild(m_children[i]);
    }

    this.modified();
  };

  this.children = function() {
    return m_children;
  };

  this.accept = function(visitor) {
    visitor.visit(this);
  };

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

  this.traverseChildrenAndUpdateBounds = function(visitor) {

    if (this.m_parent && this.boundsDirtyTimestamp().getMTime() >
      this.computeBoundsTimestamp().getMTime()) {
      // Flag parents bounds dirty.
      this.m_parent.boundsDirtyTimestamp.modified();
    }

    this.computeBounds();

    if (visitor.mode() === visitor.TraverseAllChildren) {
      for ( var i = 0; i < m_children.length(); ++i) {
        m_children[i].accept(visitor);
        this.updateBounds(m_children[i]);
      }
    }

    this.computeBoundsTimestamp().modified();
  };

  this.traverseChildren = function(visitor) {
    if (visitor.mode() == vesVisitor.TraverseAllChildren) {
      for ( var i = 0; i < m_children.length(); ++i) {
        m_children[i].accept(visitor);
      }
    }
  };

  this.computeBounds = function() {
    if (this.computeBoundsTimestamp().getMTime() >
        this.boundsDirtyTimestamp().getMTime()) {
      return;
    }

    for ( var i = 0; i < m_children.length; ++i) {
      this.updateBounds(m_children[i]);
    }
  };

  this.updateBounds = function(child) {
    // FIXME: This check should not be required and possibly is incorrect
    if (child.overlay()) {
      return;
    }

    // Make sure that child bounds are upto date
    child.computeBounds();

    var bounds = this.bounds();
    var childBounds = child.bounds();

    // console.log('bounds ' + bounds);
    // console.log('child bounds ' + child + ' ', childBounds);

    var istep = 0;
    var jstep = 0;

    for (var i = 0; i < 3; ++i) {
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
