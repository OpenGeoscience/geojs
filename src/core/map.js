//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class map
 *
 * Creates a new map inside of the given HTML layer (Typically DIV)
 * @class
 * @returns {geo.map}
 */
//////////////////////////////////////////////////////////////////////////////
geo.map = function (arg) {
  "use strict";
  if (!(this instanceof geo.map)) {
    return new geo.map(arg);
  }
  arg = arg || {};
  geo.sceneObject.call(this, arg);
  arg.layers = arg.layers === undefined ? [] : arg.layers;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private member variables
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_x = 0,
      m_y = 0,
      m_node = $(arg.node),
      m_width = arg.width || m_node.width(),
      m_height = arg.height || m_node.height(),
      m_gcs = arg.gcs === undefined ? "EPSG:4326" : arg.gcs,
      m_uigcs = arg.uigcs === undefined ? "EPSG:4326" : arg.uigcs,
      m_center = { x: 0, y: 0 },
      m_zoom = arg.zoom === undefined ? 1 : arg.zoom,
      m_baseLayer = null,
      m_fileReader = null,
      m_interactor = null,
      m_validZoomRange = { min: 0, max: 16 },
      m_transition = null,
      m_clock = null,
      m_bounds = {};


  arg.center = geo.util.normalizeCoordinates(arg.center);

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
   * Get map user interface GCS
   *
   * @returns {string}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.uigcs = function () {
    return m_uigcs;
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
  this.zoom = function (val, direction) {
    var base, evt, previousCenter;
    if (val === undefined) {
      return m_zoom;
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
      base.renderer().geoTrigger(geo.event.zoom, evt, true);
    }

    if (evt.geo.preventDefault) {
      return;
    }

    m_zoom = val;
    previousCenter = m_center;
    m_center = m_this.displayToGcs({
      x: m_width / 2,
      y: m_height / 2
    });

    evt.gcsDelta = {
      x: m_center.x - previousCenter.x,
      y: m_center.y - previousCenter.y
    };
    m_this._updateBounds();

    m_this.children().forEach(function (child) {
      child.geoTrigger(geo.event.zoom, evt, true);
    });

    m_this.modified();
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
        evt,
        pt, corner1, corner2;

    if (!force) {
      // clamp to the visible screen:
      pt = m_this.displayToGcs({
        x: delta.x,
        y: delta.y
      });

      // TODO: This needs to be abstracted somehow with the projection
      corner1 = m_this.gcsToDisplay({
        x: -180,
        y: 82
      });
      corner2 = m_this.gcsToDisplay({
        x: 180,
        y: -82
      });

      if ((delta.x > 0 && delta.x > -corner1.x) ||
          (delta.x < 0 && delta.x < m_width - corner2.x)) {
        delta.x = 0;
        m_this.interactor().cancel("momentum");
      }
      if ((delta.y > 0 && delta.y > -corner1.y) ||
          (delta.y < 0 && delta.y < m_height - corner2.y)) {
        delta.y = 0;
        m_this.interactor().cancel("momentum");
      }
    }

    evt = {
      geo: {},
      screenDelta: delta,
      eventType: geo.event.pan
    };
    // first pan the base layer
    if (base) {
      base.renderer().geoTrigger(geo.event.pan, evt, true);
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
      child.geoTrigger(geo.event.pan, evt, true);
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
  this.center = function (coordinates) {
    var newCenter, currentCenter;

    if (coordinates === undefined) {
      return m_center;
    }

    // get the screen coordinates of the new center
    coordinates = geo.util.normalizeCoordinates(coordinates);
    newCenter = m_this.gcsToDisplay(coordinates);
    currentCenter = m_this.gcsToDisplay(m_center);

    // call the pan method
    m_this.pan({
      x: currentCenter.x - newCenter.x,
      y: currentCenter.y - newCenter.y
    }, true);

    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Add layer to the map
   *
   * @method addLayer
   * @param {geo.layer} layer to be added to the map
   * @return {geom.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.createLayer = function (layerName, arg) {
    var newLayer = geo.createLayer(
      layerName, m_this, arg);

    if (newLayer !== null || newLayer !== undefined) {
      newLayer._resize(m_x, m_y, m_width, m_height);
    } else {
      return null;
    }

    if (newLayer.referenceLayer() || m_this.children().length === 0) {
      m_this.baseLayer(newLayer);
    }
    m_this.addChild(newLayer);
    m_this.modified();

    // TODO: need a better way to set the initial coordinates of a layer
    if (!newLayer.referenceLayer()) {
      m_this.center(m_this.center());
    }

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
   * @method removeLayer
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
   *  @method toggleLayer
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
   * Resize map
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
    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from gcs coordinates to display coordinates
   *
   * @param {*} input {[geo.latlng], [{x:_x, y: _y}], [x1,y1, x2, y2]}
   * @return {object}
   *
   * @note Currently only lat-lon inputs are supported
   */
  ////////////////////////////////////////////////////////////////////////////
  this.gcsToDisplay = function (input) {
    var world, output;

    /// Now handle different data types
    if ((input instanceof Array &&
         input.length > 0) || input instanceof Object) {
      world = m_baseLayer.toLocal(input);
      output = m_baseLayer.renderer().worldToDisplay(world);
    } else {
      /// Everything else
      throw "Conversion method latLonToDisplay does not handle " + input;
    }

    return output;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from display to latitude longitude coordinates
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToGcs = function (input) {
    var output;

    /// Now handle different data types
    if ((input instanceof Array && input.length > 0) ||
         input instanceof Object) {
      output = m_baseLayer.renderer().displayToWorld(input);
      output = m_baseLayer.fromLocal(output);
    } else {
      throw "Conversion method displayToGcs does not handle " + input;
    }
    return output;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Queries each layer for information at this location.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.query = function () {
    // TODO Implement this
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

      // The GCS of the layer must match the map
      if (m_gcs !== baseLayer.gcs()) {
        m_this.gcs(baseLayer.gcs());
      }

      m_baseLayer = baseLayer;

      // Set the layer as the reference layer
      m_baseLayer.referenceLayer(true);

      if (arg.center) {
        // This assumes that the base layer is initially centered at
        // (0, 0).  May want to add an explicit call to the base layer
        // to set a given center.
        m_this.center(arg.center);
      }
      save = m_zoom;
      m_zoom = null;
      m_this.zoom(save);

      m_this._updateBounds();
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
        renderer = "d3Renderer";
      }
      layer = m_this.createLayer("feature", {renderer: renderer});
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
      throw "Map require DIV node";
    }

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
  this._exit = function () {
    var i, layers = m_this.children();
    for (i = 0; i < layers.length; i += 1) {
      layers[i]._exit();
    }
    if (m_this.interactor()) {
      m_this.interactor().destroy();
      m_this.interactor(null);
    }
  };

  this._init(arg);

  // set up drag/drop handling
  this.node().on("dragover", function (e) {
    var evt = e.originalEvent;

    if (m_this.fileReader()) {
      evt.stopPropagation();
      evt.preventDefault();
      evt.dataTransfer.dropEffect = "copy";
    }
  })
  .on("drop", function (e) {
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
   * Options: ::
   *
   *   opts = {
   *     center: { x: ... , y: ... } // the new center
   *     zoom: ... // the new zoom level
   *     duration: ... // the duration (in ms) of the transition
   *     ease: ... // an easing function [0, 1] -> [0, 1]
   *   }
   *
   * @param {Object} opts
   * @returns {geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.transition = function (opts) {
    if (m_transition) {
      console.log("Cannot start a transition until the" +
                  " current transition is finished");
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
      return 360 * Math.pow(2, -1 - z);
    }
    function z2zoom(z) {
      return -1 - Math.log2(z / 360);
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
        zoom: defaultOpts.zoom
      },
      ease: defaultOpts.ease,
      zCoord: defaultOpts.zCoord,
      done: defaultOpts.done
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
      var done = m_transition.done;
      if (!m_transition.start.time) {
        m_transition.start.time = time;
        m_transition.end.time = time + defaultOpts.duration;
      }
      if (time >= m_transition.end.time) {
        m_this.center(m_transition.end.center);
        m_this.zoom(m_transition.end.zoom);
        m_transition = null;
        if (done) {
          done();
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
      m_this.zoom(p[2]);

      window.requestAnimationFrame(anim);
    }

    window.requestAnimationFrame(anim);
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update the internally cached map bounds.
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  this._updateBounds = function () {
    if (!m_this.baseLayer()) {
      m_bounds = {};
      return;
    }
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
   * Get the locations of the current map corners as latitudes/longitudes.
   * The return value of this function is an object as follows: ::
   *
   *    {
   *        lowerLeft: {x: ..., y: ...},
   *        upperLeft: {x: ..., y: ...},
   *        lowerRight: {x: ..., y: ...},
   *        upperRight: {x: ..., y: ...}
   *    }
   *
   * @todo Provide a setter
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bounds = function () {
    return m_bounds;
  };

  this.interactor(arg.interactor || geo.mapInteractor());
  this.clock(arg.clock || geo.clock());

  return this;
};

inherit(geo.map, geo.sceneObject);
