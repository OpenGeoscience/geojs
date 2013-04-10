/**
 * Map options object specification
 */
geoModule.mapOptions = {
  zoom: 0,
  center: [0.0, 0.0],
  country_boundries: true,
  us_states: false,
  sourcebigb: ""
};

/**
 * Create a new instance of class map
 *
 * @class Creates a new map inside of the given HTML container (Typically DIV)
 * @returns {geoModule.map}
 */
geoModule.map = function(node, options) {

  if (!(this instanceof geoModule.map)) {
    return new geoModule.map(node, options);
  }
  ogs.vgl.object.call(this);

  /** @private */
  var m_that = this;

  /** @private */
  var m_node = node;

  /** @private */
  var m_initialized = false;

  /** @private */
  var m_baseLayer = null;

  /** @private */
  var m_options = options;

  /** @private **/
  var m_layers = {};

  /** @private **/
  var m_activeLayer = null;

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

  var m_interactorStyle = geoModule.mapInteractorStyle();

  var m_viewer = ogs.vgl.viewer(m_node);
  m_viewer.setInteractorStyle(m_interactorStyle);
  m_viewer.init();
  m_viewer.renderWindow().resize($(m_node).width(), $(m_node).height());

  var m_renderer = m_viewer.renderWindow().activeRenderer();

  $(m_interactorStyle).on(ogs.vgl.command.leftButtonPressEvent, draw);
  $(m_interactorStyle).on(ogs.vgl.command.middleButtonPressEvent, draw);
  $(m_interactorStyle).on(ogs.vgl.command.rightButtonPressEvent, draw);
  $(this).on(geoModule.command.updateEvent, draw);

  /**
   * Initialize the scene
   */
  function initScene() {
    updateZoom();
    m_initialized = true;
  }

  /**
   * Update view extents based on the zoom
   */
  function updateZoom(useCurrent) {
    m_interactorStyle.zoom(m_options, useCurrent);
  }

  /**
   * Initialize the scene (if not initialized) and then render the map
   *
   * @param event
   */
  function draw(event) {
    if (m_initialized === false) {
      initScene();
    }
    m_viewer.render();
  }

  /**
   * Handle mouse events
   *
   * @param event
   */
  function relMouseCoords(event) {
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this;

    do {
      totalOffsetX += currentElement.offsetLeft;
      totalOffsetY += currentElement.offsetTop;
    } while (currentElement === currentElement.offsetParent);

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return {
      x : canvasX,
      y : canvasY
    };
  }

  // TODO use zoom and center options
  m_baseLayer = (function() {
    var mapActor = ogs.vgl.utils.createTexturePlane(-180.0, -90.0, 0.0, 180.0,
                                                    -90.0, 0.0, -180.0, 90.0,
                                                     0.0);
    // Setup texture
    var worldImage = new Image();
    worldImage.src = m_options.source;
    worldImage.onload = function() {
      var worldTexture = new vglModule.texture();
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
  })();

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
   }

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
      return true;
    }

    return false;
  }

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
      return true;
    }

    return false;
  }

  /**
   * Return current or active layer
   *
   * @returns {geo.layer}
   */
  this.activeLayer = function() {
    return m_activeLayer;
  }

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
      m_activeLayer = layer;
      this.modified();
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
  }

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
  };

  /**
   * Toggle country boundries
   *
   * @returns {Boolean}
   */
  this.toggleCountryBoundries = function() {
    var layer = this.findLayerById('country-boundries');
    if (layer !== null) {
      layer.setVisible(!layer.visible());
      return true;
    }
    else {
      // Load countries data first
      var reader = ogs.vgl.geojsonReader();
      var geoms = reader.readGJObject(ogs.geo.countries);
      var layer = ogs.geo.featureLayer({
        "opacity" : 1,
        "showAttribution" : 1,
        "visible" : 1
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
  this.toggleUsStateBoundries = function() {
    // @todo Imeplement this
  };

  // Check if need to show country boundries
  if (m_options.country_boundries === true) {
    this.toggleCountryBoundries();
  }

  return this;
};

inherit(geoModule.map, ogs.vgl.object);
