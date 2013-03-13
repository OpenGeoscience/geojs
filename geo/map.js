/**
 * @class geoModule.latlng A latlng is a point in geographical coordinates:
 * latitude and longitude
 */
geoModule.latlng = function(lat, lng) {

  if (!(this instanceof geoModule.latlng)) {
    return new geoModule.latlng(lat, lng);
  }

  // Private member variables
  var m_lat = lat;
  var m_lng = lng;

  // Public methods
  this.lat = function() {
    return m_lat;
  };

  this.lng = function() {
    return m_lng;
  };

  return this;
};

/**
 * Map options object specification
 */
geoModule.mapOptions = function() {
  if (!(this instanceof geoModule.mapOptions)) {
    return new geoModule.mapOptions();
  }

  // Member variables
  this.zoom = 10;
  this.center = geoModule.latlng(0.0, 0.0);
};

/**
 * @class geoModule.map Creates a new map inside of the given HTML container
 * (Typically DIV)
 */
geoModule.map = function(node, options) {

  if (!(this instanceof geoModule.map)) {
    return new geoModule.map(node, options);
  }
  ogs.vgl.object.call(this);

  // Private member variables
  var m_that = this;
  var m_node = node;
  var m_initialized = false;
  var m_baseLayer = null;
  var m_options = options;

  if (!options.center) {
    m_options.center = geoModule.latlng(0.0, 0.0);
  }

  if (options.zoom === undefined) {
    m_options.zoom = 10;
  }

  var m_interactorStyle = geoModule.mapInteractorStyle();

  var m_viewer = ogs.vgl.viewer(m_node);
  m_viewer.setInteractorStyle(m_interactorStyle);
  m_viewer.init();
  m_viewer.renderWindow().resize($(m_node).width(), $(m_node).height());

  var m_renderer = m_viewer.renderWindow().activeRenderer();

  $(m_interactorStyle).on(ogs.vgl.command.leftButtonPressEvent, draw);
  $(m_interactorStyle).on(ogs.vgl.command.rightButtonPressEvent, draw);
  $(this).on(geoModule.command.updateEvent, draw);

  /**
   * Initialize the scene
   */
  function initScene() {
    var camera = m_renderer.camera();

    var distance = 600;
    distance = 600 - (600 - (60 * m_options.zoom)) + 1;

    camera
        .setPosition(m_options.center.lng(), m_options.center.lat(), distance);
    camera.setFocalPoint(m_options.center.lng(), m_options.center.lat(), 0.0);

    m_initialized = true;
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
    worldImage.src = "/data/assets/land_shallow_topo_2048.png";
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
      m_renderer.addActor(layer.actor());
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
    if (!layer) {
      m_renderer.removeActor(layer);
      this.modified();
      return true;
    }

    return false;
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
  };

  return this;
};

inherit(geoModule.map, ogs.vgl.object);
