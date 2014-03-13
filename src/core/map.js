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
 * @class Creates a new map inside of the given HTML container (Typically DIV)
 * @returns {geo.map}
 */
//////////////////////////////////////////////////////////////////////////////
geo.map = function(arg) {
  "use strict";
  if (!(this instanceof geo.map)) {
    return new geo.map(arg);
  }
  arg = arg || {};
  geo.object.call(this, arg);

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
      m_node = $('#' + arg.node),
      m_gcs = arg.gcs === undefined ? "EPSG:4326" : arg.gcs,
      m_uigcs = arg.uigcs === undefined ? "EPSG:4326" : arg.uigcs,
      m_center = arg.center === undefined ? [0.0, 0.0] :
                 arg.center,
      m_zoom = arg.zoom === undefined ? 10 : arg.zoom,
      m_layers = arg.layers === undefined ? [] : arg.layers,
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
  this.gcs = function() {
    return m_gcs;
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
      $(m_this).trigger(geo.event.zoom);
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
      $(m_this).trigger(geo.event.center);
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
      layer.container(this);

      if (layer.referenceLayer() && m_gcs != null &&
          m_gcs !== layer.gcs()) {
        throw "Reference layer gcs does not match with map gcs";
      } else {
        // TODO Add api to layer
        layer.transform(m_gcs);
      }
      layer._resize(m_x, m_y, m_width, m_height);

      if (layer.referenceLayer()) {
        this.baseLayer(layer);
      }

      m_layers.push(layer);
      this.modified();

      $(this).trigger({
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

      for (i = 0; i < m_layers.length; ++i) {
        if (m_layers[i] === layer) {
          m_layers = m_layers.splice(i, 1);
        }
      }

      layer._exit();
      this.modified();

      $(this).trigger({
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

      $(this).trigger({
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
    var i = 0;

    m_x = x;
    m_y  = y;
    m_width = w;
    m_height = h;

    for (; i <  m_layers.length; ++i) {
      m_layers[i]._resize(x, y, w, h);
    }

    $(this).trigger({
      type: geo.event.resize,
      target: m_this,
      x_offset: m_x,
      y_offset: m_y,
      width: w,
      height: h
    });

    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert display coordinates to map coordinates
   *
   * @returns {'x': number, 'y': number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.displayToMap = function(winX, winY) {
    return m_baseLayer.dislayToGcs(winX, winY);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert world coordinates to map ui gcs
   *
   * @returns {'x': number, 'y': number}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.worldToMap = function(x, y) {
    var gcsPoint,
        source,
        dest,
        transformedPoint;

    gcsPoint = m_baseLayer.worldToGcs(x, y);
    source = new proj4.Proj(this.options().gcs);
    dest = new proj4.Proj(this.options().display_gcs);
    transformedPoint = new proj4.Point(gcsPoint[0], gcsPoint[1]);

    proj4.transform(source, dest, transformedPoint);

    return [transformedPoint.x, transformedPoint.y];
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
        throw "The layer has a GCS of '" + baseLayer.gcs() +
              "' which does match the map GCS of '" +
              this.gcs() + "'";
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
    var i = 0;

    $(this).trigger({
        type: geo.event.draw,
        target: m_this
    });

    this._update();

    for (i = 0; i < m_layers.length; ++i) {
      m_layers[i]._draw();
    }

    $(this).trigger({
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

    for (i = 0; i < m_layers.length; ++i) {
      if (i === 0) {
        this.baseLayer(m_layers[0]);
      }

      this.addLayer(m_layers[i]);
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update map
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function() {
    var i = 0;
    for (i = 0; i < m_layers.length; ++i) {
      m_layers[i]._update();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Exit this map
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function() {
    var i = 0;
    for (i = 0; i < m_layers.length; ++i) {
      m_layers[i]._exit();
    }
  };

  this._init(arg);
  return this;
};

inherit(geo.map, geo.object);
