/**
 * @module ogs.vgl
 */

/**
 * Create a new instance of class camera
 *
 * @class
 * @returns {vglModule.camera}
 */
vglModule.camera = function() {

  if (!(this instanceof vglModule.camera)) {
    return new vglModule.camera();
  }
  vglModule.groupNode.call(this);

  /** @private */
  var m_viewAngle = (Math.PI * 30) / 180.0;

  /** @private */
  var m_position = vec3.fromValues(0.0, 0.0, 0.0);

  /** @private */
  var m_focalPoint = vec3.fromValues(0.0, 0.0, -5.0);

  /** @private */
  var m_centerOrRotation = vec3.fromValues(0.0, 0.0, 0.0);

  /** @private */
  var m_viewUp = vec3.fromValues(0.0, 1.0, 0.0);

  /** @private */
  var m_right = vec3.fromValues(1.0, 0.0, 0.0);

  /** @private */
  var m_near = 0.1;

  /** @private */
  var m_far = 10000.0;

  /** @private */
  var m_viewAspect = 1.0;

  /** @private */
  var m_directionOfProjection = vec3.fromValues(0.0, 0.0, -1.0);

  /** @private */
  var m_viewMatrix = mat4.create();

  /** @private */
  var m_projectionMatrix = mat4.create();

  /** @private */
  var m_computeModelViewMatrixTime = ogs.vgl.timestamp();

  /** @private */
  var m_computeProjectMatrixTime = ogs.vgl.timestamp();

  /**
   * Get position of the camera
   */
  this.position = function() {
    return m_position;
  };

 /**
  * Set position of the camera
  */
 this.setPosition = function(x, y, z) {
   m_position = vec3.fromValues(x, y, z);
   this.modified();
 };

 /**
  * Get focal point of the camera
  */
 this.focalPoint = function() {
   return m_focalPoint;
 };

  /**
   * Set focal point of the camera
   */
  this.setFocalPoint = function(x, y, z) {
    m_focalPoint = vec3.fromValues(x, y, z);
    this.modified();
  };

  /**
   * Get view-up direction of camera
   */
  this.viewUpDirection = function() {
    return m_viewUp;
  }

  /**
   * Set view-up direction of the camera
   */
  this.setViewUpDirection = function(x, y, z) {
    m_viewUp = vec3.fromValues(x, y, z);
    this.modified();
  };

  /**
   * Get center of rotation for camera
   */
  this.centerOfRotation = function() {
    return m_centerOrRotation;
  }

  /**
   * Set center of rotation for camera
   */
  this.setCenterOfRotation = function(centerOfRotation) {
    m_centerOrRotation = centerOfRotation;
    this.modified();
  }

  /**
   * Get clipping range of the camera
   */
  this.getClippingRange = function() {
    return [m_near, m_far];
  }

  /**
   * Set clipping range of the camera
   */
  this.setClippingRange = function(near, far) {
    m_near = near;
    m_far = far;
    this.modified();
  }

  /**
   * Get view aspect
   */
  this.viewAspect = function() {
    return m_viewAspect;
  };

  /**
   * Set view aspect
   */
  this.setViewAspect = function(aspect) {
    m_viewAspect = aspect;
    this.modified();
  };

  /**
   *
   */
  this.computeDirectionOfProjection = function() {
    vec3.subtract(m_directionOfProjection, m_focalPoint, m_position);
    vec3.normalize(m_directionOfProjection, m_directionOfProjection);
    this.modified();
  }

  /**
   * Move camera closer or further away from the scene
   */
  this.zoom = function(dz) {
    var deltaX = m_directionOfProjection[0] * dz;
    var deltaY = m_directionOfProjection[1] * dz;
    var deltaZ = m_directionOfProjection[2] * dz;

    m_position[0] += deltaX;
    m_position[1] += deltaY;
    m_position[2] += deltaZ;

    this.modified();
    // TODO: If the distance between focal point and the camera position
    // goes really low then we run into issues
  };

  /**
   * Move camera sideways
   */
  this.pan = function(dx, dy, dz) {
    m_position[0] += dx;
    m_position[1] += dy;
    m_position[2] += dz;

    m_focalPoint[0] += dx;
    m_focalPoint[1] += dy
    m_focalPoint[2] += dz;

    this.modified();
  };

  /**
   * Compute camera coordinate axes
   */
  this.computeOrthogonalAxes = function() {
    this.computeDirectionOfProjection();
    vec3.cross(m_right, m_directionOfProjection, m_viewUp);
    vec3.normalize(m_right, m_right);
    this.modified();
  };

  /**
   * Rotate camera around center of rotation
   * @param dx Rotation around vertical axis in degrees
   * @param dy Rotation around horizontal axis in degrees
   */
  this.rotate = function(dx, dy) {

    // Convert degrees into radians
    dx = 0.5 * dx * (Math.PI / 180.0);
    dy = 0.5 * dy * (Math.PI / 180.0);

    var mat = mat4.create();
    mat4.identity(mat, mat);

    var invtrans = new vec3.create();
    invtrans[0] = -m_centerOrRotation[0];
    invtrans[1] = -m_centerOrRotation[1];
    invtrans[2] = -m_centerOrRotation[2];

    mat4.translate(mat, mat, m_centerOrRotation);
    mat4.rotate(mat, mat, dx, m_viewUp);
    mat4.rotate(mat, mat, dy, m_right);
    mat4.translate(mat, mat, invtrans);

    vec3.transformMat4(m_position, m_position, mat);
    vec3.transformMat4(m_focalPoint, m_focalPoint, mat);

    // Update right vector
    vec3.transformMat4(m_right, m_right, mat);
    vec3.normalize(m_right, m_right);

    // Update viewup vector
    vec3.transformMat4(m_viewUp, m_viewUp, mat);
    vec3.normalize(m_viewUp, m_viewUp);

    // Update direction of projection
    this.computeOrthogonalAxes();

    // Mark modified
    this.modified();
  }

  /**
   * Compute camera view matrix
   */
  this.computeViewMatrix = function() {
    if (m_computeModelViewMatrixTime.getMTime() < this.getMTime()) {
      console.log('recomputing modelview');
      mat4.lookAt(m_viewMatrix, m_position, m_focalPoint, m_viewUp);
      m_computeModelViewMatrixTime.modified();
    }
    return m_viewMatrix;
  };

  /**
   * Return view-matrix for the camera This method does not compute the
   * view-matrix for the camera. It is assumed that a call to computeViewMatrix
   * has been made earlier.
   *
   * @returns {mat4}
   */
  this.viewMatrix = function() {
    return this.computeViewMatrix();
  };

  /**
   * Compute camera projection matrix
   */
  this.computeProjectionMatrix = function() {
    if (m_computeProjectMatrixTime.getMTime() < this.getMTime()) {
      mat4.identity(m_projectionMatrix, m_projectionMatrix);
      mat4.perspective(m_projectionMatrix, m_viewAngle, m_viewAspect, m_near, m_far);
      m_computeProjectMatrixTime.modified();
    }

    return m_projectionMatrix;
  };

  /**
   * Return camera projection matrix This method does not compute the
   * projection-matrix for the camera. It is assumed that a call to
   * computeProjectionMatrix has been made earlier.
   *
   * @returns {mat4}
   */
  this.projectionMatrix = function() {
    return this.computeProjectionMatrix();
  };

  this.computeDirectionOfProjection();

  return this;
};

inherit(vglModule.camera, vglModule.groupNode);
