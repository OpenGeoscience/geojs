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
// actor class
//
//////////////////////////////////////////////////////////////////////////////

vglModule.actor = function() {

  if (!(this instanceof vglModule.actor)) {
    return new vglModule.actor();
  }

  vglModule.node.call(this);

  /// Initialize member variables
  this.m_center = new Array(3);
  this.m_rotation = new Array(4);
  this.m_scale = new Array(3);
  this.m_translation = new Array(3);
  this.m_referenceFrame = 0;
  this.m_mapper = 0;

  /**
   * Get center of transformations
   *
   */
  this.center  = function() {
    return m_center;
  };

  /**
   * Set center of transformations
   *
   */
  this.setCenter = function(x, y, z) {
    this.m_center[0] = x;
    this.m_center[1] = y;
    this.m_center[2] = z;
  };

  /**
   * Get rotation defined by angle (radians) and axis (axis(x, y, z), angle)
   *
   */

  this.rotation = function() {
  };

  /**
   * Set rotation defined by angle (radians) and axis (axis(x, y, z), angle)
   *
   */
  this.setRotation = function(angle, x, y, z) {
  };

  /**
   * Get scale in x, y and z directions
   *
   */
  this.scale = function() {
  };

  /**
   * Set scale in x, y and z directions
   *
   */
  this.setScale = function(x, y, z) {
  };

  /**
   * Get translation in x, y and z directions
   *
   */
  this.translation = function() {
  };

  /**
   * Set translation in x, y and z directions
   *
   */
  this.setTranslation = function(x, y, z) {
  };

  /**
   * Get reference frame for the transformations. Possible values
   * are Absolute and Relative.
   *
   */
  this.referenceFrame = function() {
  };

  /**
   * Set reference frame for the transformations. Possible values
   * are Absolute and Relative.
   *
   */
  this.setReferenceFrame = function(referenceFrame) {
  };

  /**
   * Evaluate the transform associated with the vtkvglModule.actor.
   *
   * @returns Affine transformation for the vglModule.actor.
   */
  this.modelViewMatrix = function() {
    var mat = mat4.create();
    mat4.identity(mat);
    return mat;
  };

  /**
   *
   *
   */
  this.matrix = function() {
    return this.modelViewMatrix();
  };

  /**
   * Get mapper of the actor
   *
   */
  this.mapper = function() {
    return this.m_mapper;
  };

  /**
   * Set mapper on the actor
   *
   */
  this.setMapper = function(mapper) {
    this.m_mapper = mapper;
  };

  /**
   * TODO Implement this
   *
   */
  this.accept = function(visitor) {
  };

  /**
   * TODO Implement this
   *
   */
  this.ascend = function(visitor) {
  };

  /**
   * Compute object space to world space matrix
   *
   */
  this.computeLocalToWorldMatrix = function(matrix, visitor) {
  };

  /**
   * Compute world space to object space matrix
   *
   */
  this.computeWorldToLocalMatrix = function(matrix, visitor) {
  };

  /**
   * Compute actor bounds
   *
   */
  this.computeBounds = function() {
  };
};

inherit(vglModule.actor, vglModule.node);
