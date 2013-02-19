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
  vglModule.boundingObject.call(this);

  this.m_parent = null;
  this.m_material = null;
  this.m_visible = true;
  this.m_overlay = false;
};

inherit(vglModule.node, vglModule.boundingObject);

/// Accept visitor for scene traversal
//----------------------------------------------------------------------------
vglModule.node.prototype.accept = function(visitor) {
  visitor.visit(this);
};

/// Return active material
//----------------------------------------------------------------------------
vglModule.node.prototype.material = function() {
  return this.m_material;
};
/// Set current material
//----------------------------------------------------------------------------
vglModule.node.prototype.setMaterial = function(material) {
  if (material !== this.m_material)
  {
    this.m_material = material;
    this.setModified();
    return true;
  }

  return false;
};

/// Return node's visibility
//----------------------------------------------------------------------------
vglModule.node.prototype.visible = function() {
  return this.m_visible;
};
/// Set visibility of the node
//----------------------------------------------------------------------------
vglModule.node.prototype.setVisible = function(flag) {
  if (flag !== this.m_visible)   {
    this.m_visible = flag;
    this.setModified();
    return true;
  }

  return false;
};

/// Return parent of the node
//----------------------------------------------------------------------------
vglModule.node.prototype.parent = function() {
  return this.m_parent;
};
/// Set parent of the node
//----------------------------------------------------------------------------
vglModule.node.prototype.setParent = function(parent) {
  if (parent !== this.m_parent) {
    if (this.m_parent !== null) {
      this.m_parent.removeChild(this);
    }
    this.m_parent = parent;
    this.setModified();
    return true;
  }

  return false;
};

/// Return if node is an overlay or not
//----------------------------------------------------------------------------
vglModule.node.prototype.overlay = function() {
  return this.m_overlay;
};
/// Set node overlay state
//----------------------------------------------------------------------------
vglModule.node.prototype.setOverlay = function(flag) {
  if (this.m_overlay !== flag)   {
    this.m_overlay = flag;
    this.setModified();
    return true;
  }

  return false;
};

///  Traverse parent and their parent and so on
//----------------------------------------------------------------------------
vglModule.node.prototype.ascend = function(visitor) {
};

/// Traverse children
//----------------------------------------------------------------------------
vglModule.node.prototype.traverse = function(visitor) {
};

/// Reset bounds of the vglModule.node. Actual bound calculation
/// should be done in the concrete class.
//----------------------------------------------------------------------------
vglModule.node.prototype.computeBounds = function() {
  if (this.boundsDirty())   {
    this.resetBounds();
  }
};