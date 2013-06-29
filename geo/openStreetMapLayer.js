/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true, white: true, indent: 2*/
/*global geoModule, ogs, inherit, $, Image, vglModule, document*/

//////////////////////////////////////////////////////////////////////////////
/**
 *
 * Create a new instance of openStreetMapLayer
 *
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.openStreetMapLayer = function() {
  "use strict";
  if (!(this instanceof geoModule.openStreetMapLayer)) {
    return new geoModule.openStreetMapLayer();
  }
  geoModule.featureLayer.call(this);

  /** @public **/
  var MAP_OSM = 0,
      MAP_MQOSM = 1,
      MAP_MQAERIAL = 2,
      MAP_NUMTYPES = 3;

  /** @private */
  var m_that = this,
      m_mapType = MAP_MQOSM,
      m_tiles = [],
      m_deleteTiles = [],
      m_newFeatures = [],
      m_expiredFeatures = [],
      m_previousZoom = null,
      m_predrawTime = ogs.vgl.timestamp(),
      m_updateTime = ogs.vgl.timestamp();

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Check if a tile exists in the cache
   * @param zoom {number} The zoom value for the map [1-17]
   * @param x {number} X axis tile index
   * @param y {number} Y axis tile index
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create a new tile
   * @param x {number} X axis tile index
   * @param y {number} Y axis tile index
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addTile = function(request, zoom, x, y) {
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
      1.0, urx - 1, lly, 1.0, llx, ury - 1, 1.0);
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
      m_newFeatures.push(this.actor);
      m_updateTime.modified();
      request.requestPredraw();
    };

    return tile;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove tiles from the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.removeTiles = function() {
    var i = 0;
    for (i = 0; i < m_deleteTiles.length; ++i) {
      m_expiredFeatures.push(m_deleteTiles[i].actor);
    }
    m_deleteTiles = [];
  };


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Clear tiles that are no longer required
   */
  ////////////////////////////////////////////////////////////////////////////
  this.clearTiles = function(request) {
    var mapOptions = request.mapOptions();

    if (!mapOptions) {
      console.log("[info] Invalid map  options. Cannot clear tile.")
      return;
    }

    if (m_previousZoom === null) {
      return;
    }

    if (m_previousZoom === mapOptions.zoom) {
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

      if (i === mapOptions.zoom) {
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create / delete tiles as necessary
   */
  ////////////////////////////////////////////////////////////////////////////
  this.updateTiles = function(request) {
    var viewer = request.viewer(),
        renderer = null,
        camera = null,
        mapOptions = request.mapOptions(),
        node = request.node();

    if (!viewer) {
      console.log('[info] Invlaid viewer');
      return;
    }
    renderer = viewer.renderWindow().activeRenderer();
    camera = renderer.camera();

    var totalLatDegrees = 360.0;
    var zoom = mapOptions.zoom;
    // console.log('zoom', zoom);

    // First get corner points
    // In display coordinates the origin is on top left corner (0, 0)
    var llx = 0.0,
        lly = node.height,
        urx = node.width,
        ury = 0.0,
        // Now convert display point to world point
        focalPoint = camera.focalPoint(),
        focusWorldPt = vec4.fromValues(
          focalPoint[0], focalPoint[1], focalPoint[2], 1),
        focusDisplayPt = renderer.worldToDisplay(
          focusWorldPt, camera.viewMatrix(),
          camera.projectionMatrix(), node.width, node.height),
        displayPt1 = vec4.fromValues(
          llx, lly, focusDisplayPt[2], 1.0),
        displayPt2 = vec4.fromValues(
          urx, ury, focusDisplayPt[2], 1.0),
        worldPt1 = renderer.displayToWorld(
          displayPt1, camera.viewMatrix(), camera.projectionMatrix(),
          node.width, node.height),
        worldPt2 = renderer.displayToWorld(
          displayPt2, camera.viewMatrix(), camera.projectionMatrix(),
          node.width, node.height);

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

    // @TODO Currently we blindly remove all tiles from previous zoom
    // state. This could be optimized.
    m_that.clearTiles(request);

    var invJ =  null;
    for (var i = tile1x; i <= tile2x; ++i) {
      for (var j = tile2y; j <= tile1y; ++j) {
        invJ = (Math.pow(2,zoom) - 1 - j)
        if  (m_that.hasTile(zoom, i, invJ)) {
          // Do something here
        } else {
          var tile = m_that.addTile(request, zoom, i, invJ);
        }
      }
    }

    m_that.removeTiles();
    m_updateTime.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.update = function(request) {
    var mapOptions = request.mapOptions();
    if (!mapOptions) {
      console.log("[warning] Invalid map options.")
      return;
    }

    if (m_previousZoom === mapOptions.zoom) {
      return;
    }

    this.updateTiles(request);

    // Update previous zoom if necessary
    if (m_previousZoom !== mapOptions.zoom) {
      m_previousZoom = mapOptions.zoom;
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Collect new and expired features
   */
  ////////////////////////////////////////////////////////////////////////////
  this.predraw = function(request) {
    if (m_predrawTime.getMTime() > m_updateTime.getMTime()) {
      return;
    }
    var featureCollection = request.featureCollection();
    featureCollection.setNewFeatures(this.name(), m_newFeatures);
    featureCollection.setExpiredFeatures(this.name(), m_expiredFeatures);

    m_newFeatures = [];
    m_expiredFeatures = [];

    m_predrawTime.modified();
  }
};

inherit(geoModule.openStreetMapLayer, geoModule.featureLayer);
