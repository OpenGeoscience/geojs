/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true, white: true, indent: 2*/
/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image, vglModule, document*/

/**
 * Map options object specification
 */
geoModule.mapOptions = {
  zoom: 0,
  center: geoModule.latlng(0.0, 0.0),
  country_boundaries: true,
  state_boundaries: {},
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
      m_layerDrawables = geoModule.layerDrawables(),
      m_renderTime = ogs.vgl.timestamp(),
      m_previousLayerDrawablesTime = null,
      m_interactorStyle = null,
      m_viewer = null,
      m_renderer = null,
      m_tween;

  m_renderTime.modified();

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
   * Initialize the scene
   */
  function initScene() {
    updateZoom();
    m_initialized = true;
  }

  /**
   * Initialize the scene (if not initialized) and then render the map
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
    mapActor = ogs.vgl.utils.createTexturePlane(-180.0, -90.0, -1.0,
                                                 180.0, -90.0, -1.0,
                                                -180.0, 90.0, -1.0);
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
    HTMLCanvasElement.prototype.relMouseCoords = m_viewer.relMouseCoords;

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
   * @param val [0-17]
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
    console.log('layer bin number is ', layer.binNumber() ,layer.name());
    if (layer !== null) {
      // TODO Check if the layer already exists
      // TODO Set the rendering order correctly
      if (!layer.binNumber() || layer.binNumber() === -1) {
        layer.setBinNumber(Object.keys(m_layers).length);
      }

      m_layers[layer.name()] = layer;
      this.prepareForRendering();
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
    if (layer !== null && typeof layer !== 'undefined') {
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
   *  @param {geo.layer} layer
   *  @returns {Boolean}
   */
  this.toggleLayer = function(layer) {
    if (layer !== null && typeof layer !== 'undefined') {
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
   * @param {geo.layer} layer
   * @returns {Boolean}
   *
   */
  this.selectLayer = function(layer) {
    if (typeof layer !== 'undefined' && m_activeLayer !== layer) {
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
          layer: layer
        });
      }
      return true;
    }

    return false;
  };

  /**
   * Find layer by layer id
   *
   * @method findLayerById
   * @param {String} layerId
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
   * Resize map
   *
   * @param {Number} width
   * @param {Number} height
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
   * Toggle country boundaries
   *
   * @returns {Boolean}
   */
  this.toggleCountryBoundaries = function() {
    var layer, reader, geoms;
    layer = this.findLayerById('country-boundaries');
    if (layer !== null) {
      layer.setVisible(!layer.visible());
      return layer.visible();
    } else {
      // Load countries data first
      reader = ogs.vgl.geojsonReader();
      geoms = reader.readGJObject(ogs.geo.countries);
      //todo if opacity is on layer, solid color should be too
      layer = ogs.geo.featureLayer({
        "opacity": 1,
        "showAttribution": 1,
        "visible": 1
      }, ogs.geo.multiGeometryFeature(geoms, [1.0,0.5, 0.0]));

      layer.setName('country-boundaries');
      // Use a very high bin number to always draw it last
      layer.setBinNumber(10000);
      this.addLayer(layer);
      return layer.visible();
    }
  };

  /**
   * Toggle us state boundaries
   *
   * @returns {Boolean}
   */
  this.toggleStateBoundaries = function() {
    // @todo Implement this
  };

  /**
   * Prepare map for rendering
   */
  this.prepareForRendering = function() {
    var i = 0,
        layerName = 0,
        sortedActors = [];

    for (layerName in m_layers) {
      if (m_layers.hasOwnProperty(layerName)) {
        m_layers[layerName].prepareForRendering(m_layerDrawables);
      }
    }

    if (!m_previousLayerDrawablesTime || (
      m_layerDrawables.GetMTime() && m_previousLayerDrawablesTime.GetMTime())) {
      // Clear all actors
      m_renderer.removeAllActors();

      // Sort actors by layer bin number
      for (layerName in m_layers) {
        sortedActors.push([m_layers[layerName].binNumber(),
          m_layerDrawables.features(layerName)]);
      }

      console.log('sorted actors are', sortedActors);
      sortedActors.sort(function(a, b) {return a[0] - b[0]});

      // First add base layer
      m_renderer.addActor(m_baseLayer);

      // Add actors to renderer in sorted order
      for (i = 0; i < sortedActors.length; ++i) {
        console.log('adding ', sortedActors[i][1]);
        m_renderer.addActors(sortedActors[i][1]);
      }

      this.redraw();
    }
  };

  /**
   * Animate layers of a map
   */
  this.animate = function(source, target, layers, timeDuration)  {
    var i = null,
        that = this;

    if (!layers) {
      layers = m_layers;
    }

    if (!timeDuration) {
      timeDuration = 10000; // 10 seconds
    }

    // Create new
    m_tween = new TWEEN.Tween(source).to(target, timeDuration);

    m_tween.onUpdate(function() {
      for (i = 0; i < m_layers.length; ++i) {
        m_layers[i].update(source.time);
      }
    }

    that.redraw();
  };

  // Check if need to show country boundaries
  if (m_options.country_boundaries === true) {
    this.toggleCountryBoundaries();
  }

  return this;
};

inherit(geoModule.map, ogs.vgl.object);
