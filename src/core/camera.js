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
     * Cached bounds object recomputed on demand.
     * @protected
     */
    this._bounds = null;

    /**
     * Set up the projection matrix for the current projection type.
     * @protected
     */
    this._createProj = function () {
      var s = this.constructor.bounds.near / this.constructor.bounds.far;

      // call mat4.frustum or mat4.ortho here
      if (this._projection === 'perspective') {
        mat4.frustum(
          this._proj,
          this.constructor.bounds.left * s,
          this.constructor.bounds.right * s,
          this.constructor.bounds.bottom * s,
          this.constructor.bounds.top * s,
          -this.constructor.bounds.near,
          -this.constructor.bounds.far
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
      this._bounds = null;
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
     * Getter/setter for the view bounds.
     *
     * @note The camera does not know about the viewport size or
     * aspect ratio.  It is up to the caller to ensure the viewport
     * has the correct aspect ratio to avoid non-homogenious scaling.
     *
     * If not provided, near and far bounds will be set to [-1, 1] by
     * default.  We will probably want to change this to a unit specific
     * value initialized by the map when drawing true 3D objects or
     * tilting the camera.
     *
     * Returned near/far bounds are also -1, 1 for the moment.
     */
    Object.defineProperty(this, 'bounds', {
      get: function () {
        if (this._bounds === null) {
          this._bounds = this._getBounds();
        }
        return this._bounds;
      },
      set: function (bounds) {
        this._setBounds(bounds);
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
     * Reset the view matrix to its initial (identity) state.
     * @protected
     * @returns {this} Chainable
     */
    this._resetView = function () {
      mat4.identity(this._view);
      return this;
    };

    /**
     * Uses `mat4.translate` to translate the camera by the given vector amount.
     * @protected
     * @param {vec3} offset The camera translation vector
     * @returns {this} Chainable
     */
    this._translate = function (offset) {
      mat4.translate(this._view, this._view, offset);
    };

    /**
     * Uses `mat4.scale` to scale the camera by the given vector amount.
     * @protected
     * @param {vec3} scale The scaling vector
     * @returns {this} Chainable
     */
    this._scale = function (scale) {
      mat4.scale(this._view, this._view, scale);
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
      point[2] -= 2;
      this._worldToClip4(point);
      var w = 1;
      if (this._projection === 'perspective' && point[3]) {
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
        w = 2; // from default camera near and far clipping
        if (point[3]) {
          w = point[3];
        }
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
        [point.x, point.y, 0, 1],
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
        [point.x, point.y, 0, 2],
        width,
        height
      );
      return {x: point[0], y: point[1]};
    };

    /**
     * Calculate the current bounds in world coordinates from the
     * current view matrix.  This computes a matrix vector multiplication
     * so the result is cached for public facing methods.
     *
     * @protected
     * @returns {object} bounds object
     */
    this._getBounds = function () {
      var pt, bds = {};

      // get lower bounds
      pt = vec4.fromValues(-1, -1, 1, 1);
      this._clipToWorld4(pt);
      bds.left = pt[0] / pt[3];
      bds.bottom = pt[1] / pt[3];

      // get upper bounds
      pt = vec4.fromValues(1, 1, 1, 1);
      this._clipToWorld4(pt);
      bds.right = pt[0] / pt[3];
      bds.top = pt[1] / pt[3];

      return bds;
    };

    /**
     * Sets the view matrix to the given world space bounds.
     *
     * @protected
     * @param {object} bounds
     * @param {number} bounds.left
     * @param {number} bounds.right
     * @param {number} bounds.bottom
     * @param {number} bounds.top
     * @param {number?} bounds.near
     * @param {number?} bounds.far
     * @return {this} Chainable
     */
    this._setBounds = function (bounds) {

      var translate = vec3.create(),
          scale = vec3.create();

      bounds.near = bounds.near || 1;
      bounds.far = bounds.far || 0;

      // reset view to the identity
      this._resetView();

      // scale to the new coordinate units
      scale[0] = 2 / (bounds.right - bounds.left);
      scale[1] = 2 / (bounds.top - bounds.bottom);
      scale[2] = 1; // / (bounds.near - bounds.far);
      this._scale(scale);

      // translate to the new center
      translate[0] = (bounds.left + bounds.right) / -2;
      translate[1] = (bounds.bottom + bounds.top) / -2;
      translate[2] = 0;
      this._translate(translate);

      return this;
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

    /**
     * Zooms the view matrix by the given amount.
     *
     * @param {number} zoom The zoom scale to apply
     */
    this.zoom = function (zoom) {
      mat4.scale(this._view, this._view,
        vec3.fromValues(
          zoom,
          zoom,
          zoom
        )
      );
      this._update();
    };

    /**
     * Represent a glmatrix as a pretty-printed string.
     * @param {mat4} mat A 4 x 4 matrix
     * @param {number} prec The number of decimal places
     * @returns {string}
     */
    this.ppMatrix = function (mat, prec) {
      var t = mat;
      prec = prec || 2;
      function f(i) {
        var d = t[i], s = d.toExponential(prec);
        if (d >= 0) {
          s = ' ' + s;
        }
        return s;
      }
      return [
        [f(0), f(4), f(8), f(12)].join(' '),
        [f(1), f(5), f(9), f(13)].join(' '),
        [f(2), f(6), f(10), f(14)].join(' '),
        [f(3), f(7), f(11), f(15)].join(' ')
      ].join('\n');
    };

    /**
     * Pretty print the transform matrix.
     */
    this.toString = function () {
      return this.ppMatrix(this._transform);
    };

    /**
     * Return a debugging string of the current camera state.
     */
    this.debug = function () {
      return [
        'bounds',
        JSON.stringify(this.bounds),
        'view:',
        this.ppMatrix(this._view),
        'projection:',
        this.ppMatrix(this._proj),
        'transform:',
        this.ppMatrix(this._transform)
      ].join('\n');
    };

    /**
     * Represent the value of the camera as its transform matrix.
     */
    this.valueOf = function () {
      return this._transform;
    };

    // initialize the view matrix
    this._resetView();

    // set up the projection matrix
    this.projection = spec.projection || 'parallel';

    // trigger an initial update to set up the camera state
    this._update();

    return this;
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
    top: 1,
    bottom: -1,
    far: -2,
    near: -1
  };

  /**
   * Output a mat4 as a css transform.
   * @param {mat4} t A matrix transform
   * @returns {string} A css transform string
   */
  geo.camera.css = function (t) {
    return (
      'matrix3d(' +
      [
        t[0].toFixed(20),
        t[1].toFixed(20),
        t[2].toFixed(20),
        t[3].toFixed(20),
        t[4].toFixed(20),
        t[5].toFixed(20),
        t[6].toFixed(20),
        t[7].toFixed(20),
        t[8].toFixed(20),
        t[9].toFixed(20),
        t[10].toFixed(20),
        t[11].toFixed(20),
        t[12].toFixed(20),
        t[13].toFixed(20),
        t[14].toFixed(20),
        t[15].toFixed(20)
      ].join(',') +
      ')'
    );
  };

  inherit(geo.camera, geo.object);
})();
