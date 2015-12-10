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
 * @class
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
 * @param {number?} width The map width (default node width)
 * @param {number?} height The map height (default node height)
 *
 * *** Navigation ***
 * @param {number} [min=0]  Minimum zoom level (though fitting to the viewport
 *   may make it so this is smaller than the smallest possible value)
 * @param {number} [max=16]  Maximum zoom level
 * @param {boolean} [discreteZoom=false]  True to only allow integer zoom
 *   levels.  False for any zoom level.
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
geo.map = function (arg) {
  'use strict';
  if (!(this instanceof geo.map)) {
    return new geo.map(arg);
  }
  arg = arg || {};
  geo.sceneObject.call(this, arg);

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
      m_fileReader = null,
      m_interactor = null,
      m_validZoomRange = {min: 0, max: 16, origMin: 0},
      m_transition = null,
      m_queuedTransition = null,
      m_clock = null,
      m_discreteZoom = arg.discreteZoom ? true : false,
      m_maxBounds = arg.maxBounds || {},
      m_camera = arg.camera || geo.camera(),
      m_unitsPerPixel,
      m_clampBoundsX,
      m_clampBoundsY,
      m_clampZoom,
      m_origin,
      m_scale = {x: 1, y: 1, z: 1}; // constant for the moment

  /* Compute the maximum bounds on our map projection.  By default, x ranges
   * from [-180, 180] in the interface projection, and y matches the x range in
   * the map (not the interface) projection.  For images, this might be
   * [0, width] and [0, height] instead. */
  m_maxBounds.left = geo.transform.transformCoordinates(m_ingcs, m_gcs, [{
    x: m_maxBounds.left !== undefined ? m_maxBounds.left : -180, y: 0}])[0].x;
  m_maxBounds.right = geo.transform.transformCoordinates(m_ingcs, m_gcs, [{
    x: m_maxBounds.right !== undefined ? m_maxBounds.right : 180, y: 0}])[0].x;
  m_maxBounds.top = (m_maxBounds.top !== undefined ?
    geo.transform.transformCoordinates(m_ingcs, m_gcs, [{
    x: 0, y: m_maxBounds.top}])[0].y : m_maxBounds.right);
  m_maxBounds.bottom = (m_maxBounds.bottom !== undefined ?
    geo.transform.transformCoordinates(m_ingcs, m_gcs, [{
    x: 0, y: m_maxBounds.bottom}])[0].y : m_maxBounds.left);
  m_unitsPerPixel = (arg.unitsPerPixel || (
    m_maxBounds.right - m_maxBounds.left) / 256);

  m_camera.viewport = {width: m_width, height: m_height};
  arg.center = geo.util.normalizeCoordinates(arg.center);
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
    m_gcs = arg;
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
   * @returns {Number|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.zoom = function (val, origin, ignoreDiscreteZoom) {
    var evt, oldZoom, bounds;
    if (val === undefined) {
      return m_zoom;
    }

    oldZoom = m_zoom;
    /* The ignoreDiscreteZoom flag is intended to allow non-integer zoom values
     * during animation. */
    val = fix_zoom(val, ignoreDiscreteZoom);
    if (val === m_zoom) {
      return m_this;
    }

    m_zoom = val;

    bounds = m_this.boundsFromZoomAndCenter(val, m_center, null);
    m_this.modified();

    camera_bounds(bounds);
    evt = {
      geo: {},
      zoomLevel: m_zoom,
      screenPosition: origin ? origin.map : undefined,
      eventType: geo.event.zoom
    };
    m_this.geoTrigger(geo.event.zoom, evt);

    if (origin && origin.geo && origin.map) {
      var shifted = m_this.gcsToDisplay(origin.geo);
      m_this.pan({x: origin.map.x - shifted.x, y: origin.map.y - shifted.y});
    } else {
      m_this.pan({x: 0, y: 0});
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Pan the map by (x: dx, y: dy) pixels.
   *
   * @param {Object} delta
   * @returns {geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pan = function (delta) {
    var evt, unit;
    evt = {
      geo: {},
      screenDelta: delta,
      eventType: geo.event.pan
    };

    unit = m_this.unitsPerPixel(m_zoom);

    m_camera.pan({
      x: delta.x * unit,
      y: -delta.y * unit
    });
    /* If m_clampBounds* is true, clamp the pan */
    var bounds = fix_bounds(m_camera.bounds);
    if (bounds !== m_camera.bounds) {
      var panPos = this.gcsToDisplay({
            x: m_camera.bounds.left, y: m_camera.bounds.top});
      camera_bounds(bounds);
      var clampPos = this.gcsToDisplay({
            x: m_camera.bounds.left, y: m_camera.bounds.top});
      evt.screenDelta.x += clampPos.x - panPos.x;
      evt.screenDelta.y += clampPos.y - panPos.y;
    }

    m_center = m_camera.displayToWorld({
      x: m_width / 2,
      y: m_height / 2
    });

    m_this.geoTrigger(geo.event.pan, evt);

    m_this.modified();
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
   * @returns {Object|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.center = function (coordinates, gcs) {
    gcs = (gcs === null ? m_gcs : (gcs === undefined ? m_ingcs : gcs));
    var center;
    if (coordinates === undefined) {
      center = $.extend({}, m_this.worldToGcs(m_center));
      if (gcs !== m_gcs) {
        center = geo.transform.transformCoordinates(m_gcs, gcs, [center])[0];
      }
      return center;
    }

    center = coordinates;
    if (gcs !== m_gcs) {
      center = geo.transform.transformCoordinates(gcs, m_gcs, [center])[0];
    }
    // get the screen coordinates of the new center
    m_center = $.extend({}, m_this.gcsToWorld(center));

    camera_bounds(m_this.boundsFromZoomAndCenter(m_zoom, m_center, null));
    // trigger a pan event
    m_this.geoTrigger(
      geo.event.pan,
      {
        geo: coordinates,
        screenDelta: null,
        eventType: geo.event.pan
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
    var newLayer = geo.createLayer(
      layerName, m_this, arg);

    if (newLayer) {

      m_this.addChild(newLayer);
      newLayer._update();
      m_this.modified();

      m_this.geoTrigger(geo.event.layerAdd, {
        type: geo.event.layerAdd,
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

      m_this.geoTrigger(geo.event.layerRemove, {
        type: geo.event.layerRemove,
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
   * Toggle visibility of a layer
   *
   *  @param {geo.layer} layer
   *  @returns {Boolean}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.toggle = function (layer) {
    if (layer !== null && layer !== undefined) {
      layer.visible(!layer.visible());
      m_this.modified();

      m_this.geoTrigger(geo.event.layerToggle, {
        type: geo.event.layerToggle,
        target: m_this,
        layer: layer
      });
    }
    return m_this;
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
   * Resize map (deprecated)
   *
   * @param {Number} x x-offset in display space
   * @param {Number} y y-offset in display space
   * @param {Number} w width in display space
   * @param {Number} h height in display space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resize = function (x, y, w, h) {
    m_x = x;
    m_y = y;
    m_width = w;
    m_height = h;

    m_this.camera().viewport = {width: w, height: h};

    reset_minimum_zoom();
    var newZoom = fix_zoom(m_zoom);
    if (newZoom !== m_zoom) {
      this.zoom(newZoom);
    }

    m_this.geoTrigger(geo.event.resize, {
      type: geo.event.resize,
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
    if (gcs !== undefined && gcs !== m_gcs) {
      c = geo.transform.transformCoordinates(gcs, m_gcs, [c])[0];
    }
    return geo.transform.affineForward(
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
   * @param {string?} gcs The gcs of the output (map.gcs() by default)
   * @return {object} GCS space coordinates
   */
  ////////////////////////////////////////////////////////////////////////////
  this.worldToGcs = function (c, gcs) {
    c = geo.transform.affineInverse(
      {origin: m_origin},
      [c]
    )[0];
    if (gcs !== undefined && gcs !== m_gcs) {
      c = geo.transform.transformCoordinates(m_gcs, gcs, [c])[0];
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
   * @param {string?} gcs The gcs of the input (map.gcs() by default)
   * @return {object} Display space coordinates
   */
  ////////////////////////////////////////////////////////////////////////////
  this.gcsToDisplay = function (c, gcs) {
    c = this.gcsToWorld(c, gcs);
    return this.worldToDisplay(c);
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
   * @param {string?} gcs The gcs of the output (map.gcs() by default)
   * @return {object} GCS space coordinates
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToGcs = function (c, gcs) {
    c = this.displayToWorld(c); // done via camera
    return this.worldToGcs(c, gcs);
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

    m_this.geoTrigger(geo.event.draw, {
        type: geo.event.draw,
        target: m_this
      }
    );

    m_this._update();

    for (i = 0; i < layers.length; i += 1) {
      layers[i].draw();
    }

    m_this.geoTrigger(geo.event.drawEnd, {
        type: geo.event.drawEnd,
        target: m_this
      }
    );

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
    m_fileReader = geo.createFileReader(readerType, opts);
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
   * @returns {Object|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.zoomRange = function (arg) {
    if (arg === undefined) {
      return $.extend({}, m_validZoomRange);
    }
    if (arg.max !== undefined) {
      m_validZoomRange.max = arg.max;
    }

    // don't allow the minimum zoom to go below what will
    // fit in the view port
    if (arg.min !== undefined) {
      m_validZoomRange.min = m_validZoomRange.origMin = fix_zoom(arg.min);
    }
    reset_minimum_zoom();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Start an animated zoom/pan.
   *
   * Options:
   * <pre>
   *   opts = {
   *     center: { x: ... , y: ... } // the new center
   *     zoom: ... // the new zoom level
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
  this.transition = function (opts, gcs) {

    if (opts === undefined) {
      return m_transition;
    }

    if (m_transition) {
      m_queuedTransition = opts;
      return m_this;
    }

    function interp1(p0, p1, t) {
      return p0 + (p1 - p0) * t;
    }
    function defaultInterp(p0, p1) {
      return function (t) {
        return [
          interp1(p0[0], p1[0], t),
          interp1(p0[1], p1[1], t),
          interp1(p0[2], p1[2], t)
        ];
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
      opts.center = geo.util.normalizeCoordinates(opts.center);
      if (gcs !== m_gcs) {
        opts.center = geo.transform.transformCoordinates(gcs, m_gcs, [
            opts.center])[0];
      }
    }
    $.extend(defaultOpts, opts);

    m_transition = {
      start: {
        center: m_this.center(undefined, null),
        zoom: m_this.zoom()
      },
      end: {
        center: defaultOpts.center,
        zoom: fix_zoom(defaultOpts.zoom)
      },
      ease: defaultOpts.ease,
      zCoord: defaultOpts.zCoord,
      done: defaultOpts.done,
      duration: defaultOpts.duration
    };

    if (defaultOpts.zCoord) {
      m_transition.interp = defaultOpts.interp(
        [
          m_transition.start.center.x,
          m_transition.start.center.y,
          zoom2z(m_transition.start.zoom)
        ],
        [
          m_transition.end.center.x,
          m_transition.end.center.y,
          zoom2z(m_transition.end.zoom)
        ]
      );
    } else {
      m_transition.interp = defaultOpts.interp(
        [
          m_transition.start.center.x,
          m_transition.start.center.y,
          m_transition.start.zoom
        ],
        [
          m_transition.end.center.x,
          m_transition.end.center.y,
          m_transition.end.zoom
        ]
      );
    }

    function anim(time) {
      var done = m_transition.done, next;
      next = m_queuedTransition;

      if (!m_transition.start.time) {
        m_transition.start.time = time;
        m_transition.end.time = time + defaultOpts.duration;
      }
      m_transition.time = time - m_transition.start.time;
      if (time >= m_transition.end.time || next) {
        if (!next) {
          m_this.center(m_transition.end.center, null);
          m_this.zoom(m_transition.end.zoom);
        }

        m_transition = null;

        m_this.geoTrigger(geo.event.transitionend, defaultOpts);

        if (done) {
          done();
        }

        if (next) {
          m_queuedTransition = null;
          m_this.transition(next);
        }

        return;
      }

      var z = m_transition.ease(
        (time - m_transition.start.time) / defaultOpts.duration
      );

      var p = m_transition.interp(z);
      if (m_transition.zCoord) {
        p[2] = z2zoom(p[2]);
      }
      m_this.center({
        x: p[0],
        y: p[1]
      }, null);
      m_this.zoom(p[2], undefined, true);

      window.requestAnimationFrame(anim);
    }

    m_this.geoTrigger(geo.event.transitionstart, defaultOpts);

    if (defaultOpts.cancelNavigation) {
      m_this.geoTrigger(geo.event.transitionend, defaultOpts);
      return m_this;
    } else if (defaultOpts.cancelAnimation) {
      // run the navigation synchronously
      defaultOpts.duration = 0;
      anim(0);
    } else {
      window.requestAnimationFrame(anim);
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/set the locations of the current map corners as latitudes/longitudes.
   * When provided the argument should be an object containing the keys
   * lowerLeft and upperRight declaring the desired new map bounds.  The
   * new bounds will contain at least the min/max lat/lngs provided.  In any
   * case, the actual new bounds will be returned by this function.
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
        var trans = geo.transform.transformCoordinates(gcs, m_gcs, [{
            x: bds.left, y: bds.top}, {x: bds.right, y: bds.bottom}]);
        bds = {
          left: trans[0].x,
          top: trans[0].y,
          right: trans[1].x,
          bottom: trans[1].y
        };
      }
      bds = fix_bounds(bds);
      nav = m_this.zoomAndCenterFromBounds(bds, null);
      m_zoom = nav.zoom;
      m_center = nav.center;
      camera_bounds(bds);
    }

    return m_this.boundsFromZoomAndCenter(m_zoom, m_center, gcs);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the center zoom level necessary to display the given lat/lon bounds.
   *
   * @param {geo.geoBounds} [bds] The requested map bounds
   * @param {string|geo.transform} [gcs] undefined to use the interface gcs,
   *    null to use the map gcs, or any other transform.
   * @return {object} Object containing keys 'center' and 'zoom'
   */
  ////////////////////////////////////////////////////////////////////////////
  this.zoomAndCenterFromBounds = function (bounds, gcs) {
    var center, zoom;

    gcs = (gcs === null ? m_gcs : (gcs === undefined ? m_ingcs : gcs));
    if (gcs !== m_gcs) {
      var trans = geo.transform.transformCoordinates(gcs, m_gcs, [{
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
    zoom = fix_zoom(calculate_zoom(bounds));

    // clamp bounds if necessary
    bounds = fix_bounds(bounds);

    /* This relies on having the map projection coordinates be uniform
     * regardless of location.  If not, the center will not be correct. */
    // calculate new center
    center = {
      x: (bounds.left + bounds.right) / 2 - m_origin.x,
      y: (bounds.top + bounds.bottom) / 2 - m_origin.y
    };

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
   * @param {string|geo.transform} [gcs] undefined to use the interface gcs,
   *    null to use the map gcs, or any other transform.
   * @return {geo.geoBounds}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.boundsFromZoomAndCenter = function (zoom, center, gcs) {
    var width, height, bounds, units;

    gcs = (gcs === null ? m_gcs : (gcs === undefined ? m_ingcs : gcs));
    // preprocess the arguments
    zoom = fix_zoom(zoom);
    units = m_this.unitsPerPixel(zoom);
    center = m_this.gcsToWorld(center, gcs);

    // get half the width and height in world coordinates
    width = m_width * units / 2;
    height = m_height * units / 2;

    // calculate the bounds.  This is only valid if the map projection has
    // uniform units in each direction.  If not, then worldToGcs should be
    // used.
    bounds = {
      left: center.x - width + m_origin.x,
      right: center.x + width + m_origin.x,
      bottom: center.y - height + m_origin.y,
      top: center.y + height + m_origin.y
    };

    // correct the bounds when clamping is enabled
    return fix_bounds(bounds);
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
   * Calculate the minimum zoom level to fit the given
   * bounds inside the view port using the view port size,
   * the given bounds, and the number of units per
   * pixel.  The method sets the valid zoom bounds as well
   * as the current zoom level to be within that range.
   * @private
   */
  function calculate_zoom(bounds) {
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
   * Return the nearest valid bounds maintaining the
   * width and height. Does nothing if m_clampBounds* is
   * false.
   * @private
   */
  function fix_bounds(bounds) {
    var dx, dy;
    if (m_clampBoundsX) {
      if (bounds.right - bounds.left > m_maxBounds.right - m_maxBounds.left) {
        dx = m_maxBounds.left - ((bounds.right - bounds.left - (
          m_maxBounds.right - m_maxBounds.left)) / 2) - bounds.left;
      } else if (bounds.left < m_maxBounds.left) {
        dx = m_maxBounds.left - bounds.left;
      } else if (bounds.right > m_maxBounds.right) {
        dx = m_maxBounds.right - bounds.right;
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
      if (bounds.top - bounds.bottom > m_maxBounds.top - m_maxBounds.bottom) {
        dy = m_maxBounds.bottom - ((bounds.top - bounds.bottom - (
          m_maxBounds.top - m_maxBounds.bottom)) / 2) - bounds.bottom;
      } else if (bounds.top > m_maxBounds.top) {
        dy = m_maxBounds.top - bounds.top;
      } else if (bounds.bottom < m_maxBounds.bottom) {
        dy = m_maxBounds.bottom - bounds.bottom;
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
  function camera_bounds(bounds) {
    m_camera.bounds = bounds;
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
  this.zoomRange(arg);
  m_zoom = fix_zoom(m_zoom);
  // Now update to the correct center and zoom level
  this.center($.extend({}, arg.center || m_center), m_ingcs);

  this.interactor(arg.interactor || geo.mapInteractor());
  this.clock(arg.clock || geo.clock());

  function resizeSelf() {
    m_this.resize(0, 0, m_node.width(), m_node.height());
  }

  if (arg.autoResize) {
    $(window).resize(resizeSelf);
  }

  // attach attribution updates to layer events
  m_this.geoOn([
    geo.event.layerAdd,
    geo.event.layerRemove
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
geo.map.create = function (spec) {
  'use strict';

  var map = geo.map(spec);

  if (!map) {
    console.warn('Could not create map.');
    return null;
  }

  spec.data = spec.data || [];
  spec.layers = spec.layers || [];

  spec.layers.forEach(function (l) {
    l.data = l.data || spec.data;
    l.layer = geo.layer.create(map, l);
  });

  return map;
};

inherit(geo.map, geo.sceneObject);
