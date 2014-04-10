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
      m_width = 0,
      m_height = 0,
      m_node = $(arg.node),
      m_gcs = arg.gcs === undefined ? "EPSG:4326" : arg.gcs,
      m_uigcs = arg.uigcs === undefined ? "EPSG:4326" : arg.uigcs,
      m_center = arg.center === undefined ? [0.0, 0.0] :
                 arg.center,
      m_zoom = arg.zoom === undefined ? 10 : arg.zoom,
      m_baseLayer = null,
      m_updateTime = geo.timestamp(),
      m_drawTime = geo.timestamp();

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
    } else {
      m_zoom = val;
      m_this.trigger(geo.event.zoom);
      this.modified();
      return m_this;
    }
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
    } else {
      m_center = val.slice
      m_this.trigger(geo.event.center);
      this.modified();
      return m_this;
    }
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
  this.addLayer = function(layer) {
    if (layer !== null || layer !== undefined) {
      layer.map(this);
      layer._init();
      layer._resize(m_x, m_y, m_width, m_height);

      if (layer.referenceLayer() || this.children().length === 0) {
        this.baseLayer(layer);
      }

      this.addChild(layer);
      this.modified();

      m_this.trigger(geo.event.layerAdd, {
        type: geo.event.layerAdd,
        target: m_this,
        layer: layer
      });
    }
    return this;
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
  this.removeLayer = function(layer) {
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
      layer.visible(!layer.visible())
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

    for (; i <  layers.length; ++i) {
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
    var i, world, toDisplay, latlngToDisplay, output = [];

    /// Private function to convert gcs coordinates to display coordinates
    toDisplay = function() {
      return (function(x, y) {
        var xy = { x: x, y: y };
        /// Now convert from mercLatLon to display here
        return m_baseLayer.renderer().worldToDisplay(xy);
      });
    };

    /// Private function to convert latlng to display coordinates
    latlngToDisplay = function() {
      return function(latlng) {
        world = m_baseLayer.toLocal(input)[0];
        output.push(toDisplay()(world.x(), world.y())[0]);
      }
    }

    /// Now handle different data types
    if (input instanceof Array && input.length > 0) {
      /// Input is array of geo.latlng
      if (input[0] instanceof geo.latlng) {
        for (i = 0; i < input.length; ++i) {
          latlngToDisplay()(input);
        }
      } else {
        /// Input is array of positions
        output = m_baseLayer.renderer().worldToDisplay(input).slice(0);
      }
    } else if (input instanceof geo.latlng) {
      latlngToDisplay()(input);
    } else if (input instanceof Object) {
       /// Input is Object
      output.push(toDisplay()(input.x, input.y)[0]);
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
    var toLatLng, output;

    /// Now handle different data types
    if (input instanceof Array && input.length > 0 ||
        input instanceof Object) {
      output = m_baseLayer.renderer().displayToWorld(input);
      output = m_baseLayer.fromLocal(output);
    }
    else {
      throw 'Conversion method latLonToDisplay does not handle ' + input;
    }
    return;
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
  this._update = function() {
    var i = 0, layers = this.children();
    for (i = 0; i < layers.length; ++i) {
      layers[i]._update();
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
