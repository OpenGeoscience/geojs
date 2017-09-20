var $ = require('jquery');
var vgl = require('vgl');
var inherit = require('./inherit');
var sceneObject = require('./sceneObject');

/**
 * Creates a new map object.
 *
 * @class
 * @alias geo.map
 * @extends geo.sceneObject
 *
 * @param {object} arg Options object
 *
 * @param {string} arg.node DOM selector for the map container.
 *   *** Always required ***
 *
 * @param {string|geo.transform} [arg.gcs='EPSG:3857']
 *   The main coordinate system of the map (this is often web Mercator).
 *   * Required when using a domain/CS different from OSM *
 * @param {string|geo.transform} [arg.ingcs='EPSG:4326']
 *   The default coordinate system of interface calls (this is often latitude
 *   and longitude).
 * @param {number} [arg.unitsPerPixel=156543] GCS to pixel unit scaling at zoom
 *   0 (i.e. meters per pixel or degrees per pixel).
 * @param {object?} [arg.maxBounds] The maximum visible map bounds.
 * @param {number} [arg.maxBounds.left=-20037508] The left bound.
 * @param {number} [arg.maxBounds.right=20037508] The right bound.
 * @param {number} [arg.maxBounds.bottom=-20037508] The bottom bound.
 * @param {number} [arg.maxBounds.top=20037508] The top bound.
 *
 * @param {number} [arg.zoom=4] Initial zoom.
 * @param {object?} [arg.center] Initial map center.
 * @param {number} arg.center.x=0
 * @param {number} arg.center.y=0
 * @param {number} [arg.rotation=0] Initial clockwise rotation in radians.
 * @param {number?} [arg.width] The map width (default node width).
 * @param {number?} [arg.height] The map height (default node height).
 *
 * @param {number} [arg.min=0] Minimum zoom level (though fitting to the
 *   viewport may make it so this is smaller than the smallest possible value).
 * @param {number} [arg.max=16] Maximum zoom level.
 * @param {boolean} [arg.discreteZoom=false] If `true`, only allow integer zoom
 *   levels.  `false` for any zoom level.
 * @param {boolean|function} [arg.allowRotation=true] `false` prevents
 *   rotation, `true` allows any rotation.  If a function, the function is
 *   called with a rotation (angle in radians) and returns a valid rotation
 *   (this can be used to constrain the rotation to a range or specific to
 *   values).
 *
 * @param {geo.camera?} [arg.camera] The camera to control the view.
 * @param {geo.mapInteractor?} [arg.interactor] The UI event handler.  If
 *   `undefined`, a default interactor is created and used.  If `null`, no
 *   interactor is attached to the map.
 * @param {array} [arg.animationQueue] An array used to synchronize animations.
 *   If specified, this should be an empty array or the same array as passed to
 *   other map instances.
 * @param {boolean} [arg.autoResize=true] Adjust map size on window resize.
 * @param {boolean} [arg.clampBoundsX=false] Prevent panning outside of the
 *   maximum bounds in the horizontal direction.
 * @param {boolean} [arg.clampBoundsY=true] Prevent panning outside of the
 *   maximum bounds in the vertical direction.
 * @param {boolean} [arg.clampZoom=true] Prevent zooming out so that the map
 *   area is smaller than the window.
 *
 * @returns {geo.map}
 */
var map = function (arg) {
  'use strict';
  if (!(this instanceof map)) {
    return new map(arg);
  }
  arg = arg || {};

  if (arg.node === undefined || arg.node === null) {
    console.warn('map creation requires a node');
    return this;
  }

  sceneObject.call(this, arg);

  var camera = require('./camera');
  var transform = require('./transform');
  var util = require('./util');
  var registry = require('./registry');
  var geo_event = require('./event');
  var mapInteractor = require('./mapInteractor');
  var uiLayer = require('./ui/uiLayer');

  /**
   * Private member variables
   * @private
   */
  var m_this = this,
      s_exit = this._exit,
      // See https://en.wikipedia.org/wiki/Web_Mercator
      // phiMax = 180 / Math.PI * (2 * Math.atan(Math.exp(Math.PI)) - Math.PI / 2),
      m_node = $(arg.node),
      m_width = arg.width || m_node.width() || 512,
      m_height = arg.height || m_node.height() || 512,
      m_gcs = arg.gcs === undefined ? 'EPSG:3857' : arg.gcs,
      m_ingcs = arg.ingcs === undefined ? 'EPSG:4326' : arg.ingcs,
      m_center = {x: 0, y: 0},
      m_zoom = arg.zoom === undefined ? 4 : arg.zoom,
      m_rotation = 0,
      m_fileReader = null,
      m_interactor = null,
      m_validZoomRange = {min: 0, max: 16, origMin: 0},
      m_transition = null,
      m_queuedTransition = null,
      m_discreteZoom = arg.discreteZoom ? true : false,
      m_allowRotation = (typeof arg.allowRotation === 'function' ?
                         arg.allowRotation : (arg.allowRotation === undefined ?
                         true : !!arg.allowRotation)),
      m_maxBounds = arg.maxBounds || {},
      m_camera = arg.camera || camera(),
      m_unitsPerPixel,
      m_clampBoundsX,
      m_clampBoundsY,
      m_clampZoom,
      m_animationQueue = arg.animationQueue || [],
      m_autoResize = arg.autoResize === undefined ? true : arg.autoResize,
      m_origin;

  /* Compute the maximum bounds on our map projection.  By default, x ranges
   * from [-180, 180] in the interface projection, and y matches the x range in
   * the map (not the interface) projection.  For images, this might be
   * [0, width] and [0, height] instead. */
  var mcx = ((m_maxBounds.left || 0) + (m_maxBounds.right || 0)) / 2,
      mcy = ((m_maxBounds.bottom || 0) + (m_maxBounds.top || 0)) / 2;
  m_maxBounds.left = transform.transformCoordinates(m_ingcs, m_gcs, {
    x: m_maxBounds.left !== undefined ? m_maxBounds.left : -180, y: mcy
  }).x;
  m_maxBounds.right = transform.transformCoordinates(m_ingcs, m_gcs, {
    x: m_maxBounds.right !== undefined ? m_maxBounds.right : 180, y: mcy
  }).x;
  m_maxBounds.top = (m_maxBounds.top !== undefined ?
    transform.transformCoordinates(m_ingcs, m_gcs, {
      x: mcx, y: m_maxBounds.top}).y : m_maxBounds.right);
  m_maxBounds.bottom = (m_maxBounds.bottom !== undefined ?
    transform.transformCoordinates(m_ingcs, m_gcs, {
      x: mcx, y: m_maxBounds.bottom}).y : m_maxBounds.left);
  m_unitsPerPixel = (arg.unitsPerPixel || (
    m_maxBounds.right - m_maxBounds.left) / 256);

  m_camera.viewport = {
    width: m_width,
    height: m_height,
    left: m_node.offset().left,
    top: m_node.offset().top
  };
  arg.center = util.normalizeCoordinates(arg.center);
  m_clampBoundsX = arg.clampBoundsX === undefined ? false : arg.clampBoundsX;
  m_clampBoundsY = arg.clampBoundsY === undefined ? true : arg.clampBoundsY;
  m_clampZoom = arg.clampZoom === undefined ? true : arg.clampZoom;

  /**
   * Get/set the number of world space units per display pixel at the given
   * zoom level.
   *
   * @param {number} [zoom=0] The target zoom level.
   * @param {number?} [unit] If present, set the `unitsPerPixel` at the
   *   specified zoom level.  Otherwise return the current value.
   * @returns {number|this}
   */
  this.unitsPerPixel = function (zoom, unit) {
    zoom = zoom || 0;
    if (unit) {
      // get the units at level 0
      m_unitsPerPixel = Math.pow(2, zoom) * unit;

      // redraw all the things
      m_this.draw();
      return m_this;
    }
    return Math.pow(2, -zoom) * m_unitsPerPixel;
  };

  /**
   * Get/set the animation queue.  Two maps can share a single animation queue
   * to ensure synchronized animations.  When setting, the animation queue will
   * merge values from the existing queue into the new queue.
   *
   * @param {array} [queue] The animation queue to use.
   * @returns {array|this} The current animation queue or the current map.
   */
  this.animationQueue = function (queue) {
    if (queue === undefined) {
      return m_animationQueue;
    }
    if (queue !== m_animationQueue) {
      if (m_animationQueue.length) {
        /* If the specified queue already has data in, don't copy the 0th
         * element of the existing queue, since the 0th element is always the
         * actual requestAnimationFrame reference.  In this case, cancel the
         * existing requestAnimationFrame.  By using a property of window,
         * tests can override this if needed. */
        if (queue.length && queue[0] !== m_animationQueue[0]) {
          window['cancelAnimationFrame'](m_animationQueue[0]);
        }
        for (var i = queue.length ? 1 : 0; i < m_animationQueue.length; i += 1) {
          queue.push(m_animationQueue[i]);
        }
      }
      m_animationQueue = queue;
    }
    return this;
  };

  /**
   * Get/set the autoResize flag.
   *
   * @param {boolean} [autoResize] Truthy to automaticaly resize the map when
   *    the size of the browser window changes.
   * @returns {boolean|this} The current state of autoResize or the current map.
   */
  this.autoResize = function (autoResize) {
    if (autoResize === undefined) {
      return m_autoResize;
    }
    if (autoResize !== m_autoResize) {
      $(window).off('resize', resizeSelf);
      m_autoResize = autoResize;
      if (m_autoResize) {
        $(window).on('resize', resizeSelf);
      }
    }
    return this;
  };

  /**
   * Get/set the `clampBoundsX` setting.  If changed, adjust the bounds of the
   * map as needed.
   *
   * @param {boolean} [clamp] The new clamp value.
   * @returns {boolean|this}
   */
  this.clampBoundsX = function (clamp) {
    if (clamp === undefined) {
      return m_clampBoundsX;
    }
    if (clamp !== m_clampBoundsX) {
      m_clampBoundsX = !!clamp;
      m_this.pan({x: 0, y: 0});
    }
    return m_this;
  };

  /**
   * Get/set the `clampBoundsY` setting.  If changed, adjust the bounds of the
   * map as needed.
   *
   * @param {boolean} [clamp] The new clamp value.
   * @returns {boolean|this}
   */
  this.clampBoundsY = function (clamp) {
    if (clamp === undefined) {
      return m_clampBoundsY;
    }
    if (clamp !== m_clampBoundsY) {
      m_clampBoundsY = !!clamp;
      m_this.pan({x: 0, y: 0});
    }
    return m_this;
  };

  /**
   * Get/set the `clampZoom` setting.  If changed, adjust the bounds of the map
   * as needed.
   *
   * @param {boolean} [clamp] The new clamp value.
   * @returns {boolean|this}
   */
  this.clampZoom = function (clamp) {
    if (clamp === undefined) {
      return m_clampZoom;
    }
    if (clamp !== m_clampZoom) {
      m_clampZoom = !!clamp;
      reset_minimum_zoom();
      m_this.zoom(m_zoom);
    }
    return m_this;
  };

  /**
   * Get/set the `allowRotation` setting.  If changed, adjust the map as
   * needed.
   *
   * @param {boolean|function} [allowRotation] The new `allowRotation` value.
   *    `false` prevents rotation, `true` allows any rotation.  If a function,
   *    the function is called with a rotation (angle in radians) and returns a
   *    valid rotation (this can be used to constrain the rotation to a range
   *    or to specific values).
   * @returns {boolean|function|this}
   */
  this.allowRotation = function (allowRotation) {
    if (allowRotation === undefined) {
      return m_allowRotation;
    }
    if (typeof allowRotation !== 'function') {
      allowRotation = !!allowRotation;
    }
    if (allowRotation !== m_allowRotation) {
      m_allowRotation = allowRotation;
      m_this.rotation(m_rotation);
    }
    return m_this;
  };

  /**
   * Get the map's world coordinate origin in gcs coordinates.
   *
   * @returns {geo.geoPosition}
   */
  this.origin = function () {
    return $.extend({}, m_origin);
  };

  /**
   * Get the camera.
   *
   * @returns {geo.camera}
   */
  this.camera = function () {
    return m_camera;
  };

  /**
   * Get or set the map gcs.  This is the coordinate system used in drawing the
   * map.
   *
   * @param {string} [arg] If `undefined`, return the current gcs.  Otherwise,
   *    a new value for the gcs.
   * @returns {string|this} A string used by {@linkcode geo.transform}.
   */
  this.gcs = function (arg) {
    if (arg === undefined) {
      return m_gcs;
    }
    if (arg !== m_gcs) {
      var oldCenter = m_this.center(undefined, undefined);
      m_gcs = arg;
      reset_minimum_zoom();
      var newZoom = fix_zoom(m_zoom);
      if (newZoom !== m_zoom) {
        m_this.zoom(newZoom);
      }
      m_this.center(oldCenter, undefined);
    }
    return m_this;
  };

  /**
   * Get or set the map interface gcs.  This is the coordinate system used when
   * getting or setting map bounds, center, and other values.
   *
   * @param {string} [arg] If `undefined`, returtn the current interface gcs.
   *    Otherwise, a new value for the interface gcs.
   * @returns {string|this} A string used by {@linkcode geo.transform}.
   */
  this.ingcs = function (arg) {
    if (arg === undefined) {
      return m_ingcs;
    }
    m_ingcs = arg;
    return m_this;
  };

  /**
   * Get root DOM node of the map.
   *
   * @returns {object}
   */
  this.node = function () {
    return m_node;
  };

  /**
   * Get/Set zoom level of the map.
   *
   * @param {number} [val] If `undefined`, return the current zoom level.
   *    Otherwise, the new zoom level to set.
   * @param {object} [origin] If present, specifies the center of the zoom;
   *    otherwise the map's display center is used.
   * @param {geo.geoPosition} origin.geo The gcs coordinates of the zoom
   *    center.
   * @param {geo.screenPosition} origin.map The display coordinates of the zoom
   *    center.
   * @param {boolean} [ignoreDiscreteZoom] If `true`, ignore the discreteZoom
   *    option when determining the new view.
   * @returns {number|this}
   * @fires geo.event.zoom
   * @fires geo.event.pan
   */
  this.zoom = function (val, origin, ignoreDiscreteZoom) {
    if (val === undefined) {
      return m_zoom;
    }
    var evt, bounds;
    /* If we are zooming around a point, ignore the clamp bounds */
    var aroundPoint = (origin && (origin.mapgcs || origin.geo) && origin.map);
    var ignoreClampBounds = aroundPoint;

    /* The ignoreDiscreteZoom flag is intended to allow non-integer zoom values
     * during animation. */
    val = fix_zoom(val, ignoreDiscreteZoom);
    if (val === m_zoom) {
      return m_this;
    }

    m_zoom = val;

    bounds = m_this.boundsFromZoomAndCenter(
      val, m_center, m_rotation, null, ignoreDiscreteZoom, ignoreClampBounds);
    m_this.modified();

    camera_bounds(bounds, m_rotation);
    evt = {
      zoomLevel: m_zoom,
      screenPosition: origin ? origin.map : undefined
    };
    m_this.geoTrigger(geo_event.zoom, evt);

    if (aroundPoint) {
      var shifted = m_this.gcsToDisplay(origin.mapgcs || origin.geo,
                                        origin.mapgcs ? null : undefined);
      m_this.pan({x: origin.map.x - shifted.x, y: origin.map.y - shifted.y},
                 ignoreDiscreteZoom, true);
    } else {
      m_this.pan({x: 0, y: 0}, ignoreDiscreteZoom);
    }
    return m_this;
  };

  /**
   * Pan the map by a number of display pixels.
   *
   * @param {object} delta Amount to pan in display pixels.
   * @param {number} delta.x Horizontal distance on the display.
   * @param {number} delta.y Vertical distance on the display.
   * @param {boolean} [ignoreDiscreteZoom] If `true`, ignore the `discreteZoom`
   *    option when determining the new view.
   * @param {boolean|'limited'} [ignoreClampBounds] If `true` ignore the
   *    `clampBoundsX` and `clampBoundsY` options when determining the new
   *    view.  When `'limited'`, the `clampBoundsX` and `clampBoundsY` options
   *    are selectively enforced so that the map will not end up more out of
   *    bounds than its current state.
   * @returns {this}
   * @fires geo.event.pan
   */
  this.pan = function (delta, ignoreDiscreteZoom, ignoreClampBounds) {
    var evt = {
      screenDelta: delta
    };

    if (delta.x || delta.y) {
      var unit = m_this.unitsPerPixel(m_zoom);

      var sinr = Math.sin(m_rotation), cosr = Math.cos(m_rotation);
      m_camera.pan({
        x: (delta.x * cosr - (-delta.y) * sinr) * unit,
        y: (delta.x * sinr + (-delta.y) * cosr) * unit
      });
    }
    /* If m_clampBoundsX or m_clampBoundsY is true, clamp the pan */
    var bounds = m_camera.bounds;
    bounds = fix_bounds(bounds, m_rotation, ignoreClampBounds === 'limited' ? {
      x: delta.x, y: delta.y, unit: unit} : undefined,
      ignoreClampBounds === true);
    if (bounds !== m_camera.bounds) {
      var panPos = m_this.gcsToDisplay({
        x: m_camera.bounds.left, y: m_camera.bounds.top}, null);
      bounds = m_this.boundsFromZoomAndCenter(m_zoom, {
        x: (bounds.left + bounds.right) / 2,
        y: (bounds.top + bounds.bottom) / 2
      }, m_rotation, null, ignoreDiscreteZoom, true);
      camera_bounds(bounds, m_rotation);
      var clampPos = m_this.gcsToDisplay({
        x: m_camera.bounds.left, y: m_camera.bounds.top}, null);
      evt.screenDelta.x += clampPos.x - panPos.x;
      evt.screenDelta.y += clampPos.y - panPos.y;
    }

    m_center = m_camera.displayToWorld({
      x: m_width / 2,
      y: m_height / 2
    });

    m_this.geoTrigger(geo_event.pan, evt);

    m_this.modified();
    return m_this;
  };

  /**
   * Get/set the map rotation.  The rotation is performed around the current
   * view center.  Rotation mostly ignores `clampBoundsX`, as the behavior
   * feels peculiar otherwise.
   *
   * @param {number} rotation Absolute angle in radians (positive is
   *    clockwise).
   * @param {object} [origin] If specified, rotate about this origin.
   * @param {geo.geoPosition} origin.geo The gcs coordinates of the
   *    rotation center.
   * @param {geo.screenPosition} origin.map The display coordinates of the
   *    rotation center.
   * @param {boolean} [ignoreRotationFunc] If `true`, don't constrain the
   *    rotation.
   * @returns {number|this}
   * @fires geo.event.rotate
   * @fires geo.event.pan
   */
  this.rotation = function (rotation, origin, ignoreRotationFunc) {
    if (rotation === undefined) {
      return m_rotation;
    }
    var aroundPoint = (origin && origin.geo && origin.map);

    rotation = fix_rotation(rotation, ignoreRotationFunc);
    if (rotation === m_rotation) {
      return m_this;
    }
    m_rotation = rotation;

    var bounds = m_this.boundsFromZoomAndCenter(
        m_zoom, m_center, m_rotation, null, ignoreRotationFunc, true);
    m_this.modified();

    camera_bounds(bounds, m_rotation);

    var evt = {
      rotation: m_rotation,
      screenPosition: origin ? origin.map : undefined
    };

    m_this.geoTrigger(geo_event.rotate, evt);

    if (aroundPoint) {
      var shifted = m_this.gcsToDisplay(origin.geo);
      m_this.pan({x: origin.map.x - shifted.x, y: origin.map.y - shifted.y},
                 undefined, true);
    } else {
      m_this.pan({x: 0, y: 0}, undefined, true);
    }
    /* Changing the rotation can change our minimum zoom */
    reset_minimum_zoom();
    m_this.zoom(m_zoom, undefined, ignoreRotationFunc);
    return m_this;
  };

  /**
   * Set center of the map to the given geographic coordinates, or get the
   * current center.  Uses bare objects {x: 0, y: 0}.
   *
   * @param {geo.geoPosition} coordinates If specified, the new center of the
   *    map.
   * @param {string|geo.transform|null} [gcs] `undefined` to use the interface
   *    gcs, `null` to use the map gcs, or any other transform.  If setting the
   *    center, it is converted from this gcs to the map projection.  The
   *    returned center is converted from the map projection to this gcs.
   * @param {boolean} [ignoreDiscreteZoom] If `true`, ignore the `discreteZoom`
   *    option when determining the new view.
   * @param {boolean|'limited'} [ignoreClampBounds] If `true` ignore the
   *    `clampBoundsX` and `clampBoundsY` options when determining the new
   *    view.  When `'limited'`, the `clampBoundsX` and `clampBoundsY` options
   *    are selectively enforced so that the map will not end up more out of
   *    bounds than its current state.
   * @returns {geo.geoPosition|this}
   * @fires geo.event.pan
   */
  this.center = function (coordinates, gcs, ignoreDiscreteZoom,
                          ignoreClampBounds) {
    var center;
    if (coordinates === undefined) {
      center = $.extend({}, m_this.worldToGcs(m_center, gcs));
      return center;
    }

    // get the screen coordinates of the new center
    center = m_this.gcsToWorld(coordinates, gcs);

    camera_bounds(m_this.boundsFromZoomAndCenter(
        m_zoom, center, m_rotation, null, ignoreDiscreteZoom,
        ignoreClampBounds), m_rotation);
    m_this.modified();
    // trigger a pan event
    m_this.geoTrigger(geo_event.pan, {
      screenDelta: {x: 0, y: 0}
    });
    return m_this;
  };

  /**
   * Add a layer to the map.
   *
   * @param {string} layerName The type of layer to add to the map.
   * @param {object} arg Parameters for the new layer.
   * @returns {geo.layer}
   * @fires geo.event.layerAdd
   */
  this.createLayer = function (layerName, arg) {
    arg = arg || {};
    var newLayer = registry.createLayer(
      layerName, m_this, arg);

    if (newLayer) {
      m_this.addChild(newLayer);
      m_this.children().forEach(function (c) {
        if (c instanceof uiLayer) {
          c.moveToTop();
        }
      });
      newLayer._update();
      m_this.modified();

      m_this.geoTrigger(geo_event.layerAdd, {
        target: m_this,
        layer: newLayer
      });
    }

    return newLayer;
  };

  /**
   * Remove a layer from the map.
   *
   * @param {geo.layer?} layer Layer to remove from the map.
   * @returns {geo.layer}
   * @fires geo.event.layerRemove
   */
  this.deleteLayer = function (layer) {

    if (layer !== null && layer !== undefined) {
      layer._exit();
      m_this.removeChild(layer);

      m_this.modified();

      m_this.geoTrigger(geo_event.layerRemove, {
        target: m_this,
        layer: layer
      });
    }

    // Return deleted layer (similar to createLayer) as in the future
    // we may provide extension of this method to support deletion of
    // layer using id or some sort.
    return layer;
  };

  /**
   * Get or set the size of the map.
   *
   * @param {geo.screenSize} [arg] Size in pixels.
   * @returns {geo.screenSize|this} The size in pixels or the map object.
   */
  this.size = function (arg) {
    if (arg === undefined) {
      return {
        width: m_width,
        height: m_height
      };
    }
    // store the original center and restore it after the resize
    var oldCenter = m_this.center();
    m_width = arg.width || m_width;
    m_height = arg.height || m_height;

    reset_minimum_zoom();
    var newZoom = fix_zoom(m_zoom);
    if (newZoom !== m_zoom) {
      m_this.zoom(newZoom);
    }
    m_this.camera().viewport = {
      width: m_width,
      height: m_height,
      left: m_node.offset().left,
      top: m_node.offset().top
    };
    m_this.center(oldCenter);

    m_this.geoTrigger(geo_event.resize, {
      target: m_this,
      width: m_width,
      height: m_height
    });

    m_this.modified();
    return m_this;
  };

  /**
   * Get the rotated size of the map.  This is the width and height of the
   * non-rotated area necessary to enclose the rotated area in pixels.
   *
   * @returns {geo.screenSize} The size that fits the rotated map.
   */
  this.rotatedSize = function () {
    if (!this.rotation()) {
      return {
        width: m_width,
        height: m_height
      };
    }
    var bds = rotate_bounds_center(
        {x: 0, y: 0}, {width: m_width, height: m_height}, this.rotation());
    return {
      width: Math.abs(bds.right - bds.left),
      height: Math.abs(bds.top - bds.bottom)
    };
  };

  /**
   * Convert from gcs coordinates to map world coordinates.
   *
   * @param {geo.geoPosition} c The input coordinate to convert.
   * @param {string|geo.transform|null} [gcs] Input gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {geo.worldPosition} World space coordinates.
   */
  this.gcsToWorld = function (c, gcs) {
    gcs = (gcs === null ? m_gcs : (gcs === undefined ? m_ingcs : gcs));
    if (gcs !== m_gcs) {
      c = transform.transformCoordinates(gcs, m_gcs, c);
    }
    if (m_origin.x || m_origin.y || m_origin.z) {
      c = transform.affineForward(
        {origin: m_origin},
        [c]
      )[0];
    } else if (!('z' in c)) {
      c = {x: c.x, y: c.y, z: 0};
    }
    return c;
  };

  /**
   * Convert from map world coordinates to gcs coordinates.
   *
   * @param {geo.worldPosition} c The input coordinate to convert.
   * @param {string|geo.transform|null} [gcs] output gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {geo.geoPosition} GCS space coordinates.
   */
  this.worldToGcs = function (c, gcs) {
    if (m_origin.x || m_origin.y || m_origin.z) {
      c = transform.affineInverse(
        {origin: m_origin},
        [c]
      )[0];
    } else if (!('z' in c)) {
      c = {x: c.x, y: c.y, z: 0};
    }
    gcs = (gcs === null ? m_gcs : (gcs === undefined ? m_ingcs : gcs));
    if (gcs !== m_gcs) {
      c = transform.transformCoordinates(m_gcs, gcs, c);
    }
    return c;
  };

  /**
   * Convert from gcs coordinates to display coordinates.  This is identical to
   * calling `gcsToWorld` and then `worldToDisplay`.
   *
   * @param {geo.geoPosition} c The input coordinate to convert.
   * @param {string|geo.transform|null} [gcs] Input gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {geo.screenPosition} Display space coordinates.
   */
  this.gcsToDisplay = function (c, gcs) {
    c = m_this.gcsToWorld(c, gcs);
    return m_this.worldToDisplay(c);
  };

  /**
   * Convert from world coordinates to display coordinates using the attached
   * camera.
   *
   * @param {geo.worldPosition} c The input coordinate to convert.
   * @returns {geo.screenPosition} Display space coordinates.
   */
  this.worldToDisplay = function (c) {
    return m_camera.worldToDisplay(c);
  };

  /**
   * Convert from display to gcs coordinates.  This is identical to calling
   * `displayToWorld` and then `worldToGcs`.
   *
   * @param {geo.screenPosition} c The input display coordinate to convert.
   * @param {string|geo.transform|null} [gcs] Output gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {geo.geoPosition} GCS space coordinates.
   */
  this.displayToGcs = function (c, gcs) {
    c = m_this.displayToWorld(c); // done via camera
    return m_this.worldToGcs(c, gcs);
  };

  /**
   * Convert from display coordinates to world coordinates using the attached
   * camera.
   *
   * @param {geo.screenPosition} c The input coordinate to convert.
   * @returns {geo.worldPosition} World space coordinates.
   */
  this.displayToWorld = function (c) {
    return m_camera.displayToWorld(c);
  };

  /**
   * Redraw the map and all its layers.
   *
   * @returns {this} The map object.
   * @fires geo.event.draw
   * @fires geo.event.drawEnd
   */
  this.draw = function () {
    var i, layers = m_this.children();

    m_this.geoTrigger(geo_event.draw, {
      target: m_this
    });

    m_this._update();

    for (i = 0; i < layers.length; i += 1) {
      layers[i].draw();
    }

    m_this.geoTrigger(geo_event.drawEnd, {
      target: m_this
    });

    return m_this;
  };

  /**
   * Get, set, or create and set a file reader to a layer in the map to be used
   * as a drop target.
   *
   * @param {string|object} [readerOrName] `undefined` to get the current
   *    reader, an instance of a file reader to set the reader, or a name to
   *    create a file reader.
   * @param {object} [opts] options Parameters for creating a file reader when
   *    the reader is specified by name.  If this includes `layer`, use that
   *    layer, otherwise create a layer using these options.
   * @returns {geo.fileReader|this}
   */
  this.fileReader = function (readerOrName, opts) {
    if (readerOrName === undefined) {
      return m_fileReader;
    }
    if (typeof readerOrName === 'string') {
      opts = opts || {};
      if (!opts.layer) {
        opts.layer = m_this.createLayer('feature', $.extend({}, opts));
      }
      opts.renderer = opts.layer.renderer().api();
      m_fileReader = registry.createFileReader(readerOrName, opts);
    } else {
      m_fileReader = readerOrName;
    }
    return m_this;
  };

  /**
   * Initialize the map.
   *
   * @returns {this} The map object.
   */
  this._init = function () {

    if (m_node === undefined || m_node === null) {
      throw new Error('Map require DIV node');
    }

    if (m_node.data('data-geojs-map') && $.isFunction(m_node.data('data-geojs-map').exit)) {
      m_node.data('data-geojs-map').exit();
    }
    m_node.addClass('geojs-map');
    m_node.data('data-geojs-map', m_this);
    return m_this;
  };

  /**
   * Update map.  This updates all layers of the map.
   *
   * @param {object} [request] Optional information about the source of this
   *    update request.  This could be an event, for instance.  It is passed
   *    to individual layer's `_update` function.
   * @returns {this} The map object.
   */
  this._update = function (request) {
    var i, layers = m_this.children();
    for (i = 0; i < layers.length; i += 1) {
      layers[i]._update(request);
    }
    return m_this;
  };

  /**
   * Exit this map.  This removes all layers, destroys current interactor, and
   * empties the associated DOM node.
   */
  this.exit = function () {
    var i, layers = m_this.children();
    for (i = layers.length - 1; i >= 0; i -= 1) {
      layers[i]._exit();
      m_this.removeChild(layers[i]);
    }
    if (m_this.interactor()) {
      m_this.interactor().destroy();
      m_this.interactor(null);
    }
    m_this.node().data('data-geojs-map', null);
    m_this.node().off('.geo');
    /* make sure the map node has nothing left in it */
    m_this.node().empty();
    $(window).off('resize', resizeSelf);
    s_exit();
  };

  /**
   * Get or set the map interactor.
   *
   * @param {geo.mapInteractor} [arg] If specified, the map interactor to set.
   * @returns {geo.mapInteractor|this} The current map interactor or the map
   *    object.
   */
  this.interactor = function (arg) {
    if (arg === undefined) {
      return m_interactor;
    }
    if (m_interactor && m_interactor !== arg) {
      m_interactor.destroy();
    }
    m_interactor = arg;

    // this makes it possible to set a null interactor
    // i.e. map.interactor(null);
    if (m_interactor) {
      /* If we set a map interactor, make sure we have a tabindex */
      if (!m_node.attr('tabindex')) {
        m_node.attr('tabindex', 0);
      }
      m_interactor.map(m_this);
    }
    return m_this;
  };

  /**
   * Get or set the min/max zoom range.
   *
   * @param {object} [arg] The zoom range.
   * @param {number} [arg.min] The minimum zoom level.
   * @param {number} [arg.max] The maximum zoom level.
   * @param {boolean} [noRefresh] If `true`, don't update the map if the zoom
   *    level has changed.
   * @returns {object|this} The current zoom range or the map object.  The
   *    `min` value is the minimum value that the map can go to based on the
   *    current dimensions and settings, the `origMin` value is the value that
   *    was specified via this function or when the map was created.
   */
  this.zoomRange = function (arg, noRefresh) {
    if (arg === undefined) {
      return $.extend({}, m_validZoomRange);
    }
    if (arg.max !== undefined) {
      m_validZoomRange.max = arg.max;
    }
    if (arg.min !== undefined) {
      m_validZoomRange.min = m_validZoomRange.origMin = arg.min;
    }
    reset_minimum_zoom();
    if (!noRefresh) {
      m_this.zoom(m_zoom);
    }
    return m_this;
  };

  /**
   * Get the current transition or start an animated zoom/pan/rotate.  If a
   * second transition is requested while a transition is already in progress,
   * a new transition is created that is functionally from wherever the map has
   * moved to (possibly partway through the first transition) going to the end
   * point of the new transition.
   *
   * @param {object} [opts] Options for a transition, or `undefined` to get the
   *    current transition.
   * @param {geo.geoPosition} [opts.center] A new map center.
   * @param {number} [opts.zoom] A new map zoom level.
   * @param {geo.geoPosition} [opts.zoomOrigin] An origin to use when zooming
   *    to a new zoom level.
   * @param {number} [opts.rotation] A new map rotation.
   * @param {number} [opts.duration=1000] Transition duration in milliseconds.
   * @param {function} [opts.ease] Easing function for the transition.  This is
   *    in the style of a d3 easing function.
   * @param {function} [opts.interp] Function to use when interpolating
   *    between values.  This gets passed two arrays, the start and end values
   *    for [`x`, `y`, `z` or `zoom`, `rotation`], and returns a function that,
   *    when passed a time value returns an array of the interpolated [`x`,
   *    `y`, `z` or `zoom`, `rotation`] values.
   * @param {boolean} [opts.zCoord] If `true`, convert zoom values to z values
   *    for interpolation.
   * @param {function} [opts.done] If specified, call this function when a
   *    transition completes.  The function is called with an object that
   *    contains `cancel`: a boolean if the transition was canceled, `source`:
   *    a value based on what canceled a transition, `transition`: the current
   *    transition that just completed, `next`: a boolean if another transition
   *    follows immediately.
   * @param {string|geo.transform|null} [gcs] Input gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   *    Applies only to `opts.center` and to converting zoom values to height,
   *    if specified.
   * @param {number} [animTime] The animation frame time (from a
   *    `window.requestAnimationFrame` callback).  Used if a new transition is
   *    requested because the current transition has completed to keep things
   *    synchronized.
   * @returns {geo.map}
   * @fires geo.event.transitionstart
   * @fires geo.event.transitionend
   * @fires geo.event.transitioncancel
   */
  this.transition = function (opts, gcs, animTime) {

    if (opts === undefined) {
      return m_transition;
    }

    if (m_transition) {
      /* The queued transition needs to combine the current transition's
       * endpoint, any other queued transition, and the new transition to be
       * complete. */
      var transitionEnd = $.extend(true, {}, m_transition.end);
      if (transitionEnd.center && m_gcs !== m_ingcs) {
        transitionEnd.center = transform.transformCoordinates(
          m_gcs, m_ingcs, transitionEnd.center);
      }
      m_queuedTransition = $.extend(
        {}, transitionEnd || {}, m_queuedTransition || {}, opts);
      return m_this;
    }

    /* Basic linear interpolation between two values. */
    function interp1(p0, p1, t) {
      return p0 + (p1 - p0) * t;
    }
    /**
     * Generate an interpolation function that interpolates all array entries.
     *
     * @param {array} p0 An array of numbers to interpolate from.
     * @param {array} p1 An array of numbers to interpolate to.
     * @returns {function} A function that, given `t`, returns an array of
     *      interpolated values.
     * @private
     */
    function defaultInterp(p0, p1) {
      return function (t) {
        var result = [];
        $.each(p0, function (idx) {
          result.push(interp1(p0[idx], p1[idx], t));
        });
        return result;
      };
    }

    var units = m_this.unitsPerPixel(0);

    // Transform zoom level into z-coordinate and inverse.
    function zoom2z(z) {
      return vgl.zoomToHeight(z + 1, m_width, m_height) * units;
    }
    function z2zoom(z) {
      return vgl.heightToZoom(z / units, m_width, m_height) - 1;
    }

    var defaultOpts = {
      center: undefined,
      zoom: m_this.zoom(),
      rotation: m_this.rotation(),
      duration: 1000,
      ease: function (t) {
        return t;
      },
      interp: defaultInterp,
      done: null,
      zCoord: true
    };

    if (opts.center) {
      gcs = (gcs === null ? m_gcs : (gcs === undefined ? m_ingcs : gcs));
      opts = $.extend(true, {}, opts);
      opts.center = util.normalizeCoordinates(opts.center);
      if (gcs !== m_gcs) {
        opts.center = transform.transformCoordinates(gcs, m_gcs, opts.center);
      }
    }
    opts = $.extend(true, {}, defaultOpts, opts);

    m_transition = {
      start: {
        center: m_this.center(undefined, null),
        zoom: m_this.zoom(),
        rotation: m_this.rotation()
      },
      end: {
        center: opts.center,
        zoom: fix_zoom(opts.zoom),
        rotation: fix_rotation(opts.rotation, undefined, true)
      },
      ease: opts.ease,
      zCoord: opts.zCoord,
      done: opts.done,
      duration: opts.duration,
      zoomOrigin: opts.zoomOrigin
    };

    m_transition.interp = opts.interp([
      m_transition.start.center.x,
      m_transition.start.center.y,
      opts.zCoord ? zoom2z(m_transition.start.zoom) : m_transition.start.zoom,
      m_transition.start.rotation
    ], [
      m_transition.end.center ? m_transition.end.center.x : m_transition.start.center.x,
      m_transition.end.center ? m_transition.end.center.y : m_transition.start.center.y,
      opts.zCoord ? zoom2z(m_transition.end.zoom) : m_transition.end.zoom,
      m_transition.end.rotation
    ]);

    /**
     * Process an animation from during a transition.
     *
     * @param {number} time The animation frame time.  Used to ensure multiple
     *      transitions are smooth.
     * @private
     */
    function anim(time) {
      var done = m_transition.done,
          next = m_queuedTransition;
      if (m_transition.cancel === true) {
        /* Finish cancelling a transition. */
        m_this.geoTrigger(geo_event.transitioncancel, opts);
        if (done) {
          done({
            cancel: true,
            source: m_transition.cancelSource,
            transition: m_transition
          });
        }
        m_transition = null;
        /* There will only be a queuedTransition if it was created after this
         * transition was cancelled */
        if (m_queuedTransition) {
          next = m_queuedTransition;
          m_queuedTransition = null;
          m_this.transition(next, undefined, time);
        }
        return;
      }

      if (!m_transition.start.time) {
        m_transition.start.time = time;
        m_transition.end.time = time + opts.duration;
      }
      m_transition.time = time - m_transition.start.time;
      if (time >= m_transition.end.time || next) {
        if (!next) {
          if (m_transition.end.center) {
            var needZoom = m_zoom !== fix_zoom(m_transition.end.zoom);
            m_this.center(m_transition.end.center, null, needZoom, needZoom);
          }
          m_this.zoom(m_transition.end.zoom, m_transition.zoomOrigin);
          m_this.rotation(fix_rotation(m_transition.end.rotation));
        }

        m_this.geoTrigger(geo_event.transitionend, opts);

        if (done) {
          done({next: !!next});
        }

        m_transition = null;
        if (m_queuedTransition) {
          next = m_queuedTransition;
          m_queuedTransition = null;
          m_this.transition(next, undefined, time);
        }

        return;
      }

      var z = m_transition.ease(
        (time - m_transition.start.time) / opts.duration
      );

      var p = m_transition.interp(z);
      if (m_transition.zCoord) {
        p[2] = z2zoom(p[2]);
      }
      if (fix_zoom(p[2], true) === m_zoom) {
        m_this.center({
          x: p[0],
          y: p[1]
        }, null, true, true);
      } else {
        m_center = m_this.gcsToWorld({x: p[0], y: p[1]}, null, true, true);
        m_this.zoom(p[2], m_transition.zoomOrigin, true);
      }
      m_this.rotation(p[3], undefined, true);

      m_this.scheduleAnimationFrame(anim);
    }

    m_this.geoTrigger(geo_event.transitionstart, opts);

    if (geo_event.cancelNavigation) {
      m_transition = null;
      m_this.geoTrigger(geo_event.transitionend, opts);
      return m_this;
    } else if (geo_event.cancelAnimation) {
      // run the navigation synchronously
      opts.duration = 0;
      anim(0);
    } else if (animTime) {
      anim(animTime);
    } else {
      m_this.scheduleAnimationFrame(anim);
    }
    return m_this;
  };

  /**
   * Cancel any existing transition.  The transition will send a cancel event
   * at the next animation frame, but no further activity occurs.
   *
   * @param {string} [source] Optional cause of the cancel.  This can be any
   *    value, but something like `(method name).(action)` is recommended to
   *    allow other functions to determine the source and cause of the
   *    transition being canceled.
   * @returns {boolean} `true` if a transition was in progress.
   * @fires geo.event.transitioncancel
   */
  this.transitionCancel = function (source) {
    if (m_transition && (m_transition.cancel !== true || m_queuedTransition)) {
      m_transition.cancel = true;
      m_transition.cancelSource = source || m_transition.cancelSource || '';
      m_queuedTransition = null;
      return true;
    }
    return false;
  };

  /**
   * Get/set the locations of the current map edges.  When set, the left-top
   * and right-bottom corners are transformed to the map's gcs and then used
   * to set the bounds.
   *
   * @param {geo.geoBounds} [bds] The requested map bounds.
   * @param {string|geo.transform|null} [gcs] `undefined` to use the interface
   *    gcs, `null` to use the map gcs, or any other transform.  If setting the
   *    bounds, they are converted from this gcs to the map projection.  The
   *    returned bounds are converted from the map projection to this gcs.
   * @returns {geo.geoBounds} The actual new map bounds.
   */
  this.bounds = function (bds, gcs) {
    var nav;

    gcs = (gcs === null ? m_gcs : (gcs === undefined ? m_ingcs : gcs));
    if (bds !== undefined) {
      if (gcs !== m_gcs) {
        var trans = transform.transformCoordinates(gcs, m_gcs, [{
          x: bds.left, y: bds.top}, {x: bds.right, y: bds.bottom}]);
        bds = {
          left: trans[0].x,
          top: trans[0].y,
          right: trans[1].x,
          bottom: trans[1].y
        };
      }
      bds = fix_bounds(bds, m_rotation);
      nav = m_this.zoomAndCenterFromBounds(bds, m_rotation, null);

      // This might have consequences in terms of bounds/zoom clamping.
      // What behavior do we expect from this method in that case?
      m_this.zoom(nav.zoom);
      m_this.center(nav.center, null);
    }

    return m_this.boundsFromZoomAndCenter(m_zoom, m_center, m_rotation, gcs,
                                          true);
  };

  /**
   * Get/set the maximum view area of the map.  If the map wraps, this is the
   * unwrapped area.
   *
   * @param {geo.geoBounds} [bounds] The map bounds.
   * @param {string|geo.transform|null} [gcs] `undefined` to use the interface
   *    gcs, `null` to use the map gcs, or any other transform.  If setting the
   *    bounds, they are converted from this gcs to the map projection.  The
   *    returned bounds are converted from the map projection to this gcs.
   * @returns {geo.geoBounds|this} The map maximum bounds or the map object.
   */
  this.maxBounds = function (bounds, gcs) {
    gcs = (gcs === null ? m_gcs : (gcs === undefined ? m_ingcs : gcs));
    if (bounds === undefined) {
      return {
        left: transform.transformCoordinates(m_gcs, gcs, {
          x: m_maxBounds.left, y: 0}).x,
        right: transform.transformCoordinates(m_gcs, gcs, {
          x: m_maxBounds.right, y: 0}).x,
        bottom: transform.transformCoordinates(m_gcs, gcs, {
          x: 0, y: m_maxBounds.bottom}).y,
        top: transform.transformCoordinates(m_gcs, gcs, {
          x: 0, y: m_maxBounds.top}).y
      };
    }
    var cx = ((bounds.left || 0) + (bounds.right || 0)) / 2,
        cy = ((bounds.bottom || 0) + (bounds.top || 0)) / 2;
    if (bounds.left !== undefined) {
      m_maxBounds.left = transform.transformCoordinates(gcs, m_gcs, {
        x: bounds.left, y: cy}).x;
    }
    if (bounds.right !== undefined) {
      m_maxBounds.right = transform.transformCoordinates(gcs, m_gcs, {
        x: bounds.right, y: cy}).x;
    }
    if (bounds.bottom !== undefined) {
      m_maxBounds.bottom = transform.transformCoordinates(gcs, m_gcs, {
        x: cx, y: bounds.bottom}).y;
    }
    if (bounds.top !== undefined) {
      m_maxBounds.top = transform.transformCoordinates(gcs, m_gcs, {
        x: cx, y: bounds.top}).y;
    }
    reset_minimum_zoom();
    m_this.zoom(m_zoom);
    m_this.pan({x: 0, y: 0});
    return this;
  };

  /**
   * Get the center zoom level necessary to display the given bounds.
   *
   * @param {geo.geoBounds} bounds The requested map bounds.  `right` must be
   *    greater than `left` and `bottom` must be greater than `top` in the
   *    map's gcs (after conversion from the provided gcs).
   * @param {number} rotation Rotation in clockwise radians.
   * @param {string|geo.transform|null} [gcs] `undefined` to use the interface
   *    gcs, `null` to use the map gcs, or any other transform.
   * @returns {geo.zoomAndCenter}
   */
  this.zoomAndCenterFromBounds = function (bounds, rotation, gcs) {
    var center, zoom;

    gcs = (gcs === null ? m_gcs : (gcs === undefined ? m_ingcs : gcs));
    if (gcs !== m_gcs) {
      var trans = transform.transformCoordinates(gcs, m_gcs, [{
        x: bounds.left, y: bounds.top}, {x: bounds.right, y: bounds.bottom}]);
      bounds = {
        left: trans[0].x,
        top: trans[0].y,
        right: trans[1].x,
        bottom: trans[1].y
      };
    }
    if (bounds.left >= bounds.right || bounds.bottom >= bounds.top) {
      throw new Error('Invalid bounds provided');
    }

    // calculate the zoom to fit the bounds
    zoom = fix_zoom(calculate_zoom(bounds, rotation));

    // clamp bounds if necessary
    bounds = fix_bounds(bounds, rotation);

    /* This relies on having the map projection coordinates be uniform
     * regardless of location.  If not, the center will not be correct. */
    // calculate new center
    center = {
      x: (bounds.left + bounds.right) / 2 - m_origin.x,
      y: (bounds.top + bounds.bottom) / 2 - m_origin.y
    };
    if (gcs !== m_gcs) {
      center = transform.transformCoordinates(m_gcs, gcs, center);
    }
    return {
      zoom: zoom,
      center: center
    };
  };

  /**
   * Get the bounds that will be displayed with the given zoom and center.
   *
   * Note: the bounds may not have the requested zoom and center due to map
   * restrictions.
   *
   * @param {number} zoom The requested zoom level.
   * @param {geo.geoPosition} center The requested center.
   * @param {number} rotation The requested rotation in clockwise radians.
   * @param {string|geo.transform|null} [gcs] `undefined` to use the interface
   *    gcs, `null` to use the map gcs, or any other transform.
   * @param {boolean} ignoreDiscreteZoom If `true`, ignore the `discreteZoom`
   *    option when determining the new view.
   * @param {boolean} [ignoreClampBounds] If `true` and `clampBoundsX` or
   *    `clampBoundsY` is set, allow the bounds to be less clamped.
   *    The map's `maxBounds` can be shifted so that they lie no further than
   *    the center of the bounds (rather than being forced to be at the edge).
   * @returns {geo.geoBounds}
   */
  this.boundsFromZoomAndCenter = function (zoom, center, rotation, gcs,
        ignoreDiscreteZoom, ignoreClampBounds) {
    var width, height, halfw, halfh, bounds, units;

    gcs = (gcs === null ? m_gcs : (gcs === undefined ? m_ingcs : gcs));
    // preprocess the arguments
    zoom = fix_zoom(zoom, ignoreDiscreteZoom);
    units = m_this.unitsPerPixel(zoom);
    center = m_this.gcsToWorld(center, null);

    // get half the width and height in world coordinates
    width = m_width * units;
    height = m_height * units;
    halfw = width / 2;
    halfh = height / 2;

    // calculate the bounds.  This is only valid if the map projection has
    // uniform units in each direction.  If not, then worldToGcs should be
    // used.

    if (rotation) {
      center.x += m_origin.x;
      center.y += m_origin.y;
      bounds = rotate_bounds_center(
        center, {width: width, height: height}, rotation);
      // correct the bounds when clamping is enabled
      bounds.width = width;
      bounds.height = height;
      bounds = fix_bounds(bounds, rotation, undefined, ignoreClampBounds);
    } else {
      bounds = {
        left: center.x - halfw + m_origin.x,
        right: center.x + halfw + m_origin.x,
        bottom: center.y - halfh + m_origin.y,
        top: center.y + halfh + m_origin.y
      };
      // correct the bounds when clamping is enabled
      bounds = fix_bounds(bounds, 0, undefined, ignoreClampBounds);
    }
    if (gcs !== m_gcs) {
      var bds = transform.transformCoordinates(
        m_gcs, gcs,
        [[bounds.left, bounds.top], [bounds.right, bounds.bottom]]);
      bounds = {
        left: bds[0][0], top: bds[0][1], right: bds[1][0], bottom: bds[1][1]
      };
    }
    /* Add the original width and height of the viewport before rotation. */
    bounds.width = width;
    bounds.height = height;
    return bounds;
  };

  /**
   * Get/set the discrete zoom flag.  If `true`, the map will snap to integer
   * zoom levels.
   *
   * @param {boolean} [discreteZoom] If specified, the new discrete zoom flag.
   * @returns {boolean|this} The current discrete zoom flag or the map object.
   */
  this.discreteZoom = function (discreteZoom) {
    if (discreteZoom === undefined) {
      return m_discreteZoom;
    }
    discreteZoom = discreteZoom ? true : false;
    if (m_discreteZoom !== discreteZoom) {
      m_discreteZoom = discreteZoom;
      if (m_discreteZoom) {
        m_this.zoom(Math.round(m_this.zoom()));
      }
      m_this.interactor().options({discreteZoom: m_discreteZoom});
    }
    return m_this;
  };

  /**
   * Get the layers contained in the map.
   * Alias of {@linkcode geo.sceneObject#children}.
   * @method
   */
  this.layers = this.children;

  /**
   * Update the attribution notice displayed on the bottom right corner of
   * the map.  The content of this notice is managed by individual layers.
   * This method queries all of the visible layers and joins the individual
   * attribution notices into a single element.  By default, this method
   * is called on each of the following events:
   *
   *   * geo.event.layerAdd
   *   * geo.event.layerRemove
   *
   * In addition, layers should call this method when their own attribution
   * notices have changed.  Users, in general, should not need to call this.
   *
   * @returns {this} Chainable.
   */
  this.updateAttribution = function () {
    // clear any existing attribution content
    m_this.node().find('.geo-attribution').remove();

    // generate a new attribution node
    var $a = $('<div/>')
      .addClass('geo-attribution')
      .on('mousedown', function (evt) {
        evt.stopPropagation();
      });

    // append content from each layer
    m_this.children().forEach(function (layer) {
      var content = layer.attribution();
      if (content) {
        $('<span/>')
          .addClass('geo-attribution-layer')
          .html(content)
          .appendTo($a);
      }
    });

    /* Only add the element if there is at least one attribution */
    if ($('span', $a).length) {
      $a.appendTo(m_this.node());
    }
    return m_this;
  };

  /**
   * Get a screen-shot of all or some of the canvas layers of map.  Note that
   * webGL layers are rerendered, even if
   *   `window.overrideContextAttributes.preserveDrawingBuffer = true;`
   * is set before creating the map object.  Chrome, at least, may not keep the
   * drawing buffers if the tab loses focus (and returning focus won't
   * necessarily rerender).
   *
   * @param {geo.layer|geo.layer[]|false|object} [layers] Either a layer, a
   *    list of layers, falsy to get all layers, or an object that contains
   *    optional values of `layers`, `type`, `encoderOptions`, and additional
   *    values listed in the `opts` parameter (this last form allows a single
   *    argument for the function).
   * @param {string} [type='image/png'] See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
   *    canvas.toDataURL}.  Use `'canvas'` to return the canvas element (this
   *    can be used to get the results as a blob, which can be faster for some
   *    operations but is not supported as widely).
   * @param {number} [encoderOptions] See {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
   *    canvas.toDataURL}.
   * @param {object} [opts] Additional screenshot options.
   * @param {false|string|CanvasRenderingContext2D.fillStyle}
   *    [opts.background='white'] If `false` or `null`, don't prefill the
   *    background.  Otherwise, a css color or
   *    `CanvasRenderingContext2D.fillStyle` to fill the initial canvas.  This
   *    could match the background of the browser page, for instance.
   * @param {boolean|'idle'} [opts.wait=false] If `'idle'`, wait for the map to
   *    be idle and one additional animation frame to occur.  If truthy, wait
   *    for an animation frame to occur.  Otherwise, take the screenshot as
   *    soon as possible.
   * @param {boolean|null} [opts.attribution=null] If `null` or unspecified,
   *    include the attribution only if all layers are used.  If false, never
   *    include the attribution.  If `true`, always include it.
   * @returns {deferred} A jQuery Deferred object.  The done function receives
   *    either a data URL or an `HTMLCanvasElement` with the result.
   */
  this.screenshot = function (layers, type, encoderOptions, opts) {
    var defer;

    if (layers && !Array.isArray(layers) && !layers.renderer) {
      type = type || layers.type;
      encoderOptions = encoderOptions || layers.encoderOptions;
      opts = opts || layers;
      layers = layers.layers;
    }
    opts = opts || {};
    /* if asked to wait, return a Deferred that will do so, calling the
     * screenshot function without waiting once it is done. */
    if (opts.wait) {
      var optsWithoutWait = $.extend({}, opts, {wait: false});
      defer = $.Deferred();

      var waitForRAF = function () {
        window.requestAnimationFrame(function () {
          defer.resolve();
        });
      };

      if (opts.wait === 'idle') {
        m_this.onIdle(waitForRAF);
      } else {
        waitForRAF();
      }
      return defer.then(function () {
        return m_this.screenshot(layers, type, encoderOptions, optsWithoutWait);
      });
    }
    defer = $.when();
    // ensure layers is a list of all the layers we want to include
    if (!layers) {
      layers = m_this.layers();
      if (opts.attribution === null || opts.attribution === undefined) {
        opts.attribution = true;
      }
    } else if (!Array.isArray(layers)) {
      layers = [layers];
    }
    // filter to only the included layers
    layers = layers.filter(function (l) {
      return m_this.layers().indexOf(l) >= 0 &&
             l.opacity() > 0 && (!l.visible || l.visible());
    });
    // sort layers by z-index
    layers = layers.sort(
      function (a, b) { return (a.zIndex() - b.zIndex()); }
    );
    // create a new canvas element
    var result = document.createElement('canvas');
    result.width = m_width;
    result.height = m_height;
    var context = result.getContext('2d');
    // optionally start with a white or custom background
    if (opts.background !== false && opts.background !== null) {
      var background = opts.background;
      if (opts.background === undefined) {
        /* If we are using the map's current background, start with white as a
         * fallback, then fill with the backgrounds of all parents and the map
         * node.  Since each may be partially transparent, this is required to
         * match the web page's color.  It won't use background patterns. */
        context.fillStyle = 'white';
        context.fillRect(0, 0, result.width, result.height);
        m_this.node().parents().get().reverse().forEach(function (elem) {
          background = window.getComputedStyle(elem).backgroundColor;
          if (background && background !== 'transparent') {
            context.fillStyle = background;
            context.fillRect(0, 0, result.width, result.height);
          }
        });
        background = window.getComputedStyle(m_this.node()[0]).backgroundColor;
      }
      if (background && background !== 'transparent') {
        context.fillStyle = background;
        context.fillRect(0, 0, result.width, result.height);
      }
    }
    // for each layer, copy to our new canvas.
    layers.forEach(function (layer) {
      var opacity = layer.opacity();
      layer.node().children('canvas').each(function () {
        var canvasElem = $(this);
        defer = defer.then(function () {
          if (layer.renderer().api() === 'vgl') {
            layer.renderer()._renderFrame();
          }
          drawLayerImageToContext(context, opacity, canvasElem, canvasElem[0]);
        });
      });
      if (layer.node().children().not('canvas').length) {
        defer = defer.then(function () {
          return util.htmlToImage(layer.node(), 1).done(function (img) {
            drawLayerImageToContext(context, 1, $([]), img);
          });
        });
      }
    });
    if (opts.attribution) {
      m_this.node().find('.geo-attribution').each(function () {
        var attrElem = $(this);
        defer = defer.then(function () {
          return util.htmlToImage(attrElem, 1).done(function (img) {
            drawLayerImageToContext(context, 1, $([]), img);
          });
        });
      });
    }
    defer = defer.then(function () {
      var canvas = result;
      if (type !== 'canvas') {
        result = result.toDataURL(type, encoderOptions);
      }
      m_this.geoTrigger(geo_event.screenshot.ready, {
        canvas: canvas,
        screenshot: result
      });
      return result;
    });
    return defer;
  };

  /**
   * Instead of each function using `window.requestAnimationFrame`, schedule
   * all such frames through this function.  This allows the callbacks to be
   * reordered or removed as needed and reduces overhead in Chrome a small
   * amount.  Also, if the animation queue is shared between map instances, the
   * callbacks will be called in a single time slice, providing better
   * synchronization.
   *
   * @param {function} callback Function to call during the animation frame.
   *    It is called with an animation epoch, exactly as
   *    `requestAnimationFrame`.
   * @param {boolean|'remove'} [action=false] Falsy to only add the callback if
   *    it is not already scheduled.  `'remove'` to remove the callback (use
   *    this instead of `cancelAnimationFrame`).  Any other truthy value moves
   *    the callback to the end of the list.
   * @returns {integer} An integer as returned by
   *    `window.requestAnimationFrame`.
   */
  this.scheduleAnimationFrame = function (callback, action) {
    if (!m_animationQueue.length) {
      /* By refering to requestAnimationFrame as a property of window, versus
       * explicitly using window.requestAnimationFrame, we prevent the
       * stripping of 'window' off of the reference and allow our tests to
       * override this if needed. */
      m_animationQueue.push(window['requestAnimationFrame'](processAnimationFrame));
    }
    var pos = m_animationQueue.indexOf(callback, 1);
    if (pos >= 0) {
      if (!action) {
        return;
      }
      m_animationQueue.splice(pos, 1);
      if (action === 'remove') {
        return;
      }
    }
    m_animationQueue.push(callback);
    return m_animationQueue[0];
  };

  /**
   * Draw a layer image to a canvas context.  The layer's opacity and transform
   * are applied.  This is used as part of making a screenshot.
   *
   * @param {context} context The 2d canvas context to draw into.
   * @param {number} opacity The opacity in the range [0, 1].
   * @param {object} elem A jQuery element that might have a transform.
   * @param {HTMLImageObject} img The image or canvas to draw to the canvas.
   * @private
   */
  function drawLayerImageToContext(context, opacity, elem, img) {
    context.globalAlpha = opacity;
    var transform = elem.css('transform');
    // if the canvas is being transformed, apply the same transformation
    if (transform && transform.substr(0, 7) === 'matrix(') {
      context.setTransform.apply(context, transform.substr(7, transform.length - 8).split(',').map(parseFloat));
    } else {
      context.setTransform(1, 0, 0, 1, 0, 0);
    }
    context.drawImage(img, 0, 0);
  }

  /**
   * Sevice the callback during an animation frame.  This uses splice to modify
   * the `animationQueue` to allow multiple map instances to share the queue.
   * @private
   */
  function processAnimationFrame() {
    var queue = m_animationQueue.splice(0, m_animationQueue.length);

    /* The first entry is the reference to the window.requestAnimationFrame. */
    for (var i = 1; i < queue.length; i += 1) {
      queue[i].apply(this, arguments);
    }
  }

  /*
   * The following are some private methods for interacting with the camera.
   * In order to hide the complexity of dealing with map aspect ratios,
   * clamping behavior, resetting zoom levels on resize, etc. from the
   * layers, the map handles camera movements directly.  This requires
   * passing all camera movement events through the map initially.  The
   * map uses these methods to fix up the events according to the constraints
   * of the display and passes the event to the layers.
   */
  /**
   * Calculate the scaling factor to fit the given map bounds into the viewport
   * with the correct aspect ratio.
   *
   * @param {geo.geoBounds} bounds A desired bounds.
   * @returns {object} Multiplicative aspect ratio correction with x and y
   *    values.
   * @private
   */
  function camera_scaling(bounds) {
    var width = bounds.right - bounds.left,
        height = bounds.top - bounds.bottom,
        ar_bds = Math.abs(width / height),
        ar_vp = m_width / m_height,
        sclx, scly;

    if (ar_bds > ar_vp) {
      // fit left and right
      sclx = 1;

      // grow top and bottom
      scly = ar_bds / ar_vp;
    } else {
      // fit top and bottom
      scly = 1;

      // grow left and right
      sclx = ar_vp / ar_bds;
    }
    return {x: sclx, y: scly};
  }

  /**
   * Adjust a set of bounds based on a rotation.  If a rotation exists, the
   * returned bounds are typically larger than the source bounds.
   *
   * @param {geo.geoBounds} bounds Bounds to adjust.
   * @param {number} rotation Angle in radians (positive is clockwise).
   * @returns {geo.geoBounds}
   * @private
   */
  function rotate_bounds(bounds, rotation) {
    if (rotation) {
      var center = {
        x: (bounds.left + bounds.right) / 2,
        y: (bounds.top + bounds.bottom) / 2
      };
      var size = {
        width: Math.abs(bounds.left - bounds.right),
        height: Math.abs(bounds.top - bounds.bottom)
      };
      bounds = rotate_bounds_center(center, size, rotation);
    }
    return bounds;
  }

  /**
   * Generate a set of bounds based on a center point, a width and height, and
   * a rotation.
   *
   * @param {geo.geoPosition} center
   * @param {object} size Size of the screen in map gcs.
   * @param {number} size.width
   * @param {number} size.height
   * @param {number} rotation Angle in radians (positive is clockwise).
   * @returns {geo.geoBounds}
   * @private
   */
  function rotate_bounds_center(center, size, rotation) {
    // calculate the half width and height
    var width = size.width / 2, height = size.height / 2;
    var sinr = Math.sin(rotation), cosr = Math.cos(rotation);
    var ul = {}, ur = {}, ll = {}, lr = {};
    ul.x = center.x + (-width) * cosr - (-height) * sinr;
    ul.y = center.y + (-width) * sinr + (-height) * cosr;
    ur.x = center.x + width * cosr - (-height) * sinr;
    ur.y = center.y + width * sinr + (-height) * cosr;
    ll.x = center.x + (-width) * cosr - height * sinr;
    ll.y = center.y + (-width) * sinr + height * cosr;
    lr.x = center.x + width * cosr - height * sinr;
    lr.y = center.y + width * sinr + height * cosr;
    return {
      left: Math.min(ul.x, ur.x, ll.x, lr.x),
      right: Math.max(ul.x, ur.x, ll.x, lr.x),
      bottom: Math.min(ul.y, ur.y, ll.y, lr.y),
      top: Math.max(ul.y, ur.y, ll.y, lr.y)
    };
  }

  /**
   * Calculate the minimum zoom level to fit the given bounds inside the view
   * port using the view port size, the given bounds, and the number of units
   * per pixel.  The method sets the valid zoom bounds as well as the current
   * zoom level to be within that range.
   *
   * @param {geo.geoBounds} bounds Bounds to fit to the screen.
   * @param {number} [rotation] Rotation in radians.  If unspecified, use the
   *    current map rotation.
   * @returns {number} The necessary zoom level.
   * @private
   */
  function calculate_zoom(bounds, rotation) {
    if (rotation === undefined) {
      rotation = m_rotation;
    }
    bounds = rotate_bounds(bounds, rotation);
    // compare the aspect ratios of the viewport and bounds
    var scl = camera_scaling(bounds), z;

    if (scl.y > scl.x) {
      // left to right matches exactly
      // center map vertically and have blank borders on the
      // top and bottom (or repeat tiles)
      z = -Math.log2(
        Math.abs(bounds.right - bounds.left) * scl.x /
        (m_width * m_unitsPerPixel)
      );
    } else {
      // top to bottom matches exactly, blank border on the
      // left and right (or repeat tiles)
      z = -Math.log2(
        Math.abs(bounds.top - bounds.bottom) * scl.y /
        (m_height * m_unitsPerPixel)
      );
    }
    return z;
  }

  /**
   * Reset the minimum zoom level given the current window size.
   * @private
   */
  function reset_minimum_zoom() {
    if (m_clampZoom) {
      m_validZoomRange.min = Math.max(
          m_validZoomRange.origMin, calculate_zoom(m_maxBounds));
    } else {
      m_validZoomRange.min = m_validZoomRange.origMin;
    }
  }

  /**
   * Return the nearest valid zoom level to the requested zoom.
   * @param {number} zoom A zoom level to adjust to current settings
   * @param {boolean} ignoreDiscreteZoom If `true`, ignore the `discreteZoom`
   *    option when determining the new view.
   * @returns {number} The zoom level clamped to the allowed zoom range and
   *    with other settings applied.
   * @private
   */
  function fix_zoom(zoom, ignoreDiscreteZoom) {
    zoom = Math.round(zoom * 1e6) / 1e6;
    zoom = Math.max(
      Math.min(
        m_validZoomRange.max,
        zoom
      ),
      m_validZoomRange.min
    );
    if (m_discreteZoom && !ignoreDiscreteZoom) {
      zoom = Math.round(zoom);
      if (zoom < m_validZoomRange.min) {
        zoom = Math.ceil(m_validZoomRange.min);
      }
    }
    return zoom;
  }

  /**
   * Return a valid rotation angle.
   *
   * @param {number} rotation Proposed rotation.
   * @param {boolean} ignoreRotationFunc If truthy and rotations are allowed,
   *    allow any rotation.  Otherwise, the rotation is passed through the
   *    `allowRotation` function.
   * @param {boolean} noRangeLimit If falsy, ensure that the rotation is in the
   *    range [0, 2*PI).  If it is very close to zero, it is snapped to zero.
   *    If true, the rotation can have any value.
   * @returns {number} the validated rotation
   * @private
   */
  function fix_rotation(rotation, ignoreRotationFunc, noRangeLimit) {
    if (!m_allowRotation) {
      return 0;
    }
    if (!ignoreRotationFunc && typeof m_allowRotation === 'function') {
      rotation = m_allowRotation(rotation);
    }
    /* Ensure that the rotation is in the range [0, 2pi) */
    if (!noRangeLimit) {
      var range = Math.PI * 2;
      rotation = (rotation % range) + (rotation >= 0 ? 0 : range);
      if (Math.min(Math.abs(rotation), Math.abs(rotation - range)) < 0.00001) {
        rotation = 0;
      }
    }
    return rotation;
  }

  /**
   * Return the nearest valid bounds maintaining the width and height.  Does
   * nothing if `clampBoundsX` and `clampBoundsY` are false.  If a delta is
   * specified, will only clamp if the out-of-bounds condition would be worse.
   * If `ignoreClampBounds` is true, clamping is applied only to prevent more
   * than half the image from being off screen.
   *
   * @param {geo.geoBounds} bounds The new bounds to apply in map gcs
   *    coordinates.
   * @param {number} [rotation] The angle of rotation in radians.  May be falsy
   *    to have no rotation.
   * @param {object} [delta] If present, the shift in position in screen
   *    coordinates.  Bounds will only be adjusted if the bounds would be
   *    more out of position after the shift.
   * @param {number} delta.x
   * @param {number} delta.y
   * @param {number} delta.unit Units per pixel at the current zoom level.
   * @param {boolean} [ignoreClampBounds] If `true` and `clampBoundsX` or
   *    `clampBoundsY` are set, allow the bounds to be less clamped.
   *    Specifically, the map's `maxBounds` can be shifted so that they lie no
   *    further than the center of the bounds (rather than being forced to be
   *    at the edge).
   * @returns {geo.geoBounds} The adjusted bounds.  This may be the same object
   *    passed in `bounds`.
   * @private
   */
  function fix_bounds(bounds, rotation, delta, ignoreClampBounds) {
    if (!m_clampBoundsX && !m_clampBoundsY) {
      return bounds;
    }
    var dx, dy, maxBounds = m_maxBounds;
    if (rotation) {
      maxBounds = $.extend({}, m_maxBounds);
      /* When rotated, expand the maximum bounds so that they will allow the
       * corners to be visible.  We know the rotated bounding box, plus the
       * original maximum bounds.  To fit the corners of the maximum bounds, we
       * can expand the total bounds by the same factor that the rotated
       * bounding box is expanded from the non-rotated bounding box (for a
       * small rotation, this is sin(rotation) * (original bounding box height)
       * in the width).  This feels like appropriate behaviour with one of the
       * two bounds clamped.  With both, it seems mildly peculiar. */
      var bw = Math.abs(bounds.right - bounds.left),
          bh = Math.abs(bounds.top - bounds.bottom),
          absinr = Math.abs(Math.sin(rotation)),
          abcosr = Math.abs(Math.cos(rotation)),
          ow, oh;
      if (bounds.width && bounds.height) {
        ow = bounds.width;
        oh = bounds.height;
      } else if (Math.abs(absinr - abcosr) < 0.0005) {
        /* If we are close to a 45 degree rotation, it is ill-determined to
         * compute the original (pre-rotation) bounds width and height.  In
         * this case, assume that we are using the map's aspect ratio. */
        if (m_width && m_height) {
          var aspect = Math.abs(m_width / m_height);
          var fac = Math.pow(1 + Math.pow(aspect, 2), 0.5);
          ow = Math.max(bw, bh) / fac;
          oh = ow * aspect;
        } else {
          /* Fallback if we don't have width or height */
          ow = bw * abcosr;
          oh = bh * absinr;
        }
      } else {
        /* Compute the pre-rotation (original) bounds width and height */
        ow = (abcosr * bw - absinr * bh) / (abcosr * abcosr - absinr * absinr);
        oh = (abcosr * bh - absinr * bw) / (abcosr * abcosr - absinr * absinr);
      }
      /* Our maximum bounds are expanded based on the projected length of a
       * tilted side of the original bounding box in the rotated bounding box.
       * To handle all rotations, take the minimum difference in width or
       * height. */
      var bdx = bw - Math.max(abcosr * ow, absinr * oh),
          bdy = bh - Math.max(abcosr * oh, absinr * ow);
      maxBounds.left -= bdx;
      maxBounds.right += bdx;
      maxBounds.top += bdy;
      maxBounds.bottom -= bdy;
    }
    if (ignoreClampBounds) {
      maxBounds = {
        left: maxBounds.left - (bounds.right - bounds.left) / 2,
        right: maxBounds.right + (bounds.right - bounds.left) / 2,
        top: maxBounds.top - (bounds.bottom - bounds.top) / 2,
        bottom: maxBounds.bottom + (bounds.bottom - bounds.top) / 2
      };
    }
    if (m_clampBoundsX) {
      if (bounds.right - bounds.left > maxBounds.right - maxBounds.left) {
        dx = maxBounds.left - ((bounds.right - bounds.left - (
          maxBounds.right - maxBounds.left)) / 2) - bounds.left;
      } else if (bounds.left < maxBounds.left) {
        dx = maxBounds.left - bounds.left;
      } else if (bounds.right > maxBounds.right) {
        dx = maxBounds.right - bounds.right;
      }
      if (dx && (!delta || delta.x * dx > 0)) {
        if (delta && Math.abs(dx) > Math.abs(delta.x * delta.unit)) {
          dx = Math.abs(delta.x * delta.unit) * dx / Math.abs(dx);
        }
        bounds = {
          left: bounds.left += dx,
          right: bounds.right += dx,
          top: bounds.top,
          bottom: bounds.bottom
        };
      }
    }
    if (m_clampBoundsY) {
      if (bounds.top - bounds.bottom > maxBounds.top - maxBounds.bottom) {
        dy = maxBounds.bottom - ((bounds.top - bounds.bottom - (
          maxBounds.top - maxBounds.bottom)) / 2) - bounds.bottom;
      } else if (bounds.top > maxBounds.top) {
        dy = maxBounds.top - bounds.top;
      } else if (bounds.bottom < maxBounds.bottom) {
        dy = maxBounds.bottom - bounds.bottom;
      }
      if (dy && (!delta || -delta.y * dy > 0)) {
        if (delta && Math.abs(dy) > Math.abs(delta.y * delta.unit)) {
          dy = Math.abs(delta.y * delta.unit) * dy / Math.abs(dy);
        }
        bounds = {
          top: bounds.top += dy,
          bottom: bounds.bottom += dy,
          left: bounds.left,
          right: bounds.right
        };
      }
    }
    return bounds;
  }

  /**
   * Call the camera bounds method with the given bounds, but correct for the
   * viewport aspect ratio.
   *
   * @param {geo.geoBounds} bounds The bounds for the camera.  If a rotation
   *    is specified, the bounds need to also contain the map gcs width and
   *    height.
   * @param {number} [rotation] The map rotation in radians.
   * @private
   */
  function camera_bounds(bounds, rotation) {
    m_camera.rotation = rotation || 0;
    /* When dealing with rotation, use the original width and height of the
     * bounds, as the rotation will have expanded them. */
    if (bounds.width && bounds.height && rotation) {
      var cx = (bounds.left + bounds.right) / 2,
          cy = (bounds.top + bounds.bottom) / 2;
      m_camera.viewFromCenterSizeRotation({x: cx, y: cy}, bounds, rotation);
    } else {
      m_camera.bounds = bounds;
    }
    /* Update the center to what was set. */
    m_center = {
      x: (m_camera.bounds.left + m_camera.bounds.right) / 2,
      y: (m_camera.bounds.top + m_camera.bounds.bottom) / 2
    };
  }

  /**
   * Resize the map based on the size of the associated DOM node.
   * @private
   */
  function resizeSelf() {
    m_this.size({width: m_node.width(), height: m_node.height()});
  }

  /*
   * All the methods are now defined.  From here, we are initializing all
   * internal variables and event handlers.
   */

  this._init(arg);

  // set up drag/drop handling
  this.node().on('dragover.geo', function (e) {
    var evt = e.originalEvent;

    if (m_this.fileReader()) {
      evt.stopPropagation();
      evt.preventDefault();
      evt.dataTransfer.dropEffect = 'copy';
    }
  })
  .on('drop.geo', function (e) {
    var evt = e.originalEvent, reader = m_this.fileReader(),
        i, file;

    function done() {
      m_this.draw();
    }

    if (reader) {
      evt.stopPropagation();
      evt.preventDefault();

      for (i = 0; i < evt.dataTransfer.files.length; i += 1) {
        file = evt.dataTransfer.files[i];
        if (reader.canRead(file)) {
          reader.read(file, done); // to do: trigger event on done
        }
      }
    }
  });

  /*
   * The map coordinates for the default world map, where c = half
   * circumference at equator in meters, o = origin:
   *   (-c, c) + o                   (c, c) + o
   *            (center.x, center.y) + o            <-- center of viewport
   *   (-c, -c) + o                  (c, -c) + o
   */
  // Set the world origin
  m_origin = {x: 0, y: 0};

  // Fix the zoom level (minimum and initial)
  this.zoomRange(arg, true);
  m_zoom = fix_zoom(m_zoom);
  m_rotation = fix_rotation(m_rotation);
  // Now update to the correct center and zoom level
  this.center($.extend({}, arg.center || m_center), undefined);

  if (arg.interactor !== null) {
    this.interactor(arg.interactor || mapInteractor({discreteZoom: m_discreteZoom}));
  }

  if (m_autoResize) {
    $(window).on('resize', resizeSelf);
  }

  // attach attribution updates to layer events
  m_this.geoOn([
    geo_event.layerAdd,
    geo_event.layerRemove
  ], m_this.updateAttribution);

  return this;
};

/**
 * Create a map from an object.  Any errors in the creation
 * of the map will result in returning `null`.
 *
 * @param {geo.map.spec} spec The object specification.
 * @returns {geo.map|null}
 */
map.create = function (spec) {
  'use strict';

  var _map = map(spec),
      layer = require('./layer');

  /* If the spec is bad, we still end up with an object, but it won't have a
   * zoom function */
  if (!_map || !_map.zoom) {
    console.warn('Could not create map.');
    return null;
  }

  spec.data = spec.data || [];
  spec.layers = spec.layers || [];

  spec.layers.forEach(function (l) {
    l.data = l.data || spec.data;
    l.layer = layer.create(_map, l);
  });

  return _map;
};

inherit(map, sceneObject);
module.exports = map;
