/**
 * @module ogs.geo
 */

/*jslint devel: true, eqeq: true, forin: true, newcap: true, plusplus: true, white: true, indent: 2*/
/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image, vglModule, document*/

/**
 * Map options object specification
 */
geoModule.mapOptions = {
  zoom: 0,
  center: geoModule.latlng(0.0, 0.0),
  country_boundries: true,
  state_boundries: {},
  sourcebigb: ""
};

/**
 * Create a new instance of class map
 *
 * @class Creates a new map inside of the given HTML container (Typically DIV)
 * @returns {geoModule.map}
 */
geoModule.map = function(node, options) {
  "use strict";
  if (!(this instanceof geoModule.map)) {
    return new geoModule.map(node, options);
  }
  ogs.vgl.object.call(this);

  /** @private */
  var m_that = this,
      m_node = node,
      m_initialized = false,
      m_baseLayer = null,
      m_options = options,
      m_layers = {},
      m_activeLayer = null,
      m_interactorStyle = null,
      m_viewer = null,
      m_renderer = null;

  if (!options.center) {
    m_options.center = geoModule.latlng(0.0, 0.0);
  }

  if (options.zoom === undefined) {
    m_options.zoom = 10;
  }

  if (!options.source) {
    console.log("[error] Map requires valid source for the context");
    return null;
  }

  m_interactorStyle = geoModule.mapInteractorStyle();
  m_viewer = ogs.vgl.viewer(m_node);
  m_viewer.setInteractorStyle(m_interactorStyle);
  m_viewer.init();
  m_viewer.renderWindow().resize($(m_node).width(), $(m_node).height());
  m_renderer = m_viewer.renderWindow().activeRenderer();

  /**
   * Update view extents based on the zoom
   */
  function updateZoom(useCurrent) {
    m_interactorStyle.zoom(m_options, useCurrent);
  }

  /**
   * Get mouse pointer coordinates for canvas
   */
  function relMouseCoords(event) {
    var totalOffsetX = 0,
        totalOffsetY = 0,
        canvasX = 0,
        canvasY = 0,
        currentElement = m_node;

    do {
      totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
      totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    } while (currentElement == currentElement.offsetParent);

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {
      x: canvasX,
      y: canvasY
    };
  }

  /**
   * Initialize the scene
   */
  function initScene() {
    updateZoom();
    m_initialized = true;
  }

  /**
   * Initialize the scene (if not initialized) and then render the map
   *
   * @param event
   */
  function draw() {
    if (m_initialized === false) {
      initScene();
    }
    m_viewer.render();
  }

  $(m_interactorStyle).on(ogs.vgl.command.leftButtonPressEvent, draw);
  $(m_interactorStyle).on(ogs.vgl.command.middleButtonPressEvent, draw);
  $(m_interactorStyle).on(ogs.vgl.command.rightButtonPressEvent, draw);
  $(this).on(geoModule.command.updateEvent, draw);

  // TODO use zoom and center options
  m_baseLayer = (function() {
    var mapActor, worldImage, worldTexture;
    mapActor = ogs.vgl.utils.createTexturePlane(-180.0, -90.0, 0.0,
                                                 180.0, -90.0, 0.0,
                                                -180.0, 90.0, 0.0);
    // Setup texture
    worldImage = new Image();
    worldImage.src = m_options.source;
    worldImage.onload = function() {
      worldTexture = new vglModule.texture();
      worldTexture.updateDimensions();
      worldTexture.setImage(worldImage);
      m_baseLayer.material().addAttribute(worldTexture);
      draw();
    };

    m_renderer.addActor(mapActor);
    document.onmousedown = m_viewer.handleMouseDown;
    document.onmouseup = m_viewer.handleMouseUp;
    document.onmousemove = m_viewer.handleMouseMove;
    document.oncontextmenu = m_viewer.handleContextMenu;
    HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

    return mapActor;
  }());

  /**
   * Get map options
   */
  this.options = function() {
    return m_options;
  };

  /**
   * Get the zoom level of the map
   *
   * @returns {Number}
   */
  this.zoom = function() {
    return m_options.zoom;
  };

  /**
   * Set zoom level of the map
   *
   * @param val {0-17}
   */
  this.setZoom = function(val) {
    if (val !== m_options.zoom) {
      m_options.zoom = val;
      updateZoom(true);
      this.modified();
      $(this).trigger(geoModule.command.updateEvent);
      return true;
    }

    return false;
  };

  /**
   * Add layer to the map
   *
   * @method addLayer
   * @param {geo.layer} layer to be added to the map
   * @return {Boolean}
   */
  this.addLayer = function(layer) {

    if (layer != null) {
      // TODO Check if the layer already exists
      // TODO Set the rendering order correctly
      m_renderer.addActor(layer.feature());
      m_layers[layer.name()] = layer;
      m_viewer.render();
      this.modified();

      $(this).trigger({
        type: geoModule.command.addLayerEvent,
        layer: layer
      });
      return true;
    }

    return false;
  };

  /**
   * Remove layer from the map
   *
   * @method removeLayer
   * @param {geo.layer} layer that should be removed from the map
   * @return {Boolean}
   */
  this.removeLayer = function(layer) {
    if (layer !== null || layer !== undefined) {
      m_renderer.removeActor(layer.feature());
      this.modified();
      $(this).trigger({
        type: geoModule.command.removeLayerEvent,
        layer: layer
      });
      return true;
    }

    return false;
  };

  /**
   * Toggle visibility of a layer
   *
   *  @method toggleLayer
   *  @param {geo.layer}
   *  @returns {Boolean}
   */
  this.toggleLayer = function(layer) {
    if (layer !== null || layer !== undefined) {
      layer.setVisible(!layer.visible());
      this.modified();
      $(this).trigger({
        type: geoModule.command.toggleLayerEvent,
        layer: layer
      });
      return true;
    }

    return false;
  };

  /**
   * Return current or active layer
   *
   * @returns {geo.layer}
   */
  this.activeLayer = function() {
    return m_activeLayer;
  };

  /**
   * Make a layer current or active for operations
   *
   * @method selectLayer
   * @param {geo.layer}
   * @returns {Boolean}
   *
   */
  this.selectLayer = function(layer) {
    if (layer !== undefined && m_activeLayer != layer) {
      var tempLayer = layer;
      m_activeLayer = layer;
      this.modified();
      if (layer !== null) {
        $(this).trigger({
          type: geoModule.command.selectLayerEvent,
          layer: layer
        });
      } else {
        $(this).trigger({
          type: geoModule.command.unselectLayerEvent,
          layer: tempLayer
        });
      }
      return true;
    }

    return false;
  };

  /**
   * Find layer by layer id
   *
   * @method toggleLayer
   * @param {String}
   * @returns {geo.layer}
   */
  this.findLayerById = function(layerId) {
    if (m_layers.hasOwnProperty(layerId)) {
      return m_layers[layerId];
    }
    return null;
  };

  /**
   * Manually force to render map
   */
  this.redraw = function() {
    m_viewer.render();
  };

  /**
   * Resize the maps
   */
  this.resize = function(width, height) {
    m_viewer.renderWindow().resize(width, height);
    $(this).trigger({
      type: geoModule.command.resizeEvent,
      width: width,
      height: height
    });
  };

  /**
   * Toggle country boundries
   *
   * @returns {Boolean}
   */
  this.toggleCountryBoundries = function() {
    var layer, reader, geoms;
    layer = this.findLayerById('country-boundries');
    if (layer !== null) {
      layer.setVisible(!layer.visible());
      return true;
    }
    if (layer == null) {
      // Load countries data first
      reader = ogs.vgl.geojsonReader();
      geoms = reader.readGJObject(ogs.geo.countries);
      layer = ogs.geo.featureLayer({
        "opacity": 1,
        "showAttribution": 1,
        "visible": 1
      }, ogs.geo.multiGeometryFeature(geoms));

      layer.setName('country-boundries');
      this.addLayer(layer);
    }
  };

  /**
   * Toggle us state boudries
   *
   * @returns {Boolean}
   */
  this.toggleStateBoundries = function() {
    // @todo Imeplement this
  };

  // Check if need to show country boundries
  if (m_options.country_boundries === true) {
    this.toggleCountryBoundries();
  }

  return this;
};

inherit(geoModule.map, ogs.vgl.object);
