///////////////////////////////////////////////////////////////////////////////
//
// groupNode class
//
///////////////////////////////////////////////////////////////////////////////

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
        this.setBoundsDirty(true);

        return true;
      }
      return false;
    }

    return false;
  };

  this.removeChild = function(childNode) {
    if (childNode.parent() === this) {
      var index = m_children.indexof(childNode);
      m_children.splice(index, 1);
      this.setBoundsDirty(true);
      return true;
    }
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
    this.computeBounds();

    if (visitor.mode() === visitor.TraverseAllChildren) {
      for ( var i = 0; i < m_children.length(); ++i) {
        m_children[i].accept(visitor);
        this.updateBounds(m_children[i]);
      }
    }

    if (this.m_parent && this.boundsDirty()) {
      // Flag parents bounds dirty.
      this.m_parent.setBoundsDirty(true);
    }

    // Since by now, we have updated the node bounds it is
    // safe to mark that bounds are no longer dirty anymore
    this.setBoundsDirty(false);
  };

  this.traverseChildren = function(visitor) {
    if (visitor.mode() == vesVisitor.TraverseAllChildren) {
      for ( var i = 0; i < m_children.length(); ++i) {
        m_children[i].accept(visitor);
      }
    }
  };

  this.updateBounds = function(childNode) {
    // TODO: Compute bounds here
  };

  return this;
};

inherit(vglModule.groupNode, vglModule.node);
