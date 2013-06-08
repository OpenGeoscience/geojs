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
  country_boundries: false,
  state_boundries: {},
  sourcebigb: ""
};

/**
 * Create a new instance of class map
 *
 * @class Creates a new map inside of the given HTML container (Typically DIV)
 * @returns {geoModule.map}
 */
geoModule.mapSource = function(node, options) {
  "use strict";
  if (!(this instanceof geoModule.mapSource)) {
    return new geoModule.mapSource(node, options);
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
      m_renderer = null,
      m_actors = [],
      m_actors_texture = [],
      m_tiles = [];

  /** @public **/
  var MAP_OSM = 0,
      MAP_MQOSM = 1,
      MAP_MQAERIAL = 2,
      MAP_NUMTYPES = 3;

  this.m_maptype = MAP_MQOSM;

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
  m_interactorStyle.setMap(this)
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
    } while (currentElement === currentElement.offsetParent);

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


  $(m_interactorStyle).on(ogs.vgl.command.leftButtonPressEvent, draw);
  $(m_interactorStyle).on(ogs.vgl.command.middleButtonPressEvent, draw);
  $(m_interactorStyle).on(ogs.vgl.command.rightButtonPressEvent, draw);
  $(this).on(geoModule.command.updateEvent, draw);


  /**
   * Initialize Tiles
   */
  this.initTiles = function() {
    // Get node dimensions
    var w = node.width, h = node.height;

    // Calculate number of tiles in X and Y
    // Add +1 to round up.. not using ceiling as precaution
    var tilesize = 128;//256;
    var x = Math.round(w/tilesize)+1;
    var y = Math.round(h/tilesize)+1;

    for(var i=0; i<x; ++i){
      for(var j=0; j<y; ++j){
        // Calculate Tile Position
        var posx = -(x*tilesize/2) + i*tilesize;
        var posy = -(y*tilesize/2) + j*tilesize;
        // Create Tile Actor and Image
        var actor = ogs.vgl.utils.createTexturePlane(posx, posy,
          0.0, posx+tilesize, posy, 0.0, posx, posy+tilesize, 0.0);
        var tile = new Image();
        tile.actor = actor;
        m_actors.push(actor);
        m_tiles.push(tile);
        m_renderer.addActor(actor);
      }
    }
  }

  /**
   * Get Texture and Draw the Tiles
   */
  this.drawTiles = function() {
    // Clean Textures
    m_actors_texture = [];

    // Get node dimensions
    var w = node.width, h = node.height;

    // Calculate number of tiles in X and Y
    // Add +1 to round up.. not using ceiling as precaution
    var tilesize = 128;//256;
    var x = Math.round(w/tilesize)+1;
    var y = Math.round(h/tilesize)+1;

    //get zoom level
    var zoom = m_options.zoom;

    //calculate number of tiles based on zoom level
    // and max number of tiles
    var max_tiles = [x, y];
    if (zoom === 1) {
      max_tiles = [2, 2];
    } else if (zoom === 2) {
      max_tiles = [4, 4];
    }
    // Inverting Y axis
    var inv_y = y;
    if (y > max_tiles[1]) {
      inv_y = max_tiles[1];
    }
    // Max Tiles in the map
    var max_tilemap = Math.pow(2, zoom);

    // Calculate Center Deviation
    var t1 = geoModule.mercator.long2tilex2(m_options.center.lng(), zoom);
    var t2 = geoModule.mercator.lat2tiley2(m_options.center.lat(), zoom);
    var mod_x = t1[0] - x/2;
    var mod_y = t2[0] - y/2;

    // Get Integer part
    mod_x = Math.round(mod_x);
    mod_y = Math.round(mod_y);

    // Calculate translation to keep center for the first 3 levels
    var npos = [ (x-max_tiles[0])*tilesize/2.0,
                 (y-max_tiles[1])*tilesize/2.0,
                 0];

    // Apply fraction of tilex to put latlng in the center
    npos[0] -= t1[1]*tilesize;
    npos[1] += t2[1]*tilesize;

    for(var i=0; i<x; ++i){
      for(var j=0; j<y; ++j){
        var actor = m_actors[j+(i*y)];
        var tile = m_tiles[j+(i*y)];

        // Will hide the tile actors if its the border of the map
        if (i >= max_tiles[0] || j >= max_tiles[1]
            || (i+mod_x) >= max_tilemap || ((inv_y-1)-j+mod_y) >= max_tilemap
            || i+mod_x < 0 || (inv_y-1)-j+mod_y < 0) {
          actor.setVisible(false);

        } else {
          actor.setTranslation(npos[0], npos[1], npos[2]);
          actor.setVisible(true);
          var tileText = new vglModule.texture();
          m_actors_texture.push(tileText);
          tile.texture = tileText;
          //To support Cross Domain request
          tile.crossOrigin = 'anonymous';

          var src = "";
          switch (this.m_maptype) {
          case MAP_OSM:
            src = "http://tile.openstreetmap.org/" + zoom + "/" + (i+mod_x) + "/" + ((inv_y-1)-j+mod_y) + ".png";
            break;
          case MAP_MQOSM:
            src = "http://otile1.mqcdn.com/tiles/1.0.0/osm/" + zoom + "/" + (i+mod_x) + "/" + ((inv_y-1)-j+mod_y) + ".jpg";
            break;
          case MAP_MQAERIAL:
          default:
            src = "http://otile1.mqcdn.com/tiles/1.0.0/sat/" + zoom + "/" + (i+mod_x) + "/" + ((inv_y-1)-j+mod_y) + ".jpg";
            break;
          }
          tile.src = src;

          tile.onload = function() {
            this.texture.updateDimensions();
            this.texture.setImage(this);
            this.actor.material().addAttribute(this.texture);
            draw();
          };
        }
      }
    }
  }

  this.initTiles();
  this.setZoom(3);
  this.drawTiles();

  document.onmousedown = m_viewer.handleMouseDown;
  document.onmouseup = m_viewer.handleMouseUp;
  document.onmousemove = m_viewer.handleMouseMove;
  document.oncontextmenu = m_viewer.handleContextMenu;
  HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

  document.onkeydown = function(evt) {
    var move = 10.0/Math.pow(2, m_options.zoom);
    switch(evt.keyCode) {
    case 107: // + of right keyboard
      m_options.zoom++;
      if (m_options.zoom > 18) m_options.zoom = 18;
      m_that.drawTiles();
      break;
    case 109: // - of right keyboard
      m_options.zoom--;
      if (m_options.zoom < 1) m_options.zoom = 1;
      m_that.drawTiles();
      break;
    case 219: // [ = 219
      var i = m_that.getMapType();
      i -= 1;
      if (i < 0) i = MAP_NUMTYPES-1;
      m_that.setMapType(i);
      break;
    case 221: // ] = 221
      var i = m_that.getMapType();
      i += 1;
      if (i >= MAP_NUMTYPES) i = 0;
      m_that.setMapType(i);
      break;
    case 37: //  <
        var c = m_that.center();
        var n = geoModule.latlng(c.lat(), c.lng()-move);
        m_that.setCenter(n);
        break;
    case 38: //  /\
        var c = m_that.center();
        var n = geoModule.latlng(c.lat()+move, c.lng());
        m_that.setCenter(n);
        break;
    case 39: //  >
        var c = m_that.center();
        var n = geoModule.latlng(c.lat(), c.lng()+move);
        m_that.setCenter(n);
        break;
    case 40: //  \/
        var c = m_that.center();
        var n = geoModule.latlng(c.lat()-move, c.lng());
        m_that.setCenter(n);
        break;
    }
  }

  /**
  * Get center
  *
  * @method center
  * @return {geoModule.latlng}
  */
  this.center = function() {
    return m_options.center;
  }

  /**
  * Set center
  *
  * @method setCenter
  * @param {geoModule.latlng}
  */
  this.setCenter = function(val) {
    m_options.center = val;
    this.drawTiles();
    //m_viewer.render();
    this.modified();
  }

  /**
  * Set map style
  *
  * @method setMapType
  * @param {int} map type
  */
  this.setMapType = function(type) {
    this.m_maptype = type;
    this.drawTiles();
  }

  /**
  * Get map style
  *
  * @method getMapStyle
  * @return {int}
  */
  this.getMapType = function() {
    return this.m_maptype;
  }

  /**
   * Get map options
   */
  this.options = function() {
    return m_options;
  };

  /**
   * Add layer to the map
   *
   * @method addLayer
   * @param {geo.layer} layer to be added to the map
   * @return {Boolean}
   */
  this.addLayer = function(layer) {
    if (layer !== null) {
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
    if (layer !== undefined && m_activeLayer !== layer) {
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
    console.log('width', width);
    console.log('height', height);
    m_renderer.camera().setParallelProjection(
      -width * 0.5, width * 0.5, height * 0.5, -height * 0.5);
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
    if (layer === null) {
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

inherit(geoModule.mapSource, ogs.vgl.object);
