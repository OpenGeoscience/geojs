(function () {
  'use strict';

  //////////////////////////////////////////////////////////////////////////////
  /**
   * This class defines the raw interface for a camera.  At a low level, the
   * camera provides a methods for converting between a map's coordinate system
   * to display pixel coordinates.
   *
   * For the moment, all camera trasforms are assumed to be expressible as
   * 4x4 matrices.  More general cameras may follow that break this assumption.
   *
   * The interface for the camera is relatively stable for "map-like" views,
   * i.e. when the camera is pointing in the direction [0, 0, -1], and placed
   * above the z=0 plane.  More general view changes and events have not yet
   * been defined.
   *
   * The camera emits the following events when the view changes:
   *
   *   * {@link geo.event.camera.view} when the camera's view matrix changes
   *   * {@link geo.event.camera.projection} when the projection changs
   *
   * @class
   * @extends geo.object
   * @param {Object?} spec Options argument
   * @param {string} spec.projection One of the supported geo.camera.projection
   * @returns {geo.camera}
   */
  //////////////////////////////////////////////////////////////////////////////
  geo.camera = function (spec) {
    if (!(this instanceof geo.camera)) {
      return new geo.camera(spec);
    }
    spec = spec || {};
    geo.object.call(this, spec);

    /**
     * The view matrix
     * @protected
     */
    this._view = mat4.create();

    /**
     * The projection matrix
     * @protected
     */
    this._proj = mat4.create();

    /**
     * The projection type (one of `this.constructor.projection`)
     * @protected
     */
    this._projection = spec.projection || 'parallel';

    /**
     * The transform matrix (view * proj)
     * @protected
     */
    this._transform = mat4.create();

    /**
     * The inverse transform matrix (view * proj)^-1
     * @protected
     */
    this._inverse = mat4.create();

    /**
     * Update the internal state of the camera on change to camera
     * parameters.
     * @protected
     */
    this._update = function () {
      mat4.multiply(this._transform, this._view, this._proj);
      mat4.invert(this._inverse, this._transform);
    };

    /**
     * Getter/setter for the view matrix.
     * @note copies the matrix value on set.
     */
    Object.defineProperty(this, 'view', {
      get: function () {
        return this._view;
      },
      set: function (view) {
        mat4.copy(this._view, view);
        this._update();
        this.geoTrigger(geo.event.camera.view, {
          camera: this
        });
      }
    });

    /**
     * Getter/setter for the projection type.
     */
    Object.defineProperty(this, 'projection', {
      get: function () {
        return this._proj;
      },
      set: function (type) {
        if (!this.constructor.projection[type]) {
          throw new Error('Unsupported projection type: ' + type);
        }
        if (type !== this._projection) {
          this._projection = type;
          this._update();
          this.geoTrigger(geo.event.camera.projection, {
            camera: this,
            projection: type
          });
        }
      }
    });

    /**
     * Getter for the projection matrix (when applicable).
     */
    Object.defineProperty(this, 'projectionMatrix', {
      get: function () {
        return this._proj;
      }
    });

    /**
     * Getter for the transform matrix.
     */
    Object.defineProperty(this, 'transform', {
      get: function () {
        return this._transform;
      }
    });

    /**
     * Getter for the inverse transform matrix.
     */
    Object.defineProperty(this, 'inverse', {
      get: function () {
        return this._inverse;
      }
    });

    /**
     * Proxy to `mat4.lookAt` to modify the view matrix by pointing the
     * camera at the given location.
     * @param {vec3} eye Position of the viewer
     * @param {vec3} center Point the viewer is looking at
     * @param {vec3} up Normal vector pointing up
     * @returns {this} Chainable
     */
    this.lookAt = function (eye, center, up) {
      mat4.lookAt(this._view, eye, center, up);
      this._update();
    };

    /**
     * Uses `mat4.translate` to translate the camera by the given vector amount.
     * @param {vecs} offset The camera translation vector
     * @returns {this} Chainable
     */
    this.translate = function (offset) {
      // mat4.translate translates the coordinate system, not the camera
      vec3.negate(offset, offset);
      mat4.translate(this._view, this._view, offset);
      this._update();
    };

    /**
     * Uses `mat4.rotateZ` to translate the camera by the given angle around the Z-axis.
     * @param {Number} angle The angle in radians
     * @returns {this} Chainable
     */
    this.rotateZ = function (angle) {
      mat4.rotateZ(this._view, this._view, -angle);
      this._update();
    };

    /**
     * Project a vec4 from world space into clipped space [-1, 1] in place
     * @protected
     * @param {vec4} point The point in world coordinates (mutated)
     * @returns {vec4} The point in clip space coordinates
     */
    this._worldToClip4 = function (point) {
      vec4.transformMat4(point, point, this._transform);
      return point;
    };

    /**
     * Project a vec4 from clipped space into world space in place
     * @protected
     * @param {vec4} point The point in clipped coordinates (mutated)
     * @returns {vec4} The point in world space coordinates
     */
    this._clipToWorld4 = function (point) {
      vec4.transformMat4(point, point, this._inverse);
      return point;
    };

    /**
     * Project a vec4 from world space into viewport space.
     * @param {vec4} point The point in world coordinates (mutated)
     * @param {Number} width The viewport width
     * @param {Number} height The viewport height
     * @returns {vec4} The point in display coordinates
     *
     * @note For the moment, this computation assumes the following:
     *   * point[3] > 0
     *   * depth range [0, 1]
     *
     * The clip space z and w coordinates are returned with the window
     * x/y coordinates.
     */
    this.worldToDisplay = function (point, width, height) {
      this._worldToClip4(point);
      var w = 1 / point[3];
      point[0] = width * (1 + w * point[0]) / 2.0;
      point[1] = height * (1 - w * point[1]) / 2.0;
      point[2] = (1 + w * point[2]) / 2.0;
      point[3] = w; // as in gl_FragCoord
      return point;
    };

    /**
     * Project a vec4 from display space into world space in place.
     * @param {vec4} point The point in display coordinates (mutated)
     * @param {Number} width The viewport width
     * @param {Number} height The viewport height
     * @returns {vec4} The point in world space coordinates
     *
     * @note For the moment, this computation assumes the following:
     *   * point[3] > 0
     *   * depth range [0, 1]
     */
    this.displayToWorld = function (point, width, height) {
      var w = 1 / point[3];
      point[0] = (2.0 * point[0] / width - 1) * w;
      point[1] = (-2.0 * point[1] / height + 1) * w;
      point[2] = (2.0 * point[2] - 1) * w;
      point[3] = w;
      this._clipToWorld4(point);
      return point;
    };
  };

  /**
   * Supported projection types.
   */
  geo.camera.projection = {
    perspective: true,
    parallel: true
  };

  inherit(geo.camera, geo.object);
})();
