//////////////////////////////////////////////////////////////////////////////
//
// node class
//
//////////////////////////////////////////////////////////////////////////////
vglModule.node = function() {

  if (!(this instanceof vglModule.node)) {
    return new vglModule.node();
  }
  vglModule.boundingObject.call(this);

  // Private member variables
  var m_parent = null;
  var m_material = null;
  var m_visible = true;
  var m_overlay = false;

  // Public member methods

  /**
   * Accept visitor for scene traversal
   *
   */
  this.accept = function(visitor) {
    visitor.visit(this);
  };

  /**
   * Return active material
   *
   */
  this.material = function() {
    return m_material;
  };

  /**
   * Set current material
   *
   */
  this.setMaterial = function(material) {
    if (material !== m_material) {
      m_material = material;
      this.modified();
      return true;
    }

    return false;
  };

  /**
   * Return node's visibility
   *
   */
  this.visible = function() {
    return m_visible;
  };

  /**
   * Set visibility of the node
   *
   */
  this.setVisible = function(flag) {
    if (flag !== m_visible) {
      m_visible = flag;
      this.modified();
      return true;
    }

    return false;
  };

  /**
   * Return parent of the node
   *
   */
  this.parent = function() {
    return m_parent;
  };

  /**
   * Set parent of the node
   *
   */
  this.setParent = function(parent) {
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
   * Return if node is an overlay or not
   *
   */
  this.overlay = function() {
    return m_overlay;
  };

  /**
   * Set node overlay state
   *
   */
  this.setOverlay = function(flag) {
    if (m_overlay !== flag) {
      m_overlay = flag;
      this.modified();
      return true;
    }

    return false;
  };

  /*
   * Traverse parent and their parent and so on
   *
   */
  this.ascend = function(visitor) {
  };

  /**
   * Traverse children
   *
   */
  this.traverse = function(visitor) {
  };

  /**
   * Virtual function to compute bounds of the node
   *
   */
  this.computeBounds = function() {
    if (this.boundsDirty()) {
      this.resetBounds();
    }
  };

  return this;
};

inherit(vglModule.node, vglModule.boundingObject);
