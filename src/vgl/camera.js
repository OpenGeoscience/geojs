var vgl = require('./vgl');
var inherit = require('../inherit');
var timestamp = require('../timestamp');
var vec3 = require('gl-vec3');
var vec4 = require('gl-vec4');
var mat4 = require('gl-mat4');

/**
 * Create a new instance of class camera.
 *
 * @class
 * @alias vgl.camera
 * @extends vgl.groupNode
 * @param {object} arg
 * @param {boolean?} arg.parallelProjection Optionally start with a parallel
 *      projection.
 * @returns {vgl.camera}
 */
vgl.camera = function (arg) {
  'use strict';

  if (!(this instanceof vgl.camera)) {
    return new vgl.camera(arg);
  }
  vgl.groupNode.call(this);
  arg = arg || {};

  /** @private */
  var m_viewAngle = (Math.PI * 30) / 180.0,
      m_position = vec4.fromValues(0.0, 0.0, 1.0, 1.0),
      m_focalPoint = vec4.fromValues(0.0, 0.0, 0.0, 1.0),
      m_viewUp = vec4.fromValues(0.0, 1.0, 0.0, 0.0),
      m_near = 0.01,
      m_far = 10000.0,
      m_viewAspect = 1.0,
      m_directionOfProjection = vec4.fromValues(0.0, 0.0, -1.0, 0.0),
      m_viewMatrix = mat4.create(),
      m_projectionMatrix = mat4.create(),
      m_computeModelViewMatrixTime = timestamp(),
      m_computeProjectMatrixTime = timestamp(),
      m_left = -1.0,
      m_right = 1.0,
      m_top = +1.0,
      m_bottom = -1.0,
      m_parallelExtents = {zoom: 1, tilesize: 256},
      m_enableParallelProjection = false,
      m_clearColor = [0.0, 0.0, 0.0, 0.0],
      m_clearDepth = 1.0,
      /*jshint bitwise: false */
      m_clearMask = vgl.GL.COLOR_BUFFER_BIT |
                    vgl.GL.DEPTH_BUFFER_BIT;
  /*jshint bitwise: true */

  if (arg.parallelProjection !== undefined) {
    m_enableParallelProjection = arg.parallelProjection ? true : false;
  }

  /**
   * Set view aspect.
   *
   * @param {number} aspect Aspect ration (width / height).
   */
  this.setViewAspect = function (aspect) {
    m_viewAspect = aspect;
    this.modified();
  };

  /**
   * Get parallel projection extents parameters.
   *
   * @returns {object} Extents object with width, height, zoom, and tilesize.
   */
  this.parallelExtents = function () {
    return m_parallelExtents;
  };

  /**
   * Set parallel projection extents parameters.
   *
   * @param {object} extents Extents object with width, height, zoom, and
   *    tilesize.
   */
  this.setParallelExtents = function (extents) {
    var prop = ['width', 'height', 'zoom', 'tilesize'], mod = false, i, key;
    for (i = 0; i < prop.length; i += 1) {
      key = prop[i];
      if (extents[key] !== undefined &&
          extents[key] !== m_parallelExtents[key]) {
        m_parallelExtents[key] = extents[key];
        mod = true;
      }
    }
    if (mod && m_parallelExtents.width && m_parallelExtents.height &&
        m_parallelExtents.zoom !== undefined && m_parallelExtents.tilesize) {
      var unitsPerPixel = this.unitsPerPixel(m_parallelExtents.zoom,
                                             m_parallelExtents.tilesize);
      m_right = unitsPerPixel * m_parallelExtents.width / 2;
      m_left = -m_right;
      m_top = unitsPerPixel * m_parallelExtents.height / 2;
      m_bottom = -m_top;
      this.modified();
    }
  };

  /**
   * Compute the units per pixel.
   *
   * @param {number} zoom Tile zoom level.
   * @param {number} tilesize Number of pixels per tile (defaults to 256).
   * @returns {number} unitsPerPixel.
   */
  this.unitsPerPixel = function (zoom, tilesize) {
    tilesize = tilesize || 256;
    return 360.0 * Math.pow(2, -zoom) / tilesize;
  };

  /**
   * Return view-matrix for the camera This method does not compute the
   * view-matrix for the camera. It is assumed that a call to computeViewMatrix
   * has been made earlier.
   *
   * @returns {mat4}
   */
  this.viewMatrix = function () {
    return this.computeViewMatrix();
  };

  /**
   * Set the view-matrix for the camera and mark that it is up to date so that
   * it won't be recomputed unless something else changes.
   *
   * @param {mat4} view new view matrix.
   * @param {boolean} preserveType If true, clone the input using slice.  This
   *    can be used to ensure the array is a specific precision.
   */
  this.setViewMatrix = function (view, preserveType) {
    if (!preserveType) {
      mat4.copy(m_viewMatrix, view);
    } else {
      m_viewMatrix = view.slice();
    }
    m_computeModelViewMatrixTime.modified();
  };

  /**
   * Return camera projection matrix This method does not compute the
   * projection-matrix for the camera. It is assumed that a call to
   * computeProjectionMatrix has been made earlier.
   *
   * @returns {mat4}
   */
  this.projectionMatrix = function () {
    return this.computeProjectionMatrix();
  };

  /**
   * Set the projection-matrix for the camera and mark that it is up to date so
   * that it won't be recomputed unless something else changes.
   *
   * @param {mat4} proj New projection matrix.
   */
  this.setProjectionMatrix = function (proj) {
    mat4.copy(m_projectionMatrix, proj);
    m_computeProjectMatrixTime.modified();
  };

  /**
   * Return clear mask used by this camera.
   *
   * @returns {number}
   */
  this.clearMask = function () {
    return m_clearMask;
  };

  /**
   * Get clear color (background color) of the camera.
   *
   * @returns {Array}
   */
  this.clearColor = function () {
    return m_clearColor;
  };

  /**
   * Get the clear depth value.
   *
   * @returns {number}
   */
  this.clearDepth = function () {
    return m_clearDepth;
  };

  /**
   * Compute direction of projection.
   */
  this.computeDirectionOfProjection = function () {
    vec3.subtract(m_directionOfProjection, m_focalPoint, m_position);
    vec3.normalize(m_directionOfProjection, m_directionOfProjection);
    this.modified();
  };

  /**
   * Compute camera view matrix.
   *
   * @returns {mat4}
   */
  this.computeViewMatrix = function () {
    if (m_computeModelViewMatrixTime.getMTime() < this.getMTime()) {
      mat4.lookAt(m_viewMatrix, m_position, m_focalPoint, m_viewUp);
      m_computeModelViewMatrixTime.modified();
    }
    return m_viewMatrix;
  };

  /**
   * Compute camera projection matrix.
   *
   * @returns {mat4}
   */
  this.computeProjectionMatrix = function () {
    if (m_computeProjectMatrixTime.getMTime() < this.getMTime()) {
      if (!m_enableParallelProjection) {
        mat4.perspective(m_projectionMatrix, m_viewAngle, m_viewAspect, m_near, m_far);
      } else {
        mat4.ortho(m_projectionMatrix,
                   m_left, m_right, m_bottom, m_top, m_near, m_far);
      }

      m_computeProjectMatrixTime.modified();
    }

    return m_projectionMatrix;
  };

  this.computeDirectionOfProjection();

  return this;
};

inherit(vgl.camera, vgl.groupNode);
