/////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2, continue: true*/

/*global vgl, geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global document, vec2, vec3, vec4, proj4*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class map
 *
 * @class Creates a new map inside of the given HTML layer (Typically DIV)
 * @returns {geo.map}
 */
//////////////////////////////////////////////////////////////////////////////
geo.map = function(arg) {
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
      m_width = m_node.width(),
      m_height = m_node.height(),
      m_gcs = arg.gcs === undefined ? "EPSG:4326" : arg.gcs,
      m_uigcs = arg.uigcs === undefined ? "EPSG:4326" : arg.uigcs,
      m_center = arg.center === undefined ? [0.0, 0.0] :
                 arg.center,
      m_zoom = arg.zoom === undefined ? 10 : arg.zoom,
      m_baseLayer = null,
      m_updateTime = geo.timestamp(),
      m_drawTime = geo.timestamp(),
      toMillis, calculateGlobalAnimationRange, cloneTimestep,
      m_animationState = {range: null, timestep: null, layers: null},
      m_intervalMap = {},
      m_pause,
      m_stop;

      m_intervalMap.milliseconds = 1;
      m_intervalMap.seconds = m_intervalMap.milliseconds * 1000;
      m_intervalMap.minutes = m_intervalMap.seconds * 60;
      m_intervalMap.hours = m_intervalMap.minutes * 60;
      m_intervalMap.days = m_intervalMap.hours * 24;
      m_intervalMap.weeks = m_intervalMap.days * 7;
      m_intervalMap.months = m_intervalMap.weeks * 4;
      m_intervalMap.years = m_intervalMap.months * 12;

  this.on(geo.event.animationPause, function() { m_pause = true; });
  this.on(geo.event.animationStop, function() { m_stop = true; });

  toMillis = function(delta) {
    var deltaLowercase = delta.toLowerCase();
    return m_intervalMap[deltaLowercase];
  };

  calculateGlobalAnimationRange = function(layers) {
    var delta, deltaUnits, start = null, end = null, layerTimeRange, layerDelta,
        indexTimestep = false, smallestDeltaInMillis = Number.MAX_VALUE, i;

    for (i = 0; i < layers.length; i++) {
      layerTimeRange = layers[i].timeRange();

      if (!layerTimeRange) {
          continue;
      }

      if (layerTimeRange.deltaUnits === 'index') {
        indexTimestep = true;
        layerDelta = layerTimeRange.delta;
      }
      else {
        if (indexTimestep) {
          throw "Can't mix index timesteps with time based timesteps";
        }

        layerDelta = toMillis(layerTimeRange.deltaUnits)*layerTimeRange.delta;
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

    return {'start': start, 'end': end, 'delta': delta, 'deltaUnits': deltaUnits};
  };

  cloneTimestep = function(timestep) {

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
  this.gcs = function(arg) {
    if (arg === undefined) {
      return m_gcs;
    }
    m_gcs = arg;
    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get map user interface GCS
   *
   * @returns {String EPSG format}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.uigcs = function() {
    return m_uigcs;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get root node of the map
   *
   * @returns {jquery object}
   */
  ////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get root node of the map
   *
   * @returns {jquery object}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.node = function() {
    return m_node;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set zoom level of the map
   *
   * @returns {Number|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.zoom = function(val) {
    if (val === undefined ) {
      return m_zoom;
    }
    m_zoom = val;
    // TODO Fix this
    //      m_this.trigger(geo.event.zoom);
    this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set center of the map
   *
   * @returns {Array|geo.map}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.center = function(val) {
    if (val === undefined ) {
      return m_center;
    }
    m_center = val.slice;
    // TODO Fix this
    //      m_this.trigger(geo.event.center);
    this.modified();
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
  this.createLayer = function(layerName, arg) {
    var newLayer = geo.createLayer(
      layerName, m_this, arg);

    if (newLayer !== null || newLayer !== undefined) {
      newLayer._resize(m_x, m_y, m_width, m_height);
    }

    if (newLayer.referenceLayer() || m_this.children().length === 0) {
      m_this.baseLayer(newLayer);
    }

    m_this.addChild(newLayer);
    m_this.modified();

    m_this.trigger(geo.event.layerAdd, {
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
  this.delete = function(layer) {
    var i;

    if (layer !== null && layer !== undefined) {
      layer._exit();

      this.removeChild(layer);

      this.modified();

      m_this.trigger(geo.event.layerRemove, {
        type: geo.event.layerRemove,
        target: m_this,
        layer: layer
      });
    }

    return this;
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
  this.toggle = function(layer) {
    if (layer !== null && layer !== undefined) {
      layer.visible(!layer.visible());
      m_this.modified();

      m_this.trigger(geo.event.layerToggle, {
        type: geo.event.layerToggle,
        target: m_this,
        layer: layer
      });
    }
    return this;
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
  this.resize = function(x, y, w, h) {
    var i = 0, layers = this.children();

    m_x = x;
    m_y  = y;
    m_width = w;
    m_height = h;

    for (; i < layers.length; ++i) {
      layers[i]._resize(x, y, w, h);
    }

    m_this.trigger(geo.event.resize, {
      type: geo.event.resize,
      target: m_this,
      x: m_x,
      y: m_y,
      width: w,
      height: h
    });

    this.modified();
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
  this.gcsToDisplay = function(input) {
    var i, world, output;

    /// Now handle different data types
    if (input instanceof Array && input.length > 0) {
      output = [];
      /// Input is array of geo.latlng
      if (input[0] instanceof geo.latlng) {
        for (i = 0; i < input.length; ++i) {
        world = m_baseLayer.toLocal(input)[0];
        output.push(m_baseLayer.renderer().worldToDisplay(
          {x: world.x(), y: world.y()}));
        }
      } else {
        /// Input is array of positions
        output = m_baseLayer.renderer().worldToDisplay(input).slice(0);
      }
    } else if (input instanceof geo.latlng) {
      world = m_baseLayer.toLocal(input);
      output = m_baseLayer.renderer().worldToDisplay(
                 {x: world.x(), y: world.y()});
    } else if (input instanceof Object) {
       /// Input is Object
      world = m_baseLayer.toLocal(input);
      output = m_baseLayer.renderer().worldToDisplay(world);
    } else {
      /// Everything else
      throw 'Conversion method latLonToDisplay does not handle ' + input;
    }

    return output;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert from display to latitude longitude coordinates
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToGcs = function(input) {
    var output;

    /// Now handle different data types
    if (input instanceof Array && input.length > 0 ||
        input instanceof Object) {
      output = m_baseLayer.renderer().displayToWorld(input);
      output = m_baseLayer.fromLocal(output);
    } else if (input instanceof Object) {
      output = m_baseLayer.renderer().displayToWorld(input);
      output = m_baseLayer.fromLocal(output);
    } else {
      throw 'Conversion method latLonToDisplay does not handle ' + input;
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
  this.query = function(arg) {
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
  this.baseLayer = function(baseLayer) {
    if(typeof baseLayer !== 'undefined') {

      // The GCS of the layer must match the map
      if (m_gcs !== baseLayer.gcs()) {
        this.gcs(baseLayer.gcs());
      }

      m_baseLayer = baseLayer;

      // Set the layer as the reference layer
      m_baseLayer.referenceLayer(true);

      return this;
    }
    return m_baseLayer;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Gets the interactorStyle for this map
   *
   * @returns {vgl.interactorStyle]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.interactorStyle = function(style) {
    if (style === undefined) {
      return m_interactorStyle;
    } else {
      m_interactorStyle = style;
      this.modified();
    }
    return m_interactorStyle;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Manually force to render map
   */
  ////////////////////////////////////////////////////////////////////////////
  this.draw = function() {
    var i = 0, layers = this.children();

    m_this.trigger(geo.event.draw, {
        type: geo.event.draw,
        target: m_this
    });

    this._update();

    for (i = 0; i < layers.length; ++i) {
      layers[i]._draw();
    }

    m_this.trigger(geo.event.drawEnd, {
        type: geo.event.drawEnd,
        target: m_this
    });
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   */
  ////////////////////////////////////////////////////////////////////////////
  this.animate = function(layers) {
    var animationRange;
    layers = layers === undefined ? this.children() : layers;

    if(m_animationState.timestep == null) {
      animationRange = calculateGlobalAnimationRange(layers)

      if (!animationRange.start || !animationRange.end) {
          throw "Animation range could not be calculated. " +
                "Check that layers have ranges associated with them";
      }

      m_animationState = {
                           range: animationRange,
                           timestep: cloneTimestep(animationRange.start),
                           'layers': layers
                         };
    }

    this._animate();
  };

  this.pauseAnimation = function() {
    this.trigger(geo.event.animationPause);
  };

  this.stopAnimation = function() {
    this.trigger(geo.event.animationStop);
    m_animationState.timestep = null;
  };

  this.stepAnimationForward = function(layers) {
    var animationRange, timestep;
    layers = layers === undefined ? m_animationState.layers: layers;

    if (layers === null) {
      layers = this.children();
    }

    if (m_animationState.timestep == null) {
      animationRange = calculateGlobalAnimationRange(layers);

      m_animationState = {range: animationRange,
          timestep: cloneTimestep(animationRange.start), 'layers': layers};
    }

    this._stepAnimationForward();
  };

  this.stepAnimationBackward = function(layers) {
    var animationRange, timestep;
    layers = layers === undefined ? m_animationState.layers: layers;

    if (layers === null) {
      layers = this.children();
    }

    if (m_animationState.timestep == null) {
      animationRange = calculateGlobalAnimationRange(layers);

      m_animationState = {range: animationRange,
          timestep: cloneTimestep(animationRange.end), 'layers': layers};
    }

    this._stepAnimationBackward();
  };



  this._animate = function() {
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
        m_this.trigger(geo.event.animationComplete);
      }
      else if (m_pause) {
        clearInterval(id);
      }
      else {
        m_this._animateTimestep();
        m_animationState.timestep = geo.time.incrementTime(m_animationState.timestep,
            m_animationState.range.deltaUnits, m_animationState.range.delta);
      }

    };

    id = setInterval(renderTimestep, 10);
  };

  this._animateTimestep = function() {

    if (m_animationState) {

      $.each(m_animationState.layers, function(i, layer) {
        var timestep = m_animationState.timestep;

        if (timestep instanceof Date) {
          timestep = timestep.getTime();
        }

        layer._update({timestep: timestep});
      });

      this.trigger(
        geo.event.animate, {
        timestep: m_animationState.timestep
      });
      this.draw();
    }
  };

  this._stepAnimationForward = function() {
    var nextTimestep;

    if (m_animationState.timestep == null) {
      m_animationState.timestep = cloneTimestep(m_animationState.range.start);
    }

    nextTimestep = cloneTimestep(m_animationState.timestep);
    nextTimestep = geo.time.incrementTime(nextTimestep, m_animationState.range.deltaUnits,
        m_animationState.range.delta);

    if (nextTimestep > m_animationState.range.end) {
      return;
    }

    m_animationState.timestep = nextTimestep;
    this._animateTimestep();
  };

  this._stepAnimationBackward = function() {
    var previousTimestep;

    if (m_animationState.timestep == null) {
      m_animationState.timestep = cloneTimestep(m_animationState.range.end);
    }

    previousTimestep = cloneTimestep(m_animationState.timestep);
    previousTimestep = geo.time.incrementTime(previousTimestep, m_animationState.range.deltaUnits,
        -m_animationState.range.delta);

    if (previousTimestep < m_animationState.range.start) {
      return;
    }

    m_animationState.timestep = previousTimestep;
    this._animateTimestep();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize the map
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function(arg) {
    var i;

    if (m_node === undefined || m_node === null) {
      throw "Map require DIV node";
    }

    if (arg !== undefined && arg.layers !== undefined) {
      for (i = 0; i < arg.layers.length; ++i) {
        if (i === 0) {
          this.baseLayer(arg.layers[i]);
        }

        this.addLayer(arg.layers[i]);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update map
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function(request) {
    var i = 0, layers = this.children();
    for (i = 0; i < layers.length; ++i) {
      layers[i]._update(request);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Exit this map
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function() {
    var i = 0, layers = this.children();
    for (i = 0; i < layers.length; ++i) {
      layers[i]._exit();
    }
  };

  this._init(arg);
  return this;
};

inherit(geo.map, geo.sceneObject);
