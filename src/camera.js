var inherit = require('./inherit');
var object = require('./object');
var util = require('./util');
var mat3 = require('gl-mat3');
var vec3 = require('gl-vec3');
var mat4 = require('gl-mat4');
var vec4 = require('gl-vec4');

/**
 * This class defines the raw interface for a camera.  At a low level, the
 * camera provides a methods for converting between a map's coordinate system
 * to display pixel coordinates.
 *
 * For the moment, all camera transforms are assumed to be expressible as
 * 4x4 matrices.  More general cameras may follow that break this assumption.
 *
 * The interface for the camera is relatively stable for "map-like" views,
 * e.g. when the camera is pointing in the direction [0, 0, -1], and placed
 * above the z=0 plane.  More general view changes and events have not yet
 * been defined.
 *
 * The camera emits the following events when the view changes:
 *
 *   {@link geo.event.camera.pan} when the camera is translated in the
 *       x/y plane
 *   {@link geo.event.camera.zoom} when the camera is changed in a way
 *       that modifies the current zoom level
 *   {@link geo.event.camera.view} when the visible bounds change for
 *       any reason
 *   {@link geo.event.camera.projection} when the projection type changes
 *   {@link geo.event.camera.viewport} when the viewport changes
 *
 * By convention, protected methods do not update the internal matrix state,
 * public methods do.  There are a few primary methods that are intended to
 * be used by external classes to mutate the internal state:
 *
 *   bounds: Set the visible bounds (for initialization and zooming)
 *   pan: Translate the camera in x/y by an offset (for panning)
 *   viewFromCenterSizeRotation: set the camera view based on a center
 *        point, boundary size, and rotation angle.
 *
 * @class
 * @alias geo.camera
 * @extends geo.object
 * @param {object?} spec Options argument
 * @param {string} spec.projection One of the supported
 *    {@link geo.camera.projection}.
 * @param {object} spec.viewport The initial camera viewport
 * @param {object} spec.viewport.width
 * @param {object} spec.viewport.height
 * @returns {geo.camera}
 */
var camera = function (spec) {
  if (!(this instanceof camera)) {
    return new camera(spec);
  }

  var geo_event = require('./event');

  spec = spec || {};
  object.call(this, spec);

  /**
   * The view matrix
   * @protected
   */
  this._view = util.mat4AsArray();

  /**
   * The projection matrix
   * @protected
   */
  this._proj = util.mat4AsArray();

  /**
   * The projection type (one of `this.constructor.projection`)
   * @protected
   */
  this._projection = null;

  /**
   * The transform matrix (view * proj)
   * @protected
   */
  this._transform = util.mat4AsArray();

  /**
   * The inverse transform matrix (view * proj)^-1
   * @protected
   */
  this._inverse = util.mat4AsArray();

  /**
   * Cached bounds object recomputed on demand.
   * @protected
   */
  this._bounds = null;

  /**
   * Cached "display" matrix recomputed on demand.
   * @see {@link geo.camera.display}
   * @protected
   */
  this._display = null;

  /**
   * Cached "world" matrix recomputed on demand.
   * @see {@link geo.camera.world}
   * @protected
   */
  this._world = null;

  /**
   * The viewport parameters size and offset.
   * @property {number} height Viewport height in pixels
   * @property {number} width Viewport width in pixels
   * @protected
   */
  this._viewport = {width: 1, height: 1};

  /**
   * Set up the projection matrix for the current projection type.
   * @protected
   */
  this._createProj = function () {
    var func = this._projection === 'perspective' ? mat4.frustum : mat4.ortho,
        clipbounds = this._clipbounds[this._projection];
    func(this._proj, clipbounds.left, clipbounds.right, clipbounds.bottom,
         clipbounds.top, clipbounds.near, clipbounds.far);
  };

  /**
   * Update the internal state of the camera on change to camera
   * parameters.
   * @protected
   * @fires geo.event.camera.view
   */
  this._update = function () {
    this._bounds = null;
    this._display = null;
    this._world = null;
    this._transform = mat4.multiply(util.mat4AsArray(), this._proj, this._view);
    mat4.invert(this._inverse, this._transform);
    this.geoTrigger(geo_event.camera.view, {
      camera: this
    });
  };

  /**
   * Getter/setter for the view matrix.
   * @note copies the matrix value on set.
   * @property {mat4} view The view matrix.
   * @name geo.camera#view
   */
  Object.defineProperty(this, 'view', {
    get: function () {
      return this._view;
    },
    set: function (view) {
      mat4.copy(this._view, view);
      this._update();
    },
    configurable: true
  });

  /**
   * Getter/setter for the view bounds.
   *
   * @property {object} bounds The view bounds.
   * @property {number} bounds.left The left view bounds.
   * @property {number} bounds.top The top view bounds.
   * @property {number} bounds.right The right view bounds.
   * @property {number} bounds.bottom The bottom view bounds.
   * @name geo.camera#bounds
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
   * Getter/setter for the render clipbounds.  Opposite bounds must have
   * different values.  There are independent clipbounds for each projection
   * (parallel and perspective); switching the projection will switch to the
   * clipbounds.  Individual values of the clipbounds can be set either via a
   * command like `camera.clipbounds = {near: 3, far: 1}` or
   * `camera.clipbounds.near = 3`.  In the second example, no check is made to
   * ensure a non-zero volume clipbounds.
   *
   * @property {object} clipbounds The clipbounds for the current projection.
   * @name geo.camera#clipbounds
   */
  Object.defineProperty(this, 'clipbounds', {
    get: function () {
      return this._clipbounds[this._projection];
    },
    set: function (bounds) {
      var clipbounds = this._clipbounds[this._projection];
      bounds = {
        left: bounds.left === undefined ? clipbounds.left : bounds.left,
        right: bounds.right === undefined ? clipbounds.right : bounds.right,
        top: bounds.top === undefined ? clipbounds.top : bounds.top,
        bottom: bounds.bottom === undefined ? clipbounds.bottom : bounds.bottom,
        near: bounds.near === undefined ? clipbounds.near : bounds.near,
        far: bounds.far === undefined ? clipbounds.far : bounds.far
      };
      if (bounds.left === bounds.right) {
        throw new Error('Left and right values must be different');
      }
      if (bounds.top === bounds.bottom) {
        throw new Error('Top and bottom values must be different');
      }
      if (bounds.near === bounds.far) {
        throw new Error('Near and far values must be different');
      }
      this._clipbounds[this._projection] = bounds;
      this._createProj();
      this._update();
    }
  });

  /**
   * Getter for the "display" matrix.  This matrix converts from world
   * coordinates into display coordinates.  Read only.
   *
   * @property {mat4} display The display matrix.
   * @name geo.camera#display
   */
  Object.defineProperty(this, 'display', {
    get: function () {
      if (this._display === null) {
        var b = this._clipbounds[this._projection];
        var mat = util.mat4AsArray();
        mat4.translate(mat, mat, [
          this.viewport.width / 2,
          this.viewport.height / 2,
          0]);
        mat4.scale(mat, mat, [
          this.viewport.width / (b.right - b.left),
          this.viewport.height / (b.bottom - b.top),
          1]);
        mat4.translate(mat, mat, [
          -(b.left + b.right) / 2,
          -(b.top + b.bottom) / 2,
          0]);
        mat4.multiply(mat, mat, this._transform);
        this._display = mat;
      }
      return this._display;
    }
  });

  /**
   * Getter for the "world" matrix.  This matrix converts from display
   * coordinates into world coordinates.  This is the inverse of the "display"
   * matrix.  Read only.
   *
   * @property {mat4} world The world matrix.
   * @name geo.camera#world
   */
  Object.defineProperty(this, 'world', {
    get: function () {
      if (this._world === null) {
        this._world = mat4.invert(
          util.mat4AsArray(),
          this.display
        );
      }
      return this._world;
    }
  });

  /**
   * Getter/setter for the projection type.
   *
   * @property {string} projection The projection type.  One of `parallel` or
   *    `perspective`.
   * @name geo.camera#projection
   * @fires geo.event.camera.projection
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
        this.geoTrigger(geo_event.camera.projection, {
          camera: this,
          projection: type
        });
      }
    }
  });

  /**
   * Getter for the projection matrix.  Read only.
   *
   * @property {mat4} projectionMatrix The projection matrix.
   * @name geo.camera#projectionMatrix
   */
  Object.defineProperty(this, 'projectionMatrix', {
    get: function () {
      return this._proj;
    }
  });

  /**
   * Getter for the transform matrix.  This is the projection multiplied by the
   * view matrix.  Read only.
   *
   * @property {mat4} transform The transform matrix.
   * @name geo.camera#transform
   */
  Object.defineProperty(this, 'transform', {
    get: function () {
      return this._transform;
    }
  });

  /**
   * Getter for the inverse transform matrix.  Read only.
   *
   * @property {mat4} inverse The inverse transform matrix.
   * @name geo.camera#inverse
   */
  Object.defineProperty(this, 'inverse', {
    get: function () {
      return this._inverse;
    }
  });

  /**
   * Getter/setter for the viewport.
   *
   * The viewport consists of a width and height in pixels, plus a left and
   * top offset in pixels.  The offsets are only used to determine if pixel
   * alignment is possible.
   *
   * @property {object} viewport The viewport in pixels.
   * @property {number} viewport.width The viewport width in pixels.
   * @property {number} viewport.height The viewport height in pixels.
   * @property {number} viewport.top The viewport top in pixels.
   * @property {number} viewport.left The viewport left in pixels.
   * @name geo.camera#viewport
   * @fires geo.event.camera.viewport
   */
  Object.defineProperty(this, 'viewport', {
    get: function () {
      return {
        width: this._viewport.width,
        height: this._viewport.height,
        left: this._viewport.left,
        top: this._viewport.top
      };
    },
    set: function (viewport) {
      if (!(viewport.width > 0 &&
            viewport.height > 0)) {
        throw new Error('Invalid viewport dimensions');
      }
      if (viewport.width === this._viewport.width &&
          viewport.height === this._viewport.height) {
        return;
      }

      // apply scaling to the view matrix to account for the new aspect ratio
      // without changing the apparent zoom level
      if (this._viewport.width && this._viewport.height) {
        this._scale([
          this._viewport.width / viewport.width,
          this._viewport.height / viewport.height,
          1
        ]);

        // translate by half the difference to keep the center the same
        this._translate([
          (viewport.width - this._viewport.width) / 2,
          (viewport.height - this._viewport.height) / 2,
          0
        ]);
      }

      this._viewport = {
        width: viewport.width,
        height: viewport.height,
        left: viewport.left,
        top: viewport.top
      };
      this._update();
      this.geoTrigger(geo_event.camera.viewport, {
        camera: this,
        viewport: this.viewport
      });
    }
  });

  /**
   * Reset the view matrix to its initial (identity) state.
   * @protected
   * @returns {this} Chainable.
   */
  this._resetView = function () {
    mat4.identity(this._view);
    return this;
  };

  /**
   * Uses `mat4.translate` to translate the camera by the given vector amount.
   * @protected
   * @param {vec3|Array} offset The camera translation vector.
   * @returns {this} Chainable.
   */
  this._translate = function (offset) {
    mat4.translate(this._view, this._view, offset);
    return this;
  };

  /**
   * Uses `mat4.scale` to scale the camera by the given vector amount.
   * @protected
   * @param {vec3|Array} scale The scaling vector.
   * @returns {this} Chainable.
   */
  this._scale = function (scale) {
    mat4.scale(this._view, this._view, scale);
    return this;
  };

  /**
   * Project a vec4 from world space into clipped space [-1, 1] in place.
   * @protected
   * @param {vec4} point The point in world coordinates (mutated).
   * @returns {vec4} The point in clip space coordinates.
   */
  this._worldToClip4 = function (point) {
    return vec4.transformMat4(point, point, this._transform);
  };

  /**
   * Project a vec4 from clipped space into world space in place.
   * @protected
   * @param {vec4} point The point in clipped coordinates (mutated).
   * @returns {vec4} The point in world space coordinates.
   */
  this._clipToWorld4 = function (point) {
    return vec4.transformMat4(point, point, this._inverse);
  };

  /**
   * Apply the camera's projection transform to the given point.
   * @param {vec4} pt a point in clipped coordinates.
   * @returns {vec4} the point in normalized coordinates.
   */
  this.applyProjection = function (pt) {
    var w;
    if (this._projection === 'perspective') {
      w = 1 / (pt[3] || 1);
      pt[0] = w * pt[0];
      pt[1] = w * pt[1];
      pt[2] = w * pt[2];
      pt[3] = w;
    } else {
      pt[3] = 1;
    }
    return pt;
  };

  /**
   * Unapply the camera's projection transform from the given point.
   * @param {vec4} pt a point in normalized coordinates.
   * @returns {vec4} the point in clipped coordinates.
   */
  this.unapplyProjection = function (pt) {
    var w;
    if (this._projection === 'perspective') {
      w = pt[3] || 1;
      pt[0] = w * pt[0];
      pt[1] = w * pt[1];
      pt[2] = w * pt[2];
      pt[3] = w;
    } else {
      pt[3] = 1;
    }
    return pt;
  };

  /**
   * Project a vector from world space into viewport (display) space.  The
   * resulting vector always has the last component (`w`) equal to 1.
   *
   * @param {vec3|vec4} point The point in world coordinates.
   * @returns {vec4} The point in display coordinates.
   */
  this.worldToDisplay4 = function (point) {
    point = [point[0], point[1], point[2] || 0, point[3] || 1];
    point = vec4.transformMat4(point, point, this.display);
    if (point[3] && point[3] !== 1) {
      point = [point[0] / point[3], point[1] / point[3], point[2] / point[3], 1];
    }
    return point;
  };

  /**
   * Project a vector from viewport (display) space into world space.  The
   * resulting vector always has the last component (`w`) equal to 1.
   *
   * @param {vec3|vec4} point The point in display coordinates.
   * @returns {vec4} The point in world space coordinates.
   */
  this.displayToWorld4 = function (point) {
    point = [point[0], point[1], point[2] || 0, point[3] || 1];
    point = vec4.transformMat4(point, point, this.world);
    if (point[3] && point[3] !== 1) {
      point = [point[0] / point[3], point[1] / point[3], point[2] / point[3], 1];
    }
    return point;
  };

  /**
   * Project a 2D point object from world space into viewport space.  `z` is
   * set to `-this.clipbounds.near` to scale with the clip space.
   *
   * @param {object} point The point in world coordinates.
   * @param {number} point.x
   * @param {number} point.y
   * @returns {object} The point in display coordinates.
   */
  this.worldToDisplay = function (point) {
    var b = this._clipbounds[this._projection];
    point = this.worldToDisplay4([point.x, point.y, -b.near]);
    return {x: point[0], y: point[1]};
  };

  /**
   * Project a 2D point object from viewport space into world space.  `z` is
   * set to -1 to scale with the clip space.
   *
   * @param {object} point The point in display coordinates.
   * @param {number} point.x
   * @param {number} point.y
   * @returns {object} The point in world coordinates.
   */
  this.displayToWorld = function (point) {
    point = this.displayToWorld4([point.x, point.y, -1]);
    return {x: point[0], y: point[1]};
  };

  /**
   * Calculate the current bounds in world coordinates from the
   * current view matrix.  This computes a matrix vector multiplication
   * so the result is cached for public facing methods.
   *
   * @protected
   * @returns {object} bounds object.
   */
  this._getBounds = function () {
    var ul, ur, ll, lr, bds = {};

    // get corners
    ul = this.displayToWorld({x: 0, y: 0});
    ur = this.displayToWorld({x: this._viewport.width, y: 0});
    ll = this.displayToWorld({x: 0, y: this._viewport.height});
    lr = this.displayToWorld({x: this._viewport.width, y: this._viewport.height});

    bds.left = Math.min(ul.x, ur.x, ll.x, lr.x);
    bds.bottom = Math.min(ul.y, ur.y, ll.y, lr.y);
    bds.right = Math.max(ul.x, ur.x, ll.x, lr.x);
    bds.top = Math.max(ul.y, ur.y, ll.y, lr.y);

    return bds;
  };

  /**
   * Sets the view matrix so that the given world bounds
   * are in view.  To account for the viewport aspect ratio,
   * the resulting bounds may be larger in width or height than
   * the requested bound, but should be centered in the frame.
   *
   * @protected
   * @param {object} bounds
   * @param {number} bounds.left
   * @param {number} bounds.right
   * @param {number} bounds.bottom
   * @param {number} bounds.top
   * @param {number?} bounds.near Currently ignored.
   * @param {number?} bounds.far Currently ignored.
   * @returns {this} Chainable.
   */
  this._setBounds = function (bounds) {
    var size = {
      width: bounds.right - bounds.left,
      height: bounds.top - bounds.bottom
    };
    var center = {
      x: (bounds.left + bounds.right) / 2,
      y: (bounds.bottom + bounds.top) / 2
    };

    this._viewFromCenterSizeRotation(center, size, 0);
    return this;
  };

  /**
   * Sets the view matrix so that the given world center is centered, at
   * least a certain width and height are visible, and a rotation is applied.
   * The resulting bounds may be larger in width or height than the values if
   * the viewport is a different aspect ratio.
   *
   * @protected
   * @param {object} center Center of the view in gcs coordinates.
   * @param {number} center.x
   * @param {number} center.y
   * @param {object} size Minimum size of the view in gcs units.
   * @param {number} size.width
   * @param {number} size.height
   * @param {number} rotation in clockwise radians.  Optional.
   * @returns {this} Chainable.
   */
  this._viewFromCenterSizeRotation = function (center, size, rotation) {
    var translate = util.vec3AsArray(),
        scale = util.vec3AsArray(),
        c_ar, v_ar, w, h;

    // reset view to the identity
    this._resetView();

    w = Math.abs(size.width);
    h = Math.abs(size.height);
    c_ar = w / h;
    v_ar = this._viewport.width / this._viewport.height;

    if (c_ar >= v_ar) {
      // grow camera bounds vertically
      h = w / v_ar;
      scale[0] = 2 / w;
      scale[1] = 2 / h;
    } else {
      // grow bounds horizontally
      w = h * v_ar;
      scale[0] = 2 / w;
      scale[1] = 2 / h;
    }

    scale[2] = 1;
    this._scale(scale);

    if (rotation) {
      this._rotate(rotation);
    }

    // translate to the new center.
    translate[0] = -center.x;
    translate[1] = -center.y;
    translate[2] = 0;

    this._translate(translate);

    return this;
  };

  /**
   * Sets the view matrix so that the given world center is centered, at
   * least a certain width and height are visible, and a rotation is applied.
   * The resulting bounds may be larger in width or height than the values if
   * the viewport is a different aspect ratio.
   *
   * @param {object} center Center of the view in gcs coordinates.
   * @param {number} center.x
   * @param {number} center.y
   * @param {object} size Minimum size of the view in gcs units.
   * @param {number} size.width
   * @param {number} size.height
   * @param {number} rotation in clockwise radians.  Optional.
   * @returns {this} Chainable.
   */
  this.viewFromCenterSizeRotation = function (center, size, rotation) {
    this._viewFromCenterSizeRotation(center, size, rotation);
    this._update();
    return this;
  };

  /**
   * Pans the view matrix by the given amount.
   *
   * @param {object} offset The delta in world space coordinates.
   * @param {number} offset.x
   * @param {number} offset.y
   * @param {number} [offset.z]
   * @returns {this} Chainable.
   */
  this.pan = function (offset) {
    if (!offset.x && !offset.y && !offset.z) {
      return this;
    }
    this._translate([
      offset.x,
      offset.y,
      offset.z || 0
    ]);
    this._update();
    return this;
  };

  /**
   * Zooms the view matrix by the given amount.
   *
   * @param {number} zoom The zoom scale to apply
   * @returns {this} Chainable.
   */
  this.zoom = function (zoom) {
    if (zoom === 1) {
      return this;
    }
    mat4.scale(this._view, this._view, [
      zoom,
      zoom,
      zoom
    ]);
    this._update();
    return this;
  };

  /**
   * Rotate the view matrix by the given amount.
   *
   * @param {number} rotation Counter-clockwise rotation angle in radians.
   * @param {object} center Center of rotation in world space coordinates.
   * @param {vec3} [axis] axis of rotation.
   * @returns {this} Chainable.
   */
  this._rotate = function (rotation, center, axis) {
    if (!rotation) {
      return this;
    }
    axis = axis || [0, 0, -1];
    if (!center) {
      center = [0, 0, 0];
    } else if (center.x !== undefined) {
      center = [center.x || 0, center.y || 0, center.z || 0];
    }
    var invcenter = [-center[0], -center[1], -center[2]];
    mat4.translate(this._view, this._view, center);
    mat4.rotate(this._view, this._view, rotation, axis);
    mat4.translate(this._view, this._view, invcenter);
    return this;
  };

  /**
   * Returns a CSS transform that converts (by default) from world coordinates
   * into display coordinates.  This allows users of this module to position
   * elements using world coordinates directly inside DOM elements.  This
   * expects that the transform-origin is 0 0.
   *
   * @param {string} [transform] The transform to return.  One of
   *   `display` or `world`.
   * @returns {string} The css transform string.
   */
  this.css = function (transform) {
    var m;
    switch ((transform || '').toLowerCase()) {
      case 'display':
      case '':
        m = this.display;
        break;
      case 'world':
        m = this.world;
        break;
      default:
        throw new Error('Unknown transform ' + transform);
    }
    return camera.css(m);
  };

  /**
   * Represent a glmatrix as a pretty-printed string.
   * @param {mat4} mat A 4 x 4 matrix.
   * @param {number} [prec] The number of decimal places.
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
   * @returns {string} A string representation of the matrix.
   */
  this.toString = function () {
    return this.ppMatrix(this._transform);
  };

  /**
   * Return a debugging string of the current camera state.
   * @returns {string} A string with the camera state.
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
   * @returns {mat4} The transform matrix.
   */
  this.valueOf = function () {
    return this._transform;
  };

  this._clipbounds = this.constructor.clipbounds;
  // initialize the view matrix
  this._resetView();

  // set up the projection matrix
  this.projection = spec.projection || 'parallel';

  // initialize the viewport
  if (spec.viewport) {
    this.viewport = spec.viewport;
  }

  // trigger an initial update to set up the camera state
  this._update();

  return this;
};

/**
 * Supported projection types.
 * @enum {boolean}
 */
camera.projection = {
  perspective: true,
  parallel: true
};

/**
 * Default camera clipping bounds.  Some features and renderers may rely on the
 * far clip value being more positive than the near clip value.
 * @enum {number}
 */
camera.clipbounds = {
  perspective: {
    left: -1,
    right: 1,
    top: 1,
    bottom: -1,
    far: 2000,
    near: 0.01
  },
  parallel: {
    left: -1,
    right: 1,
    top: 1,
    bottom: -1,
    far: -1,
    near: 1
  }
};

/**
 * Output a mat4 as a css transform.  This expects that the transform-origin is
 * 0 0.
 *
 * @variation 2
 * @param {mat4} t A matrix transform.
 * @returns {string} A css transform string.
 */
camera.css = function (t) {
  return 'matrix3d(' +
      t.map(function (val) {
        /* Format each value with a certain precision, but don't use scientific
         * notation or keep needless trailing zeroes. */
        val = (+val).toPrecision(15);
        if (val.indexOf('e') >= 0) {
          val = (+val).toString();
        } else if (val.indexOf('.') >= 0) {
          val = val.replace(/(\.|)0+$/, '');
        }
        return val;
      }).join(',') +
    ')';
};

// expose the vector and matrix functions for convenience
camera.vec3 = vec3;
camera.mat3 = mat3;
camera.vec4 = vec4;
camera.mat4 = mat4;

inherit(camera, object);
module.exports = camera;
