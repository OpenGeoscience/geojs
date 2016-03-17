var $ = require('jquery');
var vgl = require('vgl');
var inherit = require('../util').inherit;
var sceneObject = require('./sceneObject');

//////////////////////////////////////////////////////////////////////////////
/**
 * Creates a new map object
 *
 * Map coordinates for default world map, where c = half circumference at
 * equator in meters, o = origin:
 *   (-c, c) + o                   (c, c) + o
 *            (center.x, center.y) + o            <-- center of viewport
 *   (-c, -c) + o                  (c, -c) + o
 *
 * @class geo.map
 * @extends geo.sceneObject
 *
 * *** Always required ***
 * @param {string} node DOM selector for the map container
 *
 * *** Required when using a domain/CS different from OSM ***
 * @param {string|geo.transform} [gcs='EPSG:3857']
 *   The main coordinate system of the map
 * @param {number} [maxZoom=16] The maximum zoom level
 * @param {string|geo.transform} [ingcs='EPSG:4326']
 *   The default coordinate system of interface calls.
 * @param {number} [unitsPerPixel=156543] GCS to pixel unit scaling at zoom 0
 *   (i.e. meters per pixel or degrees per pixel).
 * @param {object?} maxBounds The maximum visable map bounds
 * @param {number} [maxBounds.left=-20037508] The left bound
 * @param {number} [maxBounds.right=20037508] The right bound
 * @param {number} [maxBounds.bottom=-20037508] The bottom bound
 * @param {number} [maxBounds.top=20037508] The top bound
 *
 * *** Initial view ***
 * @param {number} [zoom=4] Initial zoom
 * @param {object?} center Map center
 * @param {number} [center.x=0]
 * @param {number} [center.y=0]
 * @param {number} [rotation=0] Clockwise rotation in radians
 * @param {number?} width The map width (default node width)
 * @param {number?} height The map height (default node height)
 *
 * *** Navigation ***
 * @param {number} [min=0]  Minimum zoom level (though fitting to the viewport
 *   may make it so this is smaller than the smallest possible value)
 * @param {number} [max=16]  Maximum zoom level
 * @param {boolean} [discreteZoom=false]  True to only allow integer zoom
 *   levels.  False for any zoom level.
 * @param {boolean} [allowRotation=true]  False prevents rotation, true allows
 *   any rotation.  If a function, the function is called with a rotation
 *   (angle in radians) and returns a valid rotation (this can be used to
 *   constrain the rotation to a range or specific values).
 *
 * *** Advanced parameters ***
 * @param {geo.camera?} camera The camera to control the view
 * @param {geo.mapInteractor?} interactor The UI event handler
 * @param {geo.clock?} clock The clock used to synchronize time events
 * @param {boolean} [autoResize=true] Adjust map size on window resize
 * @param {boolean} [clampBoundsX=false] Prevent panning outside of the
 *   maximum bounds in the horizontal direction.
 * @param {boolean} [clampBoundsY=true] Prevent panning outside of the
 *   maximum bounds in the vertical direction.
 * @param {boolean} [clampZoom=true] Prevent zooming out so that the map area
 *   is smaller than the window.
 *
 * @returns {geo.map}
 */
//////////////////////////////////////////////////////////////////////////////
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
  var util = require('../util');
  var geo_event = require('./event');
  var mapInteractor = require('./mapInteractor');
  var clock = require('./clock');
  var uiLayer = require('../ui/uiLayer');

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private member variables
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      s_exit = this._exit,
      // See https://en.wikipedia.org/wiki/Web_Mercator
      // phiMax = 180 / Math.PI * (2 * Math.atan(Math.exp(Math.PI)) - Math.PI / 2),
      m_x = 0,
      m_y = 0,
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
      m_clock = null,
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
      m_origin,
      m_scale = {x: 1, y: 1, z: 1}; // constant and ignored for the moment

  /* Compute the maximum bounds on our map projection.  By default, x ranges
   * from [-180, 180] in the interface projection, and y matches the x range in
   * the map (not the interface) projection.  For images, this might be
   * [0, width] and [0, height] instead. */
  var mcx = ((m_maxBounds.left || 0) + (m_maxBounds.right || 0)) / 2,
      mcy = ((m_maxBounds.bottom || 0) + (m_maxBounds.top || 0)) / 2;
  m_maxBounds.left = transform.transformCoordinates(m_ingcs, m_gcs, [{
    x: m_maxBounds.left !== undefined ? m_maxBounds.left : -180, y: mcy
  }])[0].x;
  m_maxBounds.right = transform.transformCoordinates(m_ingcs, m_gcs, [{
    x: m_maxBounds.right !== undefined ? m_maxBounds.right : 180, y: mcy
  }])[0].x;
  m_maxBounds.top = (m_maxBounds.top !== undefined ?
    transform.transformCoordinates(m_ingcs, m_gcs, [{
      x: mcx, y: m_maxBounds.top}])[0].y : m_maxBounds.right);
  m_maxBounds.bottom = (m_maxBounds.bottom !== undefined ?
    transform.transformCoordinates(m_ingcs, m_gcs, [{
      x: mcx, y: m_maxBounds.bottom}])[0].y : m_maxBounds.left);
  m_unitsPerPixel = (arg.unitsPerPixel || (
    m_maxBounds.right - m_maxBounds.left) / 256);

  m_camera.viewport = {width: m_width, height: m_height};
  arg.center = util.normalizeCoordinates(arg.center);
  arg.autoResize = arg.autoResize === undefined ? true : arg.autoResize;
  m_clampBoundsX = arg.clampBoundsX === undefined ? false : arg.clampBoundsX;
  m_clampBoundsY = arg.clampBoundsY === undefined ? true : arg.clampBoundsY;
  m_clampZoom = arg.clampZoom === undefined ? true : arg.clampZoom;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/set the number of world space units per display pixel at the given
   * zoom level.
   *
   * @param {Number} [zoom=0] The target zoom level
   * @param {Number?} unit If present, set the unitsPerPixel otherwise return
   *   the current value.
   * @returns {Number|this}
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/set the clampBoundsX setting.  If changed, adjust the bounds of the
   * map as needed.
   *
   * @param {boolean?} clamp The new clamp value.
   * @returns {boolean|this}
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/set the clampBoundsY setting.  If changed, adjust the bounds of the
   * map as needed.
   *
   * @param {boolean?} clamp The new clamp value.
   * @returns {boolean|this}
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/set the clampZoom setting.  If changed, adjust the bounds of the map
   * as needed.
   *
   * @param {boolean?} clamp The new clamp value.
   * @returns {boolean|this}
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/set the allowRotation setting.  If changed, adjust the map as needed.
   *
   * @param {boolean|function} allowRotation the new allowRotation value.
   * @returns {boolean|function|this}
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the map's world coordinate origin in gcs coordinates
   *
   * @returns {object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.origin = function () {
    return $.extend({}, m_origin);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the map's world coordinate scaling relative gcs units
   *
   * @returns {object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.scale = function () {
    return $.extend({}, m_scale);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the camera
   *
   * @returns {geo.camera}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.camera = function () {
    return m_camera;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get map gcs
   *
   * @returns {string}
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get map interface gcs
   *
   * @returns {string}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.ingcs = function (arg) {
    if (arg === undefined) {
      return m_ingcs;
    }
    m_ingcs = arg;
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get root node of the map
   *
   * @returns {object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.node = function () {
    return m_node;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set zoom level of the map
   *
   * @param {number} val if undefined, return the current zoom level.
   *    Otherwise, the new zoom level to set.
   * @param {object} origin if present, an object with 'geo' containing the
   *    gcs coordinates where the action started and 'map' containing the
   *    display coordinates of the same location before the zoom is applied.
   * @param {boolean} ignoreDiscreteZoom if true, ignore the discreteZoom
   *    option when determining the new view.
   * @returns {Number|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.zoom = function (val, origin, ignoreDiscreteZoom) {
    if (val === undefined) {
      return m_zoom;
    }
    var evt, bounds;

    /* The ignoreDiscreteZoom flag is intended to allow non-integer zoom values
     * during animation. */
    val = fix_zoom(val, ignoreDiscreteZoom);
    if (val === m_zoom) {
      return m_this;
    }

    m_zoom = val;

    bounds = m_this.boundsFromZoomAndCenter(val, m_center, m_rotation, null,
                                            ignoreDiscreteZoom);
    m_this.modified();

    camera_bounds(bounds, m_rotation);
    evt = {
      geo: {},
      zoomLevel: m_zoom,
      screenPosition: origin ? origin.map : undefined
    };
    m_this.geoTrigger(geo_event.zoom, evt);

    if (origin && origin.geo && origin.map) {
      var shifted = m_this.gcsToDisplay(origin.geo);
      m_this.pan({x: origin.map.x - shifted.x, y: origin.map.y - shifted.y},
                 ignoreDiscreteZoom);
    } else {
      m_this.pan({x: 0, y: 0}, ignoreDiscreteZoom);
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Pan the map by (x: dx, y: dy) pixels.
   *
   * @param {Object} delta x and y delta in display pixels
   * @param {boolean} ignoreDiscreteZoom if true, ignore the discreteZoom
   *    option when determining the new view.
   * @returns {geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pan = function (delta, ignoreDiscreteZoom) {
    var evt, unit;
    evt = {
      geo: {},
      screenDelta: delta
    };

    unit = m_this.unitsPerPixel(m_zoom);

    var sinr = Math.sin(m_rotation), cosr = Math.cos(m_rotation);
    m_camera.pan({
      x: (delta.x * cosr - (-delta.y) * sinr) * unit,
      y: (delta.x * sinr + (-delta.y) * cosr) * unit
    });
    /* If m_clampBounds* is true, clamp the pan */
    var bounds = fix_bounds(m_camera.bounds, m_rotation);
    if (bounds !== m_camera.bounds) {
      var panPos = m_this.gcsToDisplay({
        x: m_camera.bounds.left, y: m_camera.bounds.top}, null);
      bounds = m_this.boundsFromZoomAndCenter(m_zoom, {
        x: (bounds.left + bounds.right) / 2,
        y: (bounds.top + bounds.bottom) / 2
      }, m_rotation, null, ignoreDiscreteZoom);
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/set the map rotation.  The rotation is performed around the current
   * view center.
   *
   * @param {Object} rotation angle in radians (positive is clockwise)
   * @param {Object} origin is specified, rotate about this origin
   * @param {boolean} ignoreRotationFunc if true, don't constrain the rotation.
   * @returns {geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.rotation = function (rotation, origin, ignoreRotationFunc) {
    if (rotation === undefined) {
      return m_rotation;
    }
    rotation = fix_rotation(rotation, ignoreRotationFunc);
    if (rotation === m_rotation) {
      return m_this;
    }
    m_rotation = rotation;

    var bounds = m_this.boundsFromZoomAndCenter(
        m_zoom, m_center, m_rotation, null, ignoreRotationFunc);
    m_this.modified();

    camera_bounds(bounds, m_rotation);

    var evt = {
      geo: {},
      rotation: m_rotation,
      screenPosition: origin ? origin.map : undefined
    };

    m_this.geoTrigger(geo_event.rotate, evt);

    if (origin && origin.geo && origin.map) {
      var shifted = m_this.gcsToDisplay(origin.geo);
      m_this.pan({x: origin.map.x - shifted.x, y: origin.map.y - shifted.y});
    } else {
      m_this.pan({x: 0, y: 0});
    }
    /* Changing the rotation can change our minimum zoom */
    reset_minimum_zoom();
    m_this.zoom(m_zoom, ignoreRotationFunc);
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set center of the map to the given geographic coordinates, or get the
   * current center.  Uses bare objects {x: 0, y: 0}.
   *
   * @param {Object} coordinates
   * @param {string|geo.transform} [gcs] undefined to use the interface gcs,
   *    null to use the map gcs, or any other transform.  If setting the
   *    center, they are converted from this gcs to the map projection.  The
   *    returned center are converted from the map projection to this gcs.
   * @param {boolean} ignoreDiscreteZoom if true, ignore the discreteZoom
   *    option when determining the new view.
   * @returns {Object|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.center = function (coordinates, gcs, ignoreDiscreteZoom) {
    var center;
    if (coordinates === undefined) {
      center = $.extend({}, m_this.worldToGcs(m_center, gcs));
      return center;
    }

    // get the screen coordinates of the new center
    m_center = $.extend({}, m_this.gcsToWorld(coordinates, gcs));

    camera_bounds(m_this.boundsFromZoomAndCenter(
        m_zoom, m_center, m_rotation, null, ignoreDiscreteZoom), m_rotation);
    m_this.modified();
    // trigger a pan event
    m_this.geoTrigger(
        geo_event.pan,
        {
          geo: coordinates,
          screenDelta: null
        }
    );
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add layer to the map
   *
   * @param {geo.layer} layer to be added to the map
   * @return {geom.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.createLayer = function (layerName, arg) {
    arg = arg || {};
    var newLayer = util.createLayer(
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
        type: geo_event.layerAdd,
        target: m_this,
        layer: newLayer
      });
    }

    return newLayer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove layer from the map
   *
   * @param {geo.layer} layer that should be removed from the map
   * @return {geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.deleteLayer = function (layer) {

    if (layer !== null && layer !== undefined) {
      layer._exit();
      m_this.removeChild(layer);

      m_this.modified();

      m_this.geoTrigger(geo_event.layerRemove, {
        type: geo_event.layerRemove,
        target: m_this,
        layer: layer
      });
    }

    /// Return deleted layer (similar to createLayer) as in the future
    /// we may provide extension of this method to support deletion of
    /// layer using id or some sort.
    return layer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get or set the size of the map.
   *
   * @param {Object?} arg
   * @param {Number} arg.width width in pixels
   * @param {Number} arg.height height in pixels
   * @returns {Object} An object containing width and height as keys
   */
  ////////////////////////////////////////////////////////////////////////////
  this.size = function (arg) {
    if (arg === undefined) {
      return {
        width: m_width,
        height: m_height
      };
    }
    m_this.resize(0, 0, arg.width, arg.height);
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the rotated size of the map.  This is the width and height of the
   * non-rotated area necessary to enclose the rotated area in pixels.
   *
   * @returns {Object} An object containing width and height as keys
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Resize map (deprecated)
   *
   * @param {Number} x x-offset in display space
   * @param {Number} y y-offset in display space
   * @param {Number} w width in display space
   * @param {Number} h height in display space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resize = function (x, y, w, h) {

    // store the original center and restore it after the resize
    var oldCenter = m_this.center();
    m_x = x;
    m_y = y;
    m_width = w;
    m_height = h;

    reset_minimum_zoom();
    var newZoom = fix_zoom(m_zoom);
    if (newZoom !== m_zoom) {
      m_this.zoom(newZoom);
    }
    m_this.camera().viewport = {width: w, height: h};
    m_this.center(oldCenter);

    m_this.geoTrigger(geo_event.resize, {
      type: geo_event.resize,
      target: m_this,
      x: m_x,
      y: m_y,
      width: w,
      height: h
    });

    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from gcs coordinates to map world coordinates.
   * @param {object} c The input coordinate to convert
   * @param {object} c.x
   * @param {object} c.y
   * @param {object} [c.z=0]
   * @param {string?} gcs The gcs of the input (map.gcs() by default)
   * @return {object} World space coordinates
   */
  ////////////////////////////////////////////////////////////////////////////
  this.gcsToWorld = function (c, gcs) {
    gcs = (gcs === null ? m_gcs : (gcs === undefined ? m_ingcs : gcs));
    if (gcs !== m_gcs) {
      c = transform.transformCoordinates(gcs, m_gcs, [c])[0];
    }
    return transform.affineForward(
      {origin: m_origin},
      [c]
    )[0];
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from map world coordinates to gcs coordinates.
   * @param {object} c The input coordinate to convert
   * @param {object} c.x
   * @param {object} c.y
   * @param {object} [c.z=0]
   * @param {string|geo.transform} [gcs] undefined to use the interface gcs,
   *    null to use the map gcs, or any other transform.
   * @return {object} GCS space coordinates
   */
  ////////////////////////////////////////////////////////////////////////////
  this.worldToGcs = function (c, gcs) {
    c = transform.affineInverse(
      {origin: m_origin},
      [c]
    )[0];
    gcs = (gcs === null ? m_gcs : (gcs === undefined ? m_ingcs : gcs));
    if (gcs !== m_gcs) {
      c = transform.transformCoordinates(m_gcs, gcs, [c])[0];
    }
    return c;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from gcs coordinates to display coordinates.
   *
   *    gcsToWorld | worldToDisplay
   *
   * @param {object} c The input coordinate to convert
   * @param {object} c.x
   * @param {object} c.y
   * @param {object} [c.z=0]
   * @param {string|geo.transform} [gcs] undefined to use the interface gcs,
   *    null to use the map gcs, or any other transform.
   * @return {object} Display space coordinates
   */
  ////////////////////////////////////////////////////////////////////////////
  this.gcsToDisplay = function (c, gcs) {
    c = m_this.gcsToWorld(c, gcs);
    return m_this.worldToDisplay(c);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from world coordinates to display coordinates using the attached
   * camera.
   * @param {object} c The input coordinate to convert
   * @param {object} c.x
   * @param {object} c.y
   * @param {object} [c.z=0]
   * @return {object} Display space coordinates
   */
  ////////////////////////////////////////////////////////////////////////////
  this.worldToDisplay = function (c) {
    return m_camera.worldToDisplay(c);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from display to gcs coordinates
   *
   *    displayToWorld | worldToGcs
   *
   * @param {object} c The input display coordinate to convert
   * @param {object} c.x
   * @param {object} c.y
   * @param {object} [c.z=0]
   * @param {string|geo.transform} [gcs] undefined to use the interface gcs,
   *    null to use the map gcs, or any other transform.
   * @return {object} GCS space coordinates
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToGcs = function (c, gcs) {
    c = m_this.displayToWorld(c); // done via camera
    return m_this.worldToGcs(c, gcs);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from display coordinates to world coordinates using the attached
   * camera.
   * @param {object} c The input coordinate to convert
   * @param {object} c.x
   * @param {object} c.y
   * @param {object} [c.z=0]
   * @return {object} World space coordinates
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToWorld = function (c) {
    return m_camera.displayToWorld(c);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Manually force to render map
   */
  ////////////////////////////////////////////////////////////////////////////
  this.draw = function () {
    var i, layers = m_this.children();

    m_this.geoTrigger(geo_event.draw, {
      type: geo_event.draw,
      target: m_this
    });

    m_this._update();

    for (i = 0; i < layers.length; i += 1) {
      layers[i].draw();
    }

    m_this.geoTrigger(geo_event.drawEnd, {
      type: geo_event.drawEnd,
      target: m_this
    });

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Attach a file reader to a layer in the map to be used as a drop target.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.fileReader = function (readerType, opts) {
    var layer, renderer;
    opts = opts || {};
    if (!readerType) {
      return m_fileReader;
    }
    layer = opts.layer;
    if (!layer) {
      renderer = opts.renderer;
      if (!renderer) {
        renderer = 'd3';
      }
      layer = m_this.createLayer('feature', {renderer: renderer});
    }
    opts.layer = layer;
    opts.renderer = renderer;
    m_fileReader = util.createFileReader(readerType, opts);
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize the map
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {

    if (m_node === undefined || m_node === null) {
      throw 'Map require DIV node';
    }

    m_node.css('position', 'relative');
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update map
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function (request) {
    var i, layers = m_this.children();
    for (i = 0; i < layers.length; i += 1) {
      layers[i]._update(request);
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Exit this map
   */
  ////////////////////////////////////////////////////////////////////////////
  this.exit = function () {
    var i, layers = m_this.children();
    for (i = 0; i < layers.length; i += 1) {
      layers[i]._exit();
    }
    if (m_this.interactor()) {
      m_this.interactor().destroy();
      m_this.interactor(null);
    }
    m_this.node().off('.geo');
    /* make sure the map node has nothing left in it */
    m_this.node().empty();
    $(window).off('resize', resizeSelf);
    s_exit();
  };

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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get or set the map interactor
   */
  ////////////////////////////////////////////////////////////////////////////
  this.interactor = function (arg) {
    if (arg === undefined) {
      return m_interactor;
    }
    m_interactor = arg;

    // this makes it possible to set a null interactor
    // i.e. map.interactor(null);
    if (m_interactor) {
      m_interactor.map(m_this);
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get or set the map clock
   */
  ////////////////////////////////////////////////////////////////////////////
  this.clock = function (arg) {
    if (arg === undefined) {
      return m_clock;
    }
    m_clock = arg;

    if (m_clock) {
      m_clock.object(m_this);
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get or set the min/max zoom range.
   *
   * @param {Object} arg {min: minimumzoom, max: maximumzom}
   * @param {boolean} noRefresh if true, don't update the map if the zoom level
   *                            has changed.
   * @returns {Object|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Start an animated zoom/pan/rotate.  If a second transition is requested
   * while a transition is already in progress, a new transition is created
   * that is functionally from whereever the map has moved to (possibly partway
   * through the first transition) going to the end point of the new
   * transition.
   *
   * Options:
   * <pre>
   *   opts = {
   *     center: { x: ... , y: ... } // the new center
   *     zoom: ... // the new zoom level
   *     zoomOrigin: ... // an origin to use when zooming.  Optional.
   *     rotation: ... // the new rotation angle
   *     duration: ... // the duration (in ms) of the transition
   *     ease: ... // an easing function [0, 1] -> [0, 1]
   *   }
   * </pre>
   *
   * Call with no arguments to return the current transition information.
   *
   * @param {object?} opts
   * @param {string|geo.transform} [gcs] undefined to use the interface gcs,
   *    null to use the map gcs, or any other transform.  Applies only to the
   *    center coordinate of the opts and to converting zoom values to height,
   *    if specified.
   * @returns {geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
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
        transitionEnd.center = geo.transform.transformCoordinates(
          m_gcs, m_ingcs, [transitionEnd.center])[0];
      }
      m_queuedTransition = $.extend(
        {}, transitionEnd || {}, m_queuedTransition || {}, opts);
      return m_this;
    }

    function interp1(p0, p1, t) {
      return p0 + (p1 - p0) * t;
    }
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

    // Transform zoom level into z-coordinate and inverse
    function zoom2z(z) {
      return vgl.zoomToHeight(z + 1, m_width, m_height) * units;
    }
    function z2zoom(z) {
      return vgl.heightToZoom(z / units, m_width, m_height) - 1;
    }

    var defaultOpts = {
      center: m_this.center(undefined, null),
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
        opts.center = transform.transformCoordinates(gcs, m_gcs, [
          opts.center])[0];
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

    if (opts.zCoord) {
      m_transition.interp = opts.interp(
          [
            m_transition.start.center.x,
            m_transition.start.center.y,
            zoom2z(m_transition.start.zoom),
            m_transition.start.rotation
          ],
          [
            m_transition.end.center.x,
            m_transition.end.center.y,
            zoom2z(m_transition.end.zoom),
            m_transition.end.rotation
          ]
      );
    } else {
      m_transition.interp = opts.interp(
          [
            m_transition.start.center.x,
            m_transition.start.center.y,
            m_transition.start.zoom,
            m_transition.start.rotation
          ],
          [
            m_transition.end.center.x,
            m_transition.end.center.y,
            m_transition.end.zoom,
            m_transition.end.rotation
          ]
      );
    }

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
          m_this.center(m_transition.end.center, null);
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
        }, null, true);
      } else {
        m_center = m_this.gcsToWorld({x: p[0], y: p[1]}, null);
        m_this.zoom(p[2], m_transition.zoomOrigin, true);
      }
      m_this.rotation(p[3], undefined, true);

      window.requestAnimationFrame(anim);
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
      window.requestAnimationFrame(anim);
    }
    return m_this;
  };

  /**
   * Cancel any existing transition.  The transition will send a cancel event
   * at the next animation frame, but no further activity occurs.
   *
   * @param {string} [source] optional cause of the cancel.  This can be any
   *                 value, but something like <method name>.<action> is
   *                 recommended to allow other functions to determine the
   *                 source and cause of the transition being canceled.
   * @returns {bool} true if a transition was in progress.
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/set the locations of the current map corners as latitudes/longitudes.
   * When provided the argument should be an object containing the keys left,
   * top, right, bottom declaring the desired new map bounds.  The new bounds
   * will contain at least the min/max lat/lngs provided modified by clamp
   * settings.  In any case, the actual new bounds will be returned by this
   * function.
   *
   * @param {geo.geoBounds} [bds] The requested map bounds
   * @param {string|geo.transform} [gcs] undefined to use the interface gcs,
   *    null to use the map gcs, or any other transform.  If setting the
   *    bounds, they are converted from this gcs to the map projection.  The
   *    returned bounds are converted from the map projection to this gcs.
   * @return {geo.geoBounds} The actual new map bounds
   */
  ////////////////////////////////////////////////////////////////////////////
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

  this.maxBounds = function (bounds, gcs) {
    gcs = (gcs === null ? m_gcs : (gcs === undefined ? m_ingcs : gcs));
    if (bounds === undefined) {
      return {
        left: transform.transformCoordinates(m_gcs, gcs, [{
          x: m_maxBounds.left, y: 0}])[0].x,
        right: transform.transformCoordinates(m_gcs, gcs, [{
          x: m_maxBounds.right, y: 0}])[0].x,
        bottom: transform.transformCoordinates(m_gcs, gcs, [{
          x: 0, y: m_maxBounds.bottom}])[0].y,
        top: transform.transformCoordinates(m_gcs, gcs, [{
          x: 0, y: m_maxBounds.top}])[0].y
      };
    }
    var cx = ((bounds.left || 0) + (bounds.right || 0)) / 2,
        cy = ((bounds.bottom || 0) + (bounds.top || 0)) / 2;
    if (bounds.left !== undefined) {
      m_maxBounds.left = transform.transformCoordinates(gcs, m_gcs, [{
        x: bounds.left, y: cy}])[0].x;
    }
    if (bounds.right !== undefined) {
      m_maxBounds.right = transform.transformCoordinates(gcs, m_gcs, [{
        x: bounds.right, y: cy}])[0].x;
    }
    if (bounds.bottom !== undefined) {
      m_maxBounds.bottom = transform.transformCoordinates(gcs, m_gcs, [{
        x: cx, y: bounds.bottom}])[0].y;
    }
    if (bounds.top !== undefined) {
      m_maxBounds.top = transform.transformCoordinates(gcs, m_gcs, [{
        x: cx, y: bounds.top}])[0].y;
    }
    reset_minimum_zoom();
    m_this.zoom(m_zoom);
    m_this.pan({x: 0, y: 0});
    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the center zoom level necessary to display the given lat/lon bounds.
   *
   * @param {geo.geoBounds} [bds] The requested map bounds
   * @param {number} rotation Rotation in clockwise radians.
   * @param {string|geo.transform} [gcs] undefined to use the interface gcs,
   *    null to use the map gcs, or any other transform.
   * @return {object} Object containing keys 'center' and 'zoom'
   */
  ////////////////////////////////////////////////////////////////////////////
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
      center = transform.transformCoordinates(m_gcs, gcs, [center])[0];
    }
    return {
      zoom: zoom,
      center: center
    };
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the bounds that will be displayed with the given zoom and center.
   *
   * Note: the bounds may not have the requested zoom and center due to map
   * restrictions.
   *
   * @param {number} zoom The requested zoom level
   * @param {geo.geoPosition} center The requested center
   * @param {number} rotation The requested rotation
   * @param {string|geo.transform} [gcs] undefined to use the interface gcs,
   *    null to use the map gcs, or any other transform.
   * @param {boolean} ignoreDiscreteZoom if true, ignore the discreteZoom
   *    option when determining the new view.
   * @return {geo.geoBounds}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.boundsFromZoomAndCenter = function (zoom, center, rotation, gcs,
                                           ignoreDiscreteZoom) {
    var width, height, halfw, halfh, bounds, units;

    gcs = (gcs === null ? m_gcs : (gcs === undefined ? m_ingcs : gcs));
    // preprocess the arguments
    zoom = fix_zoom(zoom, ignoreDiscreteZoom);
    units = m_this.unitsPerPixel(zoom);
    center = m_this.gcsToWorld(center, gcs);

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
      bounds = fix_bounds(bounds, rotation);
    } else {
      bounds = {
        left: center.x - halfw + m_origin.x,
        right: center.x + halfw + m_origin.x,
        bottom: center.y - halfh + m_origin.y,
        top: center.y + halfh + m_origin.y
      };
      // correct the bounds when clamping is enabled
      bounds = fix_bounds(bounds, 0);
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/set the discrete zoom flag.
   *
   * @param {bool} If specified, the discrete zoom flag.
   * @return {bool} The current discrete zoom flag if no parameter is
   *                specified, otherwise the map object.
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the layers contained in the map.
   * Alias of {@linkcode geo.sceneObject.children}.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.layers = this.children;

  ////////////////////////////////////////////////////////////////////////////
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
   * notices has changed.  Users, in general, should not need to call this.
   * @returns {this} Chainable
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateAttribution = function () {
    // clear any existing attribution content
    m_this.node().find('.geo-attribution').remove();

    // generate a new attribution node
    var $a = $('<div/>')
      .addClass('geo-attribution')
      .css({
        position: 'absolute',
        right: '0px',
        bottom: '0px',
        'padding-right': '5px',
        cursor: 'auto',
        font: '11px/1.5 "Helvetica Neue", Arial, Helvetica, sans-serif',
        'z-index': '1001',
        background: 'rgba(255,255,255,0.7)',
        clear: 'both',
        display: 'block',
        'pointer-events': 'auto'
      }).on('mousedown', function (evt) {
        evt.stopPropagation();
      });

    // append content from each layer
    m_this.children().forEach(function (layer) {
      var content = layer.attribution();
      if (content) {
        $('<span/>')
          .addClass('geo-attribution-layer')
          .css({
            'padding-left': '5px'
          })
          .html(content)
          .appendTo($a);
      }
    });

    $a.appendTo(m_this.node());
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  //
  // The following are some private methods for interacting with the camera.
  // In order to hide the complexity of dealing with map aspect ratios,
  // clamping behavior, reseting zoom levels on resize, etc. from the
  // layers, the map handles camera movements directly.  This requires
  // passing all camera movement events through the map initially.  The
  // map uses these methods to fix up the events according to the constraints
  // of the display and passes the event to the layers.
  //
  ////////////////////////////////////////////////////////////////////////////
  /**
   * Calculate the scaling factor to fit the given map bounds
   * into the viewport with the correct aspect ratio.
   * @param {object} bounds A desired bounds
   * @return {object} Multiplicative aspect ratio correction
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
   * Adjust a set of bounds based on a rotation.
   * @private.
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
   * @private.
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
   * Calculate the minimum zoom level to fit the given
   * bounds inside the view port using the view port size,
   * the given bounds, and the number of units per
   * pixel.  The method sets the valid zoom bounds as well
   * as the current zoom level to be within that range.
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
   * @private
   * @param {number} zoom a zoom level to adjust to current settings
   * @param {boolean} ignoreDiscreteZoom if true, ignore the discreteZoom
   *    option when determining the new view.
   * @returns {number} the zoom level clamped to the allowed zoom range and
   *    with other settings applied.
   */
  function fix_zoom(zoom, ignoreDiscreteZoom) {
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
   * Return the nearest valid bounds maintaining the
   * width and height. Does nothing if m_clampBounds* is
   * false.
   * @private
   */
  function fix_bounds(bounds, rotation) {
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
    if (m_clampBoundsX) {
      if (bounds.right - bounds.left > maxBounds.right - maxBounds.left) {
        dx = maxBounds.left - ((bounds.right - bounds.left - (
          maxBounds.right - maxBounds.left)) / 2) - bounds.left;
      } else if (bounds.left < maxBounds.left) {
        dx = maxBounds.left - bounds.left;
      } else if (bounds.right > maxBounds.right) {
        dx = maxBounds.right - bounds.right;
      }
      if (dx) {
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
      if (dy) {
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
   * Call the camera bounds method with the given bounds, but
   * correct for the viewport aspect ratio.
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
  }

  ////////////////////////////////////////////////////////////////////////////
  //
  // All the methods are now defined.  From here, we are initializing all
  // internal variables and event handlers.
  //
  ////////////////////////////////////////////////////////////////////////////

  // Set the world origin
  m_origin = {x: 0, y: 0};

  // Fix the zoom level (minimum and initial)
  this.zoomRange(arg, true);
  m_zoom = fix_zoom(m_zoom);
  m_rotation = fix_rotation(m_rotation);
  // Now update to the correct center and zoom level
  this.center($.extend({}, arg.center || m_center), undefined);

  this.interactor(arg.interactor || mapInteractor({discreteZoom: m_discreteZoom}));
  this.clock(arg.clock || clock());

  function resizeSelf() {
    m_this.resize(0, 0, m_node.width(), m_node.height());
  }

  if (arg.autoResize) {
    $(window).resize(resizeSelf);
  }

  // attach attribution updates to layer events
  m_this.geoOn([
    geo_event.layerAdd,
    geo_event.layerRemove
  ], m_this.updateAttribution);

  return this;
};

/**
 * General object specification for map types.  Any additional
 * values in the object are passed to the map constructor.
 * @typedef geo.map.spec
 * @type {object}
 * @property {object[]} [data=[]] The default data array to
 * apply to each feature if none exists
 * @property {geo.layer.spec[]} [layers=[]] Layers to create
 */

/**
 * Create a map from an object.  Any errors in the creation
 * of the map will result in returning null.
 * @param {geo.map.spec} spec The object specification
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
