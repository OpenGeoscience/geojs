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
// camera class
//
//////////////////////////////////////////////////////////////////////////////

vglModule.camera = function() {

  if (!(this instanceof vglModule.camera)) {
    return new vglModule.camera();
  }
  vglModule.groupNode.call(this);

  /// Private member variables
  var m_viewAngle = 30;
  var m_position = vec3.create([0.0, 0.0, 5.0]);
  var m_focalPoint = vec3.create([0.0, 0.0, 0.0]);
  var m_viewUp = vec3.create([0.0, 1.0, 0.0]);
  var m_right = vec3.create([1.0, 0.0, 0.0]);
  var m_pitchMatrix = mat4.create();
  var m_directionOfProjection = vec3.createFrom(0.0, 0.0, -1.0);
  var m_cache = vec3.create([1.0, 0.0, 0.0]);

  var m_viewMatrix = mat4.create();
  var m_projectionMatrix = mat4.create();

  mat4.identity(m_pitchMatrix);

  /**
   * Set position of the camera
   *
   */
  this.setPosition = function(x, y, z) {
    m_position = vec3.create([x, y, z]);
  };

  /**
   * Get position of the camera
   *
   */
  this.position = function() {
    return m_position;
  };

  /**
   * Set focal point of the camera
   *
   */
  this.setFocalPoint = function(x, y, z) {
    m_focalPoint = vec3.create([x, y, z]);
  };

  /**
   * Get focal point of the camera
   *
   */
  this.focalPoint = function() {
    return m_focalPoint;
  };

  /**
   * Set view-up direction of the camera
   *
   */
  this.setViewUpDirection = function(x, y, z) {
    m_viewUp = vec3.create([x, y, z]);
  };


  /**
   * Move camera closer or further away from the scene
   *
   */
  this.zoom  = function(dz) {
    // Since our direction vector is changed, we need to first
    // calculate this new direction
    var lastPosition = vec3.createFrom(m_position[0], m_position[1],
                                       m_position[2]);

    var deltaX =  m_directionOfProjection[0] * dz;
    var deltaY =  m_directionOfProjection[1] * dz;
    var deltaZ =  m_directionOfProjection[2] * dz;

    m_position[0] += deltaX;
    m_position[1] += deltaY;
    m_position[2] += deltaZ;

    var distance = vec3.create();
    var directionOfProjection = vec3.create();
    vec3.subtract(m_focalPoint, m_position, distance);
    vec3.normalize(distance, directionOfProjection);

    if (vec3.dot(directionOfProjection, m_directionOfProjection) <= 0) {
      // We are on the other side of the focal point
      m_position[0] = lastPosition[0];
      m_position[1] = lastPosition[1];
      m_position[2] = lastPosition[2];
    }

//      m_focalPoint[0] += dir[0] * dz;
//      m_focalPoint[1] += dir[1] * dz;
//      m_focalPoint[2] += dir[2] * dz;

    // TODO: If the distance between focal point and the camera position
    // goes really low then we run into issues
  };

  /**
   * Move camera sideways
   *
   */
  this.pan = function(dx, dy) {
    m_position[0] += dx;
    m_position[1] += dy;
    m_focalPoint[0] += dx;
    m_focalPoint[1] += dy;
  };

  /**
   * Compute camera coordinate axes
   *
   */
  this.computeOrthogonalAxes = function() {
    dir = new vec3.create();
    vec3.direction(m_focalPoint, m_position, dir);
    vec3.normalize(dir);
    vec3.cross(dir, m_viewUp, m_right);
    vec3.normalize(m_right);
  };


  /**
   * Perform yaw on the camera give a rotation angle (in degrees)
   *
   */
  this.yaw = function(degrees) {
    radians = degrees * (3.14 / 180.0);

    mat = mat4.create();
    mat4.identity(mat);

    // We would like to rotate about focal point and to do so
    // and since our rotation is calculated assuming that rotation point or
    // axis is at origin, we need to inverse transte, rotate and again translate
    // to calculate the complete transformation matrix.
    invDir = new vec3.create();
    invDir[0] = -m_focalPoint[0];
    invDir[1] = -m_focalPoint[1];
    invDir[2] = -m_focalPoint[2];

    mat4.translate(mat, m_focalPoint, mat);
    mat4.rotate(mat, radians, m_viewUp, mat);
    mat4.translate(mat, invDir, mat);

//      console.log(m_viewUp);
    mat4.multiplyVec3(mat, m_position, m_position);

    this.computeOrthogonalAxes();
  };

  /**
   * Perform pitch on the camera give a rotation (in degrees)
   *
   */
  this.pitch = function(degrees) {
    radians = degrees * (3.14 / 180.0);

    mat = mat4.create();
    mat4.identity(mat);

    // We would like to rotate about focal point and to do so
    // and since our rotation is calculated assuming that rotation point or
    // axis is at origin, we need to inverse transte, rotate and again translate
    // to calculate the complete transformation matrix.
    invDir = new vec3.create();
    invDir[0] = -m_focalPoint[0];
    invDir[1] = -m_focalPoint[1];
    invDir[2] = -m_focalPoint[2];

    mat4.translate(mat, m_focalPoint, mat);
    mat4.rotate(mat, radians, m_right, mat);
    mat4.translate(mat, invDir, mat);

    dir = vec3.create();
    vec3.direction(m_position, m_focalPoint, dir);

    // Now update the position
    mat4.multiplyVec3(mat, m_position, m_position);
  };


  /**
   * Compute camera view matrix
   *
   */
  this.computeViewMatrix = function() {

    this.computeOrthogonalAxes();

    mat4.lookAt(m_position, m_focalPoint, m_viewUp, m_viewMatrix);

    temp = vec3.create([m_viewMatrix[0], m_viewMatrix[1], m_viewMatrix[2]]);

    // If we realize a flip in x axis, then we need to flip our vertical axis since
    // we don't want to look upside down.
    if(vec3.dot(temp, m_cache) < 0.0)
    {
      m_viewUp[0] = -m_viewUp[0];
      m_viewUp[1] = -m_viewUp[1];s
      m_viewUp[2] = -m_viewUp[2];
      mat4.lookAt(m_position, m_focalPoint, m_viewUp, m_viewMatrix);
    }

    temp = vec3.create([m_viewMatrix[0], m_viewMatrix[1], m_viewMatrix[2]]);
    vec3.set(temp, m_cache);

    vec3.subtract(m_focalPoint, m_position, m_directionOfProjection);
    vec3.normalize(m_directionOfProjection, m_directionOfProjection);

    return m_viewMatrix;
  };

  /**
   * Return view-matrix for the camera
   *
   * This method does not compute the view-matrix for the camera. It is
   * assumed that a call to computeViewMatrix has been made earlier.
   *
   * @returns mat4
   *
   */
  this.viewMatrix = function() {
    return m_viewMatrix;
  };

  /**
   * Compute camera projection matrix
   *
   *
   */
  this.computeProjectionMatrix = function(aspect, near, far) {

    mat4.identity(m_projectionMatrix);
    mat4.perspective(m_viewAngle, aspect, near, far,
                     m_projectionMatrix);

    return m_projectionMatrix;
  };


  /**
   * Return camera projection matrix
   *
   * This method does not compute the projection-matrix for the camera. It is
   * assumed that a call to computeProjectionMatrix has been made earlier.
   */
  this.projectionMatrix = function() {
    return m_projectionMatrix;
  };

  return this;
};

inherit(vglModule.camera, vglModule.groupNode);
