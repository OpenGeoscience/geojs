/*========================================================================
  VGL --- VTK WebGL Rendering Toolkit

  Copyright 2013 Kitware, Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 ========================================================================*/

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

  /// Private member variables
  var m_parent = null;
  var m_material = null;
  var m_visible = true;
  var m_overlay = false;

  /// Public member methods

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
    if (material !== m_material)
    {
      m_material = material;
      this.modifiedOn();
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
    if (flag !== m_visible)   {
      m_visible = flag;
      this.modifiedOn();
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
      this.modifiedOn();
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
    if (m_overlay !== flag)   {
      m_overlay = flag;
      this.modifiedOn();
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
    if (this.boundsDirty())   {
      this.resetBounds();
    }
  };

  return this;
};

inherit(vglModule.node, vglModule.boundingObject);
