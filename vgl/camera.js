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
  var m_viewAngle = 30;

  /** @private */
  var m_position = vec3.create([ 0.0, 0.0, 0.0 ]);

  /** @private */
  var m_focalPoint = vec3.create([ 0.0, 0.0, -5.0 ]);

  /** @private */
  var m_centerOrRotation = vec3.create([ 0.0, 0.0, 0.0 ]);

  /** @private */
  var m_viewUp = vec3.create([ 0.0, 1.0, 0.0 ]);

  /** @private */
  var m_right = vec3.create([ 1.0, 0.0, 0.0 ]);

  /** @private */
  var m_near = 0.1;

  /** @private */
  var m_far = 10000.0;

  /** @private */
  var m_viewAspect = 1.0;

  /** @private */
  var m_directionOfProjection = vec3.createFrom(0.0, 0.0, -1.0);

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
   m_position = vec3.create([ x, y, z ]);
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
    m_focalPoint = vec3.create([ x, y, z ]);
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
    m_viewUp = vec3.create([ x, y, z ]);
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
    vec3.subtract(m_focalPoint, m_position, m_directionOfProjection);
    vec3.normalize(m_directionOfProjection);
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
    var mat = this.computeViewMatrix();
    m_viewUp[0] = mat[4];
    m_viewUp[1] = mat[5];
    m_viewUp[2] = mat[6];

    m_right[0] = mat[0];
    m_right[1] = mat[1];
    m_right[2] = mat[2];
  };

  /**
   * Rotate camera around center of rotation
   * @param dx Rotation around vertical axis in degrees
   * @param dy Rotation around horizontal axis in degrees
   */
  this.rotate = function(dx, dy) {
    dx = dx * (22.0 / (7.0 * 180.0));
    dy = dy * (22.0 / (7.0 * 180.0));

    var mat = mat4.create();
    mat4.identity(mat);

    var invtrans = new vec3.create();
    invtrans[0] = -m_centerOrRotation[0];
    invtrans[1] = -m_centerOrRotation[1];
    invtrans[2] = -m_centerOrRotation[2];

    mat4.translate(mat, m_centerOrRotation, mat);
    mat4.rotate(mat, dx, m_viewUp, mat);
    mat4.rotate(mat, dy, m_right, mat);
    mat4.translate(mat, invtrans, mat);

    mat4.multiplyVec3(mat, m_position, m_position);
    mat4.multiplyVec3(mat, m_focalPoint, m_focalPoint);

    // Update right vector
    mat4.multiplyVec3(mat, m_right);
    vec3.normalize(m_right);

    // Update viewup vector
    mat4.multiplyVec3(mat, m_viewUp);
    vec3.normalize(m_viewUp);

    // Update direction of projection
    this.computeDirectionOfProjection();

    this.modified();
  }

  /**
   * Compute camera view matrix
   */
  this.computeViewMatrix = function() {
    if (m_computeModelViewMatrixTime.getMTime() < this.getMTime()) {
      mat4.lookAt(m_position, m_focalPoint, m_viewUp, m_viewMatrix);
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
      mat4.identity(m_projectionMatrix);
      mat4.perspective(m_viewAngle, m_viewAspect, m_near, m_far, m_projectionMatrix);
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
