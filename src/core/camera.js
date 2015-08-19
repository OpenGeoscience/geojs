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
   *   * {@link geo.event.camera.pan} when the camera is translated in the
   *       x/y plane
   *   * {@link geo.event.camera.zoom} when the camera is changed in a way
   *       that modifies the current zoom level
   *   * {@link geo.event.camera.view} when the visible bounds change for
   *       any reason
   *   * {@link geo.event.camera.projection} when the projection type changes
   *
   * By convention, protected methods do not update the internal matrix state,
   * public methods do.  For now, there are two primary methods that are
   * inteded to be used by external classes to mutate the internal state:
   *
   *   * bounds: Set the visible bounds (for initialization and zooming)
   *   * pan: Translate the camera in x/y by an offset (for panning)
   *
   * @class
   * @extends geo.object
   * @param {object?} spec Options argument
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
    this._projection = null;

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
     * Set up the projection matrix for the current projection type.
     * @protected
     */
    this._createProj = function () {
      // call mat4.frustum or mat4.ortho here
      if (this._projection === 'perspective') {
        mat4.frustum(
          this._proj,
          this.constructor.bounds.left,
          this.constructor.bounds.right,
          this.constructor.bounds.bottom,
          this.constructor.bounds.top,
          this.constructor.bounds.near,
          this.constructor.bounds.far
        );
      } else if (this._projection === 'parallel') {
        mat4.ortho(
          this._proj,
          this.constructor.bounds.left,
          this.constructor.bounds.right,
          this.constructor.bounds.bottom,
          this.constructor.bounds.top,
          this.constructor.bounds.near,
          this.constructor.bounds.far
        );
      }
    };

    /**
     * Update the internal state of the camera on change to camera
     * parameters.
     * @protected
     */
    this._update = function () {
      mat4.multiply(this._transform, this._view, this._proj);
      mat4.invert(this._inverse, this._transform);
      this.geoTrigger(geo.event.camera.view, {
        camera: this
      });
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
      }
    });

    /**
     * Getter/setter for the projection type.
     */
    Object.defineProperty(this, 'projection', {
      get: function () {
        return this._projection;
      },
      set: function (type) {
        if (!this.constructor.projection[type]) {
          throw new Error('Unsupported projection type: ' + type);
        }
        if (type !== this._projection) {
          this._projection = type;
          this._createProj();
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
     * This generally shouldn't be modified directly because
     * the rest of the code assumes that the clipping bounds
     * are [-1, -1, -1] to [1, 1, 1] in camera coordinates.
     */
    Object.defineProperty(this, 'projectionMatrix', {
      get: function () {
        return this._proj;
      },
      set: function (proj) {
        this._proj = proj;
        this._update();
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
     * @protected
     * @param {vec3} eye Position of the viewer
     * @param {vec3} center Point the viewer is looking at
     * @param {vec3} up Normal vector pointing up
     * @returns {this} Chainable
     */
    this._lookAt = function (eye, center, up) {
      mat4.lookAt(this._view, eye, center, up);
    };

    /**
     * Uses `mat4.translate` to translate the camera by the given vector amount.
     * @protected
     * @param {vecs} offset The camera translation vector
     * @returns {this} Chainable
     */
    this._translate = function (offset) {
      // mat4.translate translates the coordinate system, not the camera
      vec3.negate(offset, offset);
      mat4.translate(this._view, this._view, offset);
    };

    /**
     * Uses `mat4.rotateZ` to translate the camera by the given angle around the Z-axis.
     * @protected
     * @param {number} angle The angle in radians
     * @returns {this} Chainable
     */
    this._rotateZ = function (angle) {
      mat4.rotateZ(this._view, this._view, -angle);
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
     * @param {number} width The viewport width
     * @param {number} height The viewport height
     * @returns {vec4} The point in display coordinates
     *
     * @note For the moment, this computation assumes the following:
     *   * point[3] > 0
     *   * depth range [0, 1]
     *
     * The clip space z and w coordinates are returned with the window
     * x/y coordinates.
     */
    this.worldToDisplay4 = function (point, width, height) {
      this._worldToClip4(point);
      var w = 1;
      if (this._projection === 'perspective') {
        w = 1 / point[3];
      }
      point[0] = width * (1 + w * point[0]) / 2.0;
      point[1] = height * (1 - w * point[1]) / 2.0;
      point[2] = (1 + w * point[2]) / 2.0;
      point[3] = w; // as in gl_FragCoord
      return point;
    };

    /**
     * Project a vec4 from display space into world space in place.
     * @param {vec4} point The point in display coordinates (mutated)
     * @param {number} width The viewport width
     * @param {number} height The viewport height
     * @returns {vec4} The point in world space coordinates
     *
     * @note For the moment, this computation assumes the following:
     *   * point[3] > 0
     *   * depth range [0, 1]
     */
    this.displayToWorld4 = function (point, width, height) {
      var w = 1;
      if (this._projection === 'perspective') {
        w = 1 / point[3];
      }
      point[0] = (2.0 * point[0] / width - 1) * w;
      point[1] = (-2.0 * point[1] / height + 1) * w;
      point[2] = (2.0 * point[2] - 1) * w;
      point[3] = w;
      this._clipToWorld4(point);
      return point;
    };

    /**
     * Project a point object from world space into viewport space.
     * @param {object} point The point in world coordinates
     * @param {number} point.x
     * @param {number} point.y
     * @param {number} width The viewport width
     * @param {number} height The viewport height
     * @returns {object} The point in display coordinates
     */
    this.worldToDisplay = function (point, width, height) {
      point = this.worldToDisplay4(
        [point.x, point.y, point.z, 1],
        width,
        height
      );
      return {x: point[0], y: point[1], z: point[2]};
    };

    /**
     * Project a point object from viewport space into world space.
     * @param {object} point The point in display coordinates
     * @param {number} point.x
     * @param {number} point.y
     * @param {number} width The viewport width
     * @param {number} height The viewport height
     * @returns {object} The point in world coordinates
     */
    this.displayToWorld = function (point, width, height) {
      point = this.displayToWorld4(
        [point.x, point.y, point.z, 1],
        width,
        height
      );
      return {x: point[0], y: point[1], z: point[2]};
    };

    /**
     * Sets the view matrix to the given world space bounds.
     *
     * @param {object} bounds
     * @param {number} bounds.left
     * @param {number} bounds.right
     * @param {number} bounds.bottom
     * @param {number} bounds.top
     * @param {number?} bounds.near
     * @param {number?} bounds.far
     *
     * @note The camera does not know about the viewport size or
     * aspect ratio.  It is up to the caller to ensure the viewport
     * has the correct aspect ratio to avoid non-homogenious scaling.
     *
     * If not provided, near and far bounds will be set to [-1, 1] by
     * default.  We will probably want to change this to a unit specific
     * value initialized by the map when drawing true 3D objects or
     * tilting the camera.
     */
    this.bounds = function (bounds) {

      bounds.near = bounds.near || -1;
      bounds.far = bounds.far || 1;

      mat4.ortho(
        this._view,
        bounds.left,
        bounds.right,
        bounds.bottom,
        bounds.top,
        bounds.near,
        bounds.far
      );
      this._update();
    };

    /**
     * Pans the view matrix by the given amount.
     *
     * @param {object} offset The delta in world space coordinates.
     * @param {number} offset.x
     * @param {number} offset.y
     * @param {number} [offset.z=0]
     */
    this.pan = function (offset) {
      this._translate(vec3.fromValues(
        offset.x,
        offset.y,
        offset.z || 0
      ));
      this._update();
    };

    // set up the projection matrix
    this.projection = spec.projection || 'parallel';
  };

  /**
   * Supported projection types.
   */
  geo.camera.projection = {
    perspective: true,
    parallel: true
  };

  /**
   * Camera clipping bounds, probably shouldn't be modified.
   */
  geo.camera.bounds = {
    left: -1,
    right: 1,
    bottom: -1,
    top: 1,
    near: -1,
    far: 1
  };

  inherit(geo.camera, geo.object);
})();
