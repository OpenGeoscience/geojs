//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

/**
 * Create a new instance of class node
 *
 * @class
 * @returns {vglModule.node}
 */
vglModule.node = function() {

  if (!(this instanceof vglModule.node)) {
    return new vglModule.node();
  }
  vglModule.boundingObject.call(this);

  /** @private */
  var m_parent = null;

  /** @private */
  var m_material = null;

  /** @private */
  var m_visible = true;

  /** @private */
  var m_overlay = false;

  /**
   * Accept visitor for scene traversal
   */
  this.accept = function(visitor) {
    visitor.visit(this);
  };

  /**
   * Return active material
   */
  this.material = function() {
    return m_material;
  };

  /**
   * Set current material
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
   */
  this.visible = function() {
    return m_visible;
  };

  /**
   * Set visibility of the node
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
   */
  this.parent = function() {
    return m_parent;
  };

  /**
   * Set parent of the node
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
   */
  this.overlay = function() {
    return m_overlay;
  };

  /**
   * Set node overlay state
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
   */
  this.ascend = function(visitor) {
  };

  /**
   * Traverse children
   */
  this.traverse = function(visitor) {
  };

  /**
   *
   */
  this.boundsModified = function() {
    // @todo Implement this
    this.boundsDirtyTimestamp().modified();

    if (m_parent != null) {
      m_parent.boundsModified();
    }
  }

  return this;
};

inherit(vglModule.node, vglModule.boundingObject);
