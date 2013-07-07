//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*vglModule, document*/
//////////////////////////////////////////////////////////////////////////////

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
      m_tiles = [],
      m_deleteTiles = [],
      m_previousZoom = null;

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


  this.hasTile = function(zoom, x, y) {
    if (!m_tiles[zoom]) {
      return false;
    }

    if (!m_tiles[zoom][x]) {
      return false;
    }

    if (!m_tiles[zoom][x][y]) {
      return false;
    }

    return m_tiles[zoom][x][y];
  };


  this.addTile = function(zoom, x, y) {

    // Compute corner points
    var noOfTilesX = Math.max(1, Math.pow(2, zoom));
    var noOfTilesY = Math.max(1, Math.pow(2, zoom));

    // Conver into mercator
    var totalLatDegrees = 360.0; // in mercator
    var lonPerTile = 360.0 / noOfTilesX;
    var latPerTile = totalLatDegrees / noOfTilesY;

    var llx = -180.0 + x * lonPerTile;
    var lly = -totalLatDegrees * 0.5 + y * latPerTile;
    var urx = -180.0 + (x + 1) * lonPerTile;
    var ury = -totalLatDegrees * 0.5 + (y + 1) * latPerTile;

    // console.log('noOfTilesX, noOfTilesY', noOfTilesX, noOfTilesY);
    // console.log('x, y', x, y);
    // console.log('llx, lly, urx, ury', llx, lly, urx, ury);

    var actor = ogs.vgl.utils.createTexturePlane(llx, lly,
      1.0, urx, lly, 1.0, llx, ury, 1.0);
    var tile = new Image();
    tile.actor = actor;

    if (!m_tiles[zoom]) {
      m_tiles[zoom] = [];
    }

    if (!m_tiles[zoom][x]) {
      m_tiles[zoom][x] = [];
    }

    m_tiles[zoom][x][y] = tile;

    tile.crossOrigin = 'anonymous';
    tile.src = "http://tile.openstreetmap.org/" + zoom + "/" + (x)
      + "/" + (Math.pow(2,zoom) - 1 - y) + ".png";
    tile.texture = new vglModule.texture();
    tile.onload = function() {
      this.texture.updateDimensions();
      this.texture.setImage(this);
      this.actor.material().addAttribute(this.texture);
      m_renderer.addActor(this.actor);
      draw();
    };

    return tile;
  };

  this.removeTiles = function() {
    var i = 0;

    for (i = 0; i < m_deleteTiles.length; ++i) {
      console.log('removing actor', m_deleteTiles[i].actor);
      m_renderer.removeActor(m_deleteTiles[i].actor);
    }
    m_deleteTiles = [];
    draw();
  };


  this.clearTiles = function() {
    if (m_previousZoom === null) {
      m_previousZoom = m_options.zoom;
      return;
    }

    if (m_previousZoom === m_options.zoom) {
      return;
    }

    if (!m_tiles) {
      return;
    }

    // For now just clear the tiles from the last zoom.
    // TODO Remove tiles if more than threshold
    var i = null,
        j = null,
        k =  null;

    for (i = 0; i < m_tiles.length; ++i) {
      if (!m_tiles[i]) {
        continue;
      }

      if (i === m_options.zoom) {
        continue;
      }

      for (j = 0;  j < m_tiles[i].length; ++j) {
        if (!m_tiles[i][j]) {
          continue;
        }
        for (k = 0;  k < m_tiles[i][j].length; ++k) {
          if (!m_tiles[i][j][k]) {
            continue;
          }

          if (!m_tiles[i][j][k].actor) {
            continue;
          }

          if (m_tiles[i][j][k].REMOVED) {
            continue;
          }

          m_tiles[i][j][k].REMOVED = true;
          m_deleteTiles.push(m_tiles[i][j][k]);
          m_tiles[i][j][k] = null;
          // m_renderer.removeActor(m_tiles[i][j][k].actor);
        }
      }
    }
  };

  /**
   * Get Texture and Draw the Tiles
   */
  this.drawTiles = function() {
    var camera = m_renderer.camera();
    // console.log(camera.position()[2]);

    /// Compute the zoom level
    /// TODO This is HACK!. Come with a better solution
    if (camera.position()[2] < 600) {
      m_options.zoom = 3;
    }
    if (camera.position()[2] < 200) {
      m_options.zoom = 4;
    }
    if (camera.position()[2] < 100) {
      m_options.zoom = 5;
    }
    if (camera.position()[2] < 50) {
      m_options.zoom = 6;
    }
    if (camera.position()[2] < 25) {
      m_options.zoom = 7;
    }
    if (camera.position()[2] < 15) {
      m_options.zoom = 8;
    }
    if (camera.position()[2] < 5) {
      m_options.zoom = 9;
    }

    var totalLatDegrees = 360.0;
    var zoom = m_options.zoom;
    // console.log('zoom', zoom);

    // First get corner points
    // In display coordinates the origin is on top left corner (0, 0)
    var llx = 0.0,
        lly = node.height,
        urx = node.width,
        ury = 0.0,
    // Now convert display point to world point
        focalPoint = m_renderer.camera().focalPoint(),
        focusWorldPt = vec4.fromValues(focalPoint[0], focalPoint[1], focalPoint[2], 1),
        focusDisplayPt = m_renderer.worldToDisplay(focusWorldPt, camera.viewMatrix(),
          camera.projectionMatrix(), node.width, node.height),
        displayPt1 = vec4.fromValues(
          llx, lly, focusDisplayPt[2], 1.0),
        displayPt2 = vec4.fromValues(
          urx, ury, focusDisplayPt[2], 1.0),
        worldPt1 = m_renderer.displayToWorld(
          displayPt1, camera.viewMatrix(), camera.projectionMatrix(), node.width, node.height),
        worldPt2 = m_renderer.displayToWorld(
          displayPt2, camera.viewMatrix(), camera.projectionMatrix(), node.width, node.height);

    // console.log('worldPt1', worldPt1);
    // console.log('worldPt2', worldPt2);

    // Clamp world points
    worldPt1[0] = Math.max(worldPt1[0], -180.0);
    worldPt1[0] = Math.min(worldPt1[0],  180.0);
    worldPt1[1] = Math.max(worldPt1[1], -totalLatDegrees * 0.5);
    worldPt1[1] = Math.min(worldPt1[1],  totalLatDegrees * 0.5);

    worldPt2[0] = Math.max(worldPt2[0], -180.0);
    worldPt2[0] = Math.min(worldPt2[0],  180.0);
    worldPt2[1] = Math.max(worldPt2[1], -totalLatDegrees * 0.5);
    worldPt2[1] = Math.min(worldPt2[1],  totalLatDegrees * 0.5);

    // Compute tilex and tiley
    var tile1x = geoModule.mercator.long2tilex(worldPt1[0], zoom);
    var tile1y = geoModule.mercator.lat2tiley(worldPt1[1], zoom);

    var tile2x = geoModule.mercator.long2tilex(worldPt2[0], zoom);
    var tile2y = geoModule.mercator.lat2tiley(worldPt2[1], zoom);

    // Clamp tilex and tiley
    tile1x = Math.max(tile1x, 0);
    tile1x = Math.min(Math.pow(2, zoom) - 1, tile1x);
    tile1y = Math.max(tile1y, 0);
    tile1y = Math.min(Math.pow(2, zoom) - 1, tile1y);

    tile2x = Math.max(tile2x, 0);
    tile2x = Math.min(Math.pow(2, zoom) - 1, tile2x);
    tile2y = Math.max(tile2y, 0);
    tile2y = Math.min(Math.pow(2, zoom) - 1, tile2y);

    // TODO Using brute force method to clear out tiles from last zoom
    m_that.clearTiles();

    var invJ =  null;
    for (var i = tile1x; i <= tile2x; ++i) {
      for (var j = tile2y; j <= tile1y; ++j) {
        invJ = (Math.pow(2,zoom) - 1 - j)
        if  (m_that.hasTile(zoom, i, invJ)) {
          // Do something here
        } else {
          var tile = m_that.addTile(zoom, i, invJ);
        }
      }
    }

    draw();
    setTimeout(function(){m_that.removeTiles();}, 1000);
  };

  this.setZoom(3);
  this.drawTiles();

  document.onmousedown = m_viewer.handleMouseDown;
  document.onmouseup = m_viewer.handleMouseUp;
  document.onmousemove = m_viewer.handleMouseMove;
  document.oncontextmenu = m_viewer.handleContextMenu;
  HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

  $(m_interactorStyle).on(ogs.vgl.command.leftButtonPressEvent, this.drawTiles);
  $(m_interactorStyle).on(ogs.vgl.command.middleButtonPressEvent, draw);
  $(m_interactorStyle).on(ogs.vgl.command.rightButtonPressEvent, this.drawTiles);
  $(this).on(geoModule.command.updateEvent, draw);


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
