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
geoModule.openStreetMapLayer = function(options) {
  "use strict";
  if (!(this instanceof geoModule.openStreetMapLayer)) {
    return new geoModule.openStreetMapLayer(options);
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
      m_renderer = null,
      m_tiles = [],
      m_deleteTiles = [],
      m_previousZoom = null;

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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Remove tiles from the renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.removeTiles = function() {
    var i = 0;

    for (i = 0; i < m_deleteTiles.length; ++i) {
      console.log('removing actor', m_deleteTiles[i].actor);
      m_renderer.removeActor(m_deleteTiles[i].actor);
    }
    m_deleteTiles = [];
    draw();
  };


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Clear tiles that are no longer required
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get Texture and Draw the Tiles
   */
  ////////////////////////////////////////////////////////////////////////////
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
        focusWorldPt = vec4.fromValues(
          focalPoint[0], focalPoint[1], focalPoint[2], 1),
        focusDisplayPt = m_renderer.worldToDisplay(
          focusWorldPt, camera.viewMatrix(),
          camera.projectionMatrix(), node.width, node.height),
        displayPt1 = vec4.fromValues(
          llx, lly, focusDisplayPt[2], 1.0),
        displayPt2 = vec4.fromValues(
          urx, ury, focusDisplayPt[2], 1.0),
        worldPt1 = m_renderer.displayToWorld(
          displayPt1, camera.viewMatrix(), camera.projectionMatrix(),
          node.width, node.height),
        worldPt2 = m_renderer.displayToWorld(
          displayPt2, camera.viewMatrix(), camera.projectionMatrix(),
          node.width, node.height);

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
};

inherit(geoModule.openStreetMapLayer, geoModule.featureLayer);
