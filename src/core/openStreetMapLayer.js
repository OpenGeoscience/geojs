//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, vec4, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of openStreetMapLayer
 */
//////////////////////////////////////////////////////////////////////////////
geoModule.openStreetMapLayer = function() {
  "use strict";
  if (!(this instanceof geoModule.openStreetMapLayer)) {
    return new geoModule.openStreetMapLayer();
  }
  geoModule.featureLayer.call(this);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private member variables
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_that = this,
      MAP_OSM = 0,
      MAP_MQOSM = 1,
      MAP_MQAERIAL = 2,
      MAP_NUMTYPES = 3,
      m_mapType = MAP_MQOSM,
      m_tiles = {},
      m_newFeatures = this.newFeatures(),
      m_expiredFeatures = this.expiredFeatures(),
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
    if (!m_tiles[zoom]) {
      m_tiles[zoom] = {};
    }

    if (!m_tiles[zoom][x]) {
      m_tiles[zoom][x] = {};
    }

    if (m_tiles[zoom][x][y]) {
      return;
    }

    // Compute corner points
    var noOfTilesX = Math.max(1, Math.pow(2, zoom)),
        noOfTilesY = Math.max(1, Math.pow(2, zoom)),
        // Convert into mercator
        totalLatDegrees = 360.0,
        lonPerTile = 360.0 / noOfTilesX,
        latPerTile = totalLatDegrees / noOfTilesY,
        llx = -180.0 + x * lonPerTile,
        lly = -totalLatDegrees * 0.5 + y * latPerTile,
        urx = -180.0 + (x + 1) * lonPerTile,
        ury = -totalLatDegrees * 0.5 + (y + 1) * latPerTile,
        actor = ogs.vgl.utils.createTexturePlane(llx, lly,
          0.0, urx, lly, 0.0, llx, ury, 0.0),
        tile = new Image();
        //console.log("New tile: ["+llx+" , "+lly+"] ["+urx+" , "+ury+"]");

    tile.LOADING = true;
    tile.LOADED = false;
    tile.UNLOAD = false;
    tile.REMOVED = false;
    tile.actor = actor;
    tile.crossOrigin = 'anonymous';
    // tile.src = "http://tile.openstreetmap.org/" + zoom + "/" + (x)
    //   + "/" + (Math.pow(2,zoom) - 1 - y) + ".png";
    tile.src = "http://otile1.mqcdn.com/tiles/1.0.0/osm/" + zoom + "/" +
      (x) + "/" + (Math.pow(2,zoom) - 1 - y) + ".jpg";
    tile.texture = new vglModule.texture();
    tile.onload = function() {
      if (this.UNLOAD) {
        this.LOADING = false;
        m_tiles[zoom][x][y] = null;
        return;
      }
      this.LOADING = false;
      this.LOADED = true;
      this.texture.updateDimensions();
      this.texture.setImage(this);
      this.actor.material().addAttribute(this.texture);
      this.actor.material().setBinNumber(m_that.binNumber());
      m_newFeatures.push(this.actor);
      m_updateTime.modified();
      request.requestRedraw();
    };

    m_tiles[zoom][x][y] = tile;
    return tile;
  };


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Clear tiles that are no longer required
   */
  ////////////////////////////////////////////////////////////////////////////
  this.removeTiles = function(request) {
    var mapOptions = request.mapOptions(),
        zoom = null,
        x = null,
        y = null;

    if (!mapOptions) {
      console.log("[info] Invalid map  options. Cannot clear tile.");
      return;
    }

    if (m_previousZoom === null || m_previousZoom === mapOptions.zoom) {
      return;
    }

    if (!m_tiles) {
      return;
    }

    // For now just clear the tiles from the last zoom.
    for (zoom in m_tiles) {
      if (!m_tiles[zoom]) {
        continue;
      }

      if (zoom === mapOptions.zoom) {
        continue;
      }

      for (x in m_tiles[zoom]) {
        if (!m_tiles[zoom][x]) {
          continue;
        }
        for (y in m_tiles[zoom][x]) {
          if (!m_tiles[zoom][x][y]) {
            continue;
          }

          if (!m_tiles[zoom][x][y].LOADED) {
            m_tiles[zoom][x][y].UNLOAD = true;
            continue;
          }

          if (m_tiles[zoom][x][y].REMOVED) {
            continue;
          }

          m_tiles[zoom][x][y].REMOVED = true;
          m_tiles[zoom][x][y].actor.REMOVED = true;
          m_expiredFeatures.push(m_tiles[zoom][x][y].actor);
          m_tiles[zoom][x][y] = null;
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
    if (!request.viewer()) {
      console.log('[info] Invalid viewer');
      return;
    }

    var viewer = request.viewer(),
        renderer = viewer.renderWindow().activeRenderer(),
        camera = renderer.camera(),
        mapOptions = request.mapOptions(),
        node = request.node(),
        zoom = mapOptions.zoom,
        // First get corner points
        // In display coordinates the origin is on top left corner (0, 0)
        llx = 0.0,
        lly = node.height,
        urx = node.width,
        ury = 0.0,
        temp = null,
        tile = null,
        tile1x = null,
        tile1y = null,
        tile2x = null,
        tile2y = null,
        invJ = null,
        i = 0,
        j = 0,
        // Now convert display point to world point
          // @NOTE Tiles are drawn at z = 0.
        focalPoint = camera.focalPoint(),
        focusWorldPt = vec4.fromValues(
          focalPoint[0], focalPoint[1], 0.0, 1),
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


    // @TODO Currently we blindly remove all tiles from previous zoom
    // state. This could be optimized.
    m_that.removeTiles(request);

    worldPt1[0] = Math.max(worldPt1[0], -180.0);
    worldPt1[0] = Math.min(worldPt1[0],  180.0);
    worldPt1[1] = Math.max(worldPt1[1], -180.0);
    worldPt1[1] = Math.min(worldPt1[1],  180.0);

    worldPt2[0] = Math.max(worldPt2[0], -180.0);
    worldPt2[0] = Math.min(worldPt2[0],  180.0);
    worldPt2[1] = Math.max(worldPt2[1], -180.0);
    worldPt2[1] = Math.min(worldPt2[1],  180.0);

    // Compute tilex and tiley
    tile1x = geoModule.mercator.long2tilex(worldPt1[0], zoom);
    tile1y = geoModule.mercator.lat2tiley(worldPt1[1], zoom);

    tile2x = geoModule.mercator.long2tilex(worldPt2[0], zoom);
    tile2y = geoModule.mercator.lat2tiley(worldPt2[1], zoom);

    // Clamp tilex and tiley
    tile1x = Math.max(tile1x, 0);
    tile1x = Math.min(Math.pow(2, zoom) - 1, tile1x);
    tile1y = Math.max(tile1y, 0);
    tile1y = Math.min(Math.pow(2, zoom) - 1, tile1y);

    tile2x = Math.max(tile2x, 0);
    tile2x = Math.min(Math.pow(2, zoom) - 1, tile2x);
    tile2y = Math.max(tile2y, 0);
    tile2y = Math.min(Math.pow(2, zoom) - 1, tile2y);

    // Check and update variables appropriately if view
    // direction is flipped. This should not happen but
    // just in case.
    if (tile1x > tile2x) {
      temp = tile1x;
      tile1x = tile2x;
      tile2x = temp;
    }
    if (tile2y > tile1y) {
      temp = tile1y;
      tile1x = tile2y;
      tile2y = temp;
    }

    for (i = tile1x; i <= tile2x; ++i) {
      for (j = tile2y; j <= tile1y; ++j) {
        invJ = (Math.pow(2,zoom) - 1 - j);
        if  (!m_that.hasTile(zoom, i, invJ)) {
          tile = m_that.addTile(request, zoom, i, invJ);
        }
      }
    }

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
      console.log("[warning] Invalid map options.");
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
    featureCollection.setNewFeatures(this.id(), m_newFeatures.slice(0));
    featureCollection.setExpiredFeatures(this.id(), m_expiredFeatures.slice(0));

    m_newFeatures.length = 0;
    m_expiredFeatures.length = 0;

    m_predrawTime.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Implements querying locations
   */
  ////////////////////////////////////////////////////////////////////////////
  this.queryLocation = function(location) {
    var result = {
      layer : this,
      data : {
        "lon": location.x,
        "lat": location.y
      }
    },
    revent = $.Event(geoModule.command.queryResultEvent);

    revent.srcEvent = location.event;
    $(this).trigger(revent, result);
  };

  this.setBinNumber(ogs.vgl.material.RenderBin.Base);
};

inherit(geoModule.openStreetMapLayer, geoModule.featureLayer);