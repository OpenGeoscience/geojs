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
/// \class actor
/// \ingroup vgl
/// \brief Transform node that contains a drawable entity
///
/// actor is a placeholder transform node that contains a drawable entity.
/// One actor can contain only one drawable entity (mapper).
/// A mapper however can be set to multiple actors.
/// \see vglTransformNode mapper

//////////////////////////////////////////////////////////////////////////////
//
// actor class
//
//////////////////////////////////////////////////////////////////////////////

vglModule.actor = function() {
  vglModule.node.call(this);
  this.m_center = new Array(3);
  this.m_rotation = new Array(4);
  this.m_scale = new Array(3);
  this.m_translation = new Array(3);
  this.m_referenceFrame = 0;

  this.m_mapper = 0;
};

inherit(vglModule.actor, vglModule.node);

/// Get center of transformations
//----------------------------------------------------------------------------
vglModule.actor.prototype.center  = function() {
  return m_center;
};
/// Set center of transformations
//----------------------------------------------------------------------------
vglModule.actor.prototype.setCenter = function(x, y, z) {
  this.m_center[0] = x;
  this.m_center[1] = y;
  this.m_center[2] = z;
};

/// Get rotation as described by angle (in radians) and axis
/// ( axis(x, y, z), angle )
///---------------------------------------------------------------------------
vglModule.actor.prototype.rotation = function() {
};
/// Set rotation as described by angle (in radians) and axis
/// ( axis(x, y, z), angle )
//----------------------------------------------------------------------------
vglModule.actor.prototype.setRotation = function(angle, x, y, z) {
};

/// Get scale in x, y and z directions
//----------------------------------------------------------------------------
vglModule.actor.prototype.scale = function() {
};
/// Set scale in x, y and z directions
//----------------------------------------------------------------------------
vglModule.actor.prototype.setScale = function(x, y, z) {
};

/// Get translation in x, y and z directions
//----------------------------------------------------------------------------
vglModule.actor.prototype.translation = function() {
};
/// Set translation in x, y and z directions
//----------------------------------------------------------------------------
vglModule.actor.prototype.setTranslation = function(x, y, z) {
};

/// Get reference frame for the transformations. Possible values
/// are Absolute and Relative.
//----------------------------------------------------------------------------
vglModule.actor.prototype.referenceFrame = function() {
};
/// Set reference frame for the transformations. Possible values
/// are Absolute and Relative.
//----------------------------------------------------------------------------
vglModule.actor.prototype.setReferenceFrame = function(referenceFrame) {
};

/// Evaluate the transform associated with the vtkvglModule.actor.
/// Return affine transformation for the vglModule.actor.
//----------------------------------------------------------------------------
vglModule.actor.prototype.modelViewMatrix = function() {
  var mat = mat4.create();
  mat4.identity(mat);
  return mat;
};

/// \copydoc vesTransformInterace::matrix
//----------------------------------------------------------------------------
vglModule.actor.prototype.matrix = function() {
  return this.modelViewMatrix();
};

/// Get mapper of the actor
/// \sa mapper
//----------------------------------------------------------------------------
vglModule.actor.prototype.mapper = function() {
  return this.m_mapper;
};
/// Set mapper for the actor
/// \sa mapper
//----------------------------------------------------------------------------
vglModule.actor.prototype.setMapper = function(mapper) {
  this.m_mapper = mapper;
};

/// \copydoc node::accept()
//----------------------------------------------------------------------------
vglModule.actor.prototype.accept = function(visitor) {
  // TODO
};

/// \copydoc node::ascend()
//----------------------------------------------------------------------------
vglModule.actor.prototype.ascend = function(visitor) {
  // TODO
};

/// Compute object space to world space matrix
//----------------------------------------------------------------------------
vglModule.actor.prototype.computeLocalToWorldMatrix = function(matrix, visitor) {
};

/// Compute world space to object space matrix
//----------------------------------------------------------------------------
vglModule.actor.prototype.computeWorldToLocalMatrix = function(matrix, visitor) {
};

/// Compute actor bounds
//----------------------------------------------------------------------------
vglModule.actor.prototype.computeBounds = function() {
};
