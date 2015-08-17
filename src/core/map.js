//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class map.
 *
 * Creation tags a dictionary of arguments, which can include:
 *  center: {x: (center x value), y: (center y value)}
 *  gcs:
 *  node:
 *  layers:
 *  zoom: (number) - initial zoom level
 *  min: (number) - minimum zoom level
 *  max: (number) - maximum zoom level
 *  width:
 *  height:
 *  camera: (geo.camera) - if provided it will use the given camera, otherwise
 *      a new camera will be created for the map.
 *  discreteZoom: (bool) - true to only allow integer zoom levels, false to
 *      allow any zoom level.
 *  autoResize:
 *  clampBounds:
 *  interactor:
 *  clock:
 *
 * Creates a new map inside of the given HTML layer (Typically DIV)
 * @class
 * @extends geo.sceneObject
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
      m_x = 0,
      m_y = 0,
      m_node = $(arg.node),
      m_width = arg.width || m_node.width(),
      m_height = arg.height || m_node.height(),
      m_gcs = arg.gcs === undefined ? 'EPSG:4326' : arg.gcs,
      m_center = { x: 0, y: 0 },
      m_zoom = arg.zoom === undefined ? 4 : arg.zoom,
      m_baseLayer = null,
      m_fileReader = null,
      m_interactor = null,
      m_validZoomRange = { min: 0, max: 16 },
      m_transition = null,
      m_queuedTransition = null,
      m_clock = null,
      m_discreteZoom = arg.discreteZoom ? true : false,
      m_bounds = {},
      m_camera = arg.camera || geo.camera();

  arg.center = geo.util.normalizeCoordinates(arg.center);
  arg.autoResize = arg.autoResize === undefined ? true : arg.autoResize;
  arg.clampBounds = arg.clampBounds === undefined ? true : arg.clampBounds;

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
  this.zoom = function (val, direction, ignoreDiscreteZoom) {
    var base, evt, recenter = false;
    if (val === undefined) {
      return m_zoom;
    }

    /* The ignoreDiscreteZoom flag is intended to allow non-integer zoom values
     * during animation. */
    if (m_discreteZoom && val !== Math.round(val) && !ignoreDiscreteZoom) {
      /* If we are using discrete zoom levels and the value we were given is
       * not an integer, then try to detect if we are enlarging or shrinking
       * and perform the expected behavior.  Otherwise, make sure we are at an
       * integer level.  We may need to revisit for touch zoom events. */
      if (m_zoom !== Math.round(m_zoom) || Math.abs(val - m_zoom) < 0.01) {
        val = Math.round(m_zoom);
      } else if (val < m_zoom) {
        val = Math.min(Math.round(val), m_zoom - 1);
      } else if (val > m_zoom) {
        val = Math.max(Math.round(val), m_zoom + 1);
      }
    }
    val = Math.min(m_validZoomRange.max, Math.max(val, m_validZoomRange.min));
    if (val === m_zoom) {
      return m_this;
    }

    base = m_this.baseLayer();

    evt = {
      geo: {},
      zoomLevel: val,
      screenPosition: direction,
      eventType: geo.event.zoom
    };

    if (base) {
      base.geoTrigger(geo.event.zoom, evt, true);
    }

    recenter = evt.center;
    if (!evt.geo.preventDefault) {

      m_zoom = val;
      m_this._updateBounds();

      m_this.children().forEach(function (child) {
        child.geoTrigger(geo.event.zoom, evt, true);
      });

      m_this.modified();
    }

    if (evt.center) {
      m_this.center(recenter);
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
   * @param {bool?} force Disable bounds clamping
   * @returns {geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pan = function (delta, force) {

    var base = m_this.baseLayer(),
        evt, pt, corner1, corner2;

    return;
    if (arg.clampBounds && !force && m_width && m_height) {
      pt = m_this.displayToGcs({
        x: delta.x,
        y: delta.y
      });

      corner1 = m_this.gcsToDisplay({
        x: -180,
        y: 82
      });
      corner2 = m_this.gcsToDisplay({
        x: 180,
        y: -82
      });

      if (corner1.x > 0 && corner2.x < m_width) {
        // if the map is too small horizontally
        delta.x = (-corner1.x + m_width - corner2.x) / 2;
      } else {
        delta.x = Math.max(Math.min(delta.x, -corner1.x), m_width - corner2.x);
      }
      if (corner1.y > 0 && corner2.y < m_height) {
        // if the map is too small horizontally
        delta.y = (-corner1.y + m_height - corner2.y) / 2;
      } else {
        delta.y = Math.max(Math.min(delta.y, -corner1.y), m_height - corner2.y);
      }
    }

    evt = {
      geo: {},
      screenDelta: delta,
      eventType: geo.event.pan
    };
    // first pan the base layer
    if (base) {
      base.geoTrigger(geo.event.pan, evt, true);
    }

    // If the base renderer says the pan is invalid, then cancel the action.
    if (evt.geo.preventDefault) {
      return;
    }
    m_center = m_this.displayToGcs({
      x: m_width / 2,
      y: m_height / 2
    });
    m_this._updateBounds();

    m_this.children().forEach(function (child) {
      if (child !== base) {
        child.geoTrigger(geo.event.pan, evt, true);
      }
    });

    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Set center of the map to the given geographic coordinates, or get the
   * current center.  Uses bare objects {x: 0, y: 0}.
   *
   * @param {Object} coordinates
   * @returns {Object|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.center = function (coordinates/*, force */) {
    var newCenter, currentCenter;

    if (coordinates === undefined) {
      return m_center;
    }

    // UGH... deal with this later

    // get the screen coordinates of the new center
    coordinates = geo.util.normalizeCoordinates(coordinates);
    newCenter = m_this.gcsToDisplay(coordinates);
    currentCenter = m_this.gcsToDisplay(m_center);

    m_center = coordinates;

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
   * Get/Set parallel projection setting of the map
   *
   * @returns {Boolean|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.parallelProjection = function (val) {
    if (val === undefined) {
      return m_parallelProjection;
    }
    val = val ? true : false;
    if (m_parallelProjection !== val) {
      var base, evt = {
        eventType: geo.event.parallelprojection,
        parallelProjection: val
      };

      m_parallelProjection = val;
      base = m_this.baseLayer();
      base.geoTrigger(geo.event.parallelprojection, evt, true);
      m_this.children().forEach(function (child) {
        child.geoTrigger(geo.event.parallelprojection, evt, true);
      });
      m_this.modified();
    }
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
    arg.parallelProjection = m_parallelProjection;
    var newLayer = geo.createLayer(
      layerName, m_this, arg);

    if (newLayer) {
      newLayer._resize(m_x, m_y, m_width, m_height);
    } else {
      return null;
    }

    if (newLayer.referenceLayer() || m_this.children().length === 0) {
      m_this.baseLayer(newLayer);
    }

    newLayer._resize(m_x, m_y, m_width, m_height); // this call initializes the camera
    m_this.addChild(newLayer);
    m_this.modified();

    m_this.geoTrigger(geo.event.layerAdd, {
      type: geo.event.layerAdd,
      target: m_this,
      layer: newLayer
    });

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
   * Resize map (depreciated)
   *
   * @param {Number} x x-offset in display space
   * @param {Number} y y-offset in display space
   * @param {Number} w width in display space
   * @param {Number} h height in display space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.resize = function (x, y, w, h) {
    var i, layers = m_this.children();

    m_x = x;
    m_y  = y;
    m_width = w;
    m_height = h;

    for (i = 0; i < layers.length; i += 1) {
      layers[i]._resize(x, y, w, h);
    }

    m_this.geoTrigger(geo.event.resize, {
      type: geo.event.resize,
      target: m_this,
      x: m_x,
      y: m_y,
      width: w,
      height: h
    });

    m_this._updateBounds();
    m_this.pan({x: 0, y: 0});
    m_this.modified();

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from source coordinates to display coordinates
   * @return {object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.gcsToDisplay = function (input) {
    return input;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from display to latitude longitude coordinates
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToGcs = function (input) {
    return input;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Sets or gets base layer for this map
   *
   * @param {geo.layer} baseLayer optional
   * @returns {geo.map|geo.layer}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.baseLayer = function (baseLayer) {
    var save;
    if (baseLayer !== undefined) {

      m_baseLayer = baseLayer;

      // Set the layer as the reference layer
      m_baseLayer.referenceLayer(true);

      if (arg.center) {
        // This assumes that the base layer is initially centered at
        // (0, 0).  May want to add an explicit call to the base layer
        // to set a given center.
        m_this.center(arg.center, true);
      }
      save = m_zoom;
      m_zoom = null;
      m_this.zoom(save);

      m_this._updateBounds();

      // This forces the map into a state with valid bounds
      // when clamping is on.  The original call to center
      // is forced to initialize the camera position in the
      // base layer so no adjustment is done there.
      m_this.pan({x: 0, y: 0});
      return m_this;
    }
    return m_baseLayer;
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
  this._init = function (arg) {
    var i;

    if (m_node === undefined || m_node === null) {
      throw 'Map require DIV node';
    }

    m_node.css('position', 'relative');
    if (arg !== undefined && arg.layers !== undefined) {
      for (i = 0; i < arg.layers.length; i += 1) {
        if (i === 0) {
          m_this.baseLayer(arg.layers[i]);
        }

        m_this.addLayer(arg.layers[i]);
      }
    }
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
    m_validZoomRange.min = arg.min;
    m_validZoomRange.max = arg.max;
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
   * @returns {geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.transition = function (opts) {

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

    // Transform zoom level into z-coordinate and inverse
    function zoom2z(z) {
      return vgl.zoomToHeight(z + 1, m_width, m_height);
    }
    function z2zoom(z) {
      return vgl.heightToZoom(z, m_width, m_height) - 1;
    }

    var defaultOpts = {
      center: m_this.center(),
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
      opts.center = geo.util.normalizeCoordinates(opts.center);
    }
    $.extend(defaultOpts, opts);

    m_transition = {
      start: {
        center: m_this.center(),
        zoom: m_this.zoom()
      },
      end: {
        center: defaultOpts.center,
        zoom: m_discreteZoom ? Math.round(defaultOpts.zoom) : defaultOpts.zoom
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
          m_this.center(m_transition.end.center);
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
      });
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
   * Update the internally cached map bounds.
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  this._updateBounds = function () {
    m_bounds.lowerLeft = m_this.displayToGcs({
      x: 0,
      y: m_height
    });
    m_bounds.lowerRight = m_this.displayToGcs({
      x: m_width,
      y: m_height
    });
    m_bounds.upperLeft = m_this.displayToGcs({
      x: 0,
      y: 0
    });
    m_bounds.upperRight = m_this.displayToGcs({
      x: m_width,
      y: 0
    });
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
   * @return {geo.geoBounds} The actual new map bounds
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bounds = function (bds) {
    var nav;

    if (bds === undefined) {
      return m_bounds;
    }

    nav = m_this.zoomAndCenterFromBounds(bds);
    m_this.zoom(nav.zoom);
    m_this.center(nav.center);
    return m_bounds;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get the center zoom level necessary to display the given lat/lon bounds.
   *
   * @param {geo.geoBounds} [bds] The requested map bounds
   * @return {object} Object containing keys 'center' and 'zoom'
   */
  ////////////////////////////////////////////////////////////////////////////
  this.zoomAndCenterFromBounds = function (bds) {
    var ll, ur, dx, dy, zx, zy, center, zoom;

    // Caveat:
    // Much of the following is invalid for alternative map projections.  These
    // computations should really be defered to the base layer, but there is
    // no clear path for doing that with the current base layer api.

    // extract bounds info and check for validity
    ll = geo.util.normalizeCoordinates(bds.lowerLeft || {});
    ur = geo.util.normalizeCoordinates(bds.upperRight || {});

    if (ll.x >= ur.x || ll.y >= ur.y) {
      throw new Error('Invalid bounds provided');
    }

    center = {
      x: (ll.x + ur.x) / 2,
      y: (ll.y + ur.y) / 2
    };

    // calculate the current extend
    dx = m_bounds.upperRight.x - m_bounds.lowerLeft.x;
    dy = m_bounds.upperRight.y - m_bounds.lowerLeft.y;

    // calculate the zoom levels necessary to fit x and y bounds
    zx = m_zoom - Math.log2((ur.x - ll.x) / dx);
    zy = m_zoom - Math.log2((ur.y - ll.y) / dy);
    zoom = Math.min(zx, zy);
    if (m_discreteZoom) {
      zoom = Math.floor(zoom);
    }

    return {
      zoom: zoom,
      center: center
    };
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
