/////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class map
 *
 * @class Creates a new map inside of the given HTML layer (Typically DIV)
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
      toMillis, calculateGlobalAnimationRange, cloneTimestep,
      m_animationState = {range: null, timestep: null, layers: null},
      m_intervalMap = {},
      m_pause,
      m_stop,
      m_fileReader = null,
      m_interactor = null;

  m_intervalMap.milliseconds = 1;
  m_intervalMap.seconds = m_intervalMap.milliseconds * 1000;
  m_intervalMap.minutes = m_intervalMap.seconds * 60;
  m_intervalMap.hours = m_intervalMap.minutes * 60;
  m_intervalMap.days = m_intervalMap.hours * 24;
  m_intervalMap.weeks = m_intervalMap.days * 7;
  m_intervalMap.months = m_intervalMap.weeks * 4;
  m_intervalMap.years = m_intervalMap.months * 12;

  this.geoOn(geo.event.animationPause, function () { m_pause = true; });
  this.geoOn(geo.event.animationStop, function () { m_stop = true; });

  toMillis = function (delta) {
    var deltaLowercase = delta.toLowerCase();
    return m_intervalMap[deltaLowercase];
  };

  calculateGlobalAnimationRange = function (layers) {
    var delta, deltaUnits, start = null, end = null, layerTimeRange, layerDelta,
        indexTimestep = false, smallestDeltaInMillis = Number.MAX_VALUE, i;

    for (i = 0; i < layers.length; i += 1) {
      layerTimeRange = layers[i].timeRange();

      if (!layerTimeRange) {
        continue;
      }

      if (layerTimeRange.deltaUnits === "index") {
        indexTimestep = true;
        layerDelta = layerTimeRange.delta;
      }
      else {
        if (indexTimestep) {
          throw "Can't mix index timesteps with time based timesteps";
        }

        layerDelta = toMillis(layerTimeRange.deltaUnits) * layerTimeRange.delta;
      }

      if (layerDelta < smallestDeltaInMillis) {
        delta = layerTimeRange.delta;
        deltaUnits = layerTimeRange.deltaUnits;
        smallestDeltaInMillis = layerDelta;
      }

      if (start === null || layerTimeRange.start < start) {
        start = layerTimeRange.start;
      }

      if (end === null || layerTimeRange.end < end) {
        end = layerTimeRange.end;
      }
    }

    return {
      "start": start,
      "end": end,
      "delta": delta,
      "deltaUnits": deltaUnits
    };
  };

  cloneTimestep = function (timestep) {

    if (timestep instanceof Date) {
      timestep = new Date(timestep.getTime());
    }

    return timestep;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get map gcs
   *
   * @returns {String EPSG format}
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
   * @returns {String EPSG format}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.uigcs = function () {
    return m_uigcs;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get root node of the map
   *
   * @returns {jquery object}
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
    var base, evt;
    if (val === undefined || val === m_zoom) {
      return m_zoom;
    }

    base = m_this.baseLayer();

    evt = {
      geo: {},
      zoomLevel: val,
      eventType: geo.event.zoom
    };
    if (base) {
      base.renderer().geoTrigger(geo.event.zoom, evt, true);
    }

    if (evt.geo.preventDefault) {
      return;
    }

    m_zoom = val;
    m_this.children().forEach(function (child) {
      child.geoTrigger(geo.event.zoom, evt, true);
    });
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
    var base = m_this.baseLayer(),
        evt;

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
    newCenter = m_this.gcsToDisplay(coordinates);
    currentCenter = m_this.gcsToDisplay(m_center);

    // call the pan method
    m_this.pan({
      x: newCenter.x - currentCenter.x,
      y: newCenter.y - currentCenter.y
    });

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

    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from gcs coordinates to display coordinates
   *
   * @param input {[geo.latlng], [{x:_x, y: _y}], [x1,y1, x2, y2]}
   * @return [x:x1, y:y1, ...], [x1, y1, x2, y2]
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
      throw "Conversion method latLonToDisplay does not handle " + input;
    }
    return output;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Queries each layer for information at this location.
   *
   * @param location
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
    if (baseLayer !== undefined) {

      // The GCS of the layer must match the map
      if (m_gcs !== baseLayer.gcs()) {
        m_this.gcs(baseLayer.gcs());
      }

      m_baseLayer = baseLayer;

      // Set the layer as the reference layer
      m_baseLayer.referenceLayer(true);

      if (arg.center) {
        if (Array.isArray(arg.center)) {
          arg.center = {
            x: arg.center[1],
            y: arg.center[0]
          };
        }

        // This assumes that the base layer is initially centered at
        // (0, 0).  May want to add an explicit call to the base layer
        // to set a given center.
        m_this.pan(arg.center);
      }
      if (arg.zoom !== undefined) {
        m_zoom = null;
        m_this.zoom(arg.zoom);
      }

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

  // TODO: Add documentation headers:
  ////////////////////////////////////////////////////////////////////////////
  /**
   */
  ////////////////////////////////////////////////////////////////////////////
  this.animate = function (layers) {
    var animationRange;
    layers = layers === undefined ? m_this.children() : layers;

    if (m_animationState.timestep === null) {
      animationRange = calculateGlobalAnimationRange(layers);

      if (!animationRange.start || !animationRange.end) {
        throw "Animation range could not be calculated. " +
              "Check that layers have ranges associated with them";
      }

      m_animationState = {
        range: animationRange,
        timestep: cloneTimestep(animationRange.start),
        "layers": layers
      };
    }

    m_this._animate();
    return m_this;
  };

  this.pauseAnimation = function () {
    m_this.geoTrigger(geo.event.animationPause);
    return m_this;
  };

  this.stopAnimation = function () {
    m_this.geoTrigger(geo.event.animationStop);
    m_animationState.timestep = null;
    return m_this;
  };

  this.stepAnimationForward = function (layers) {
    var animationRange;
    layers = layers === undefined ? m_animationState.layers: layers;

    if (layers === null) {
      layers = m_this.children();
    }

    if (m_animationState.timestep === null) {
      animationRange = calculateGlobalAnimationRange(layers);

      m_animationState = {
        range: animationRange,
        timestep: cloneTimestep(animationRange.start),
        "layers": layers
      };
    }

    m_this._stepAnimationForward();
    return m_this;
  };

  this.stepAnimationBackward = function (layers) {
    var animationRange;
    layers = layers === undefined ? m_animationState.layers: layers;

    if (layers === null) {
      layers = m_this.children();
    }

    if (m_animationState.timestep === null) {
      animationRange = calculateGlobalAnimationRange(layers);

      m_animationState = {
        range: animationRange,
        timestep: cloneTimestep(animationRange.end),
        "layers": layers
      };
    }

    m_this._stepAnimationBackward();
    return m_this;
  };

  this._animate = function () {
    var animationRange, nextTimestep, id;

    animationRange = m_animationState.range;
    nextTimestep = cloneTimestep(animationRange.start);
    m_stop = false;
    m_pause = false;

    nextTimestep = geo.time.incrementTime(nextTimestep, animationRange.deltaUnits,
      animationRange.delta);

    if (nextTimestep > animationRange.end) {
      throw "Invalid time range";
    }

    function renderTimestep() {
      if (m_animationState.timestep > animationRange.end || m_stop) {
        clearInterval(id);
        m_animationState.timestep = null;
        m_this.geoTrigger(geo.event.animationComplete);
      }
      else if (m_pause) {
        clearInterval(id);
      }
      else {
        m_this._animateTimestep();
        m_animationState.timestep = geo.time.incrementTime(m_animationState.timestep,
            m_animationState.range.deltaUnits, m_animationState.range.delta);
      }

    }

    id = setInterval(renderTimestep, 10);
    return m_this;
  };

  this._animateTimestep = function () {

    if (m_animationState) {

      $.each(m_animationState.layers, function (i, layer) {
        var timestep = m_animationState.timestep;

        if (timestep instanceof Date) {
          timestep = timestep.getTime();
        }

        layer._update({timestep: timestep});
      });

      m_this.geoTrigger(
        geo.event.animate, {
        timestep: m_animationState.timestep
      });
      m_this.draw();
    }

    return m_this;
  };

  this._stepAnimationForward = function () {
    var nextTimestep;

    if (m_animationState.timestep === null) {
      m_animationState.timestep = cloneTimestep(m_animationState.range.start);
    }

    nextTimestep = cloneTimestep(m_animationState.timestep);
    nextTimestep = geo.time.incrementTime(nextTimestep, m_animationState.range.deltaUnits,
        m_animationState.range.delta);

    if (nextTimestep <= m_animationState.range.end) {
      m_animationState.timestep = nextTimestep;
      m_this._animateTimestep();
    }

    return m_this;
  };

  this._stepAnimationBackward = function () {
    var previousTimestep;

    if (m_animationState.timestep === null) {
      m_animationState.timestep = cloneTimestep(m_animationState.range.end);
    }

    previousTimestep = cloneTimestep(m_animationState.timestep);
    previousTimestep = geo.time.incrementTime(
      previousTimestep,
      m_animationState.range.deltaUnits,
      -m_animationState.range.delta
    );

    if (previousTimestep < m_animationState.range.start) {
      return;
    }

    m_animationState.timestep = previousTimestep;
    m_this._animateTimestep();

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

  this.interactor(arg.interactor || geo.mapInteractor());

  return this;
};

inherit(geo.map, geo.sceneObject);
