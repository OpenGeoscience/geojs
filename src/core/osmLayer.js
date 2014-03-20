//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, vec4, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of osmLayer
 */
//////////////////////////////////////////////////////////////////////////////
geo.osmLayer = function(arg) {
  "use strict";
  if (!(this instanceof geo.osmLayer)) {
    return new geo.osmLayer(arg);
  }
  geo.featureLayer.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private member variables
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      MAP_OSM = 0,
      MAP_MQOSM = 1,
      MAP_MQAERIAL = 2,
      MAP_NUMTYPES = 3,
      m_mapType = MAP_MQOSM,
      m_tiles = {},
      m_previousZoom = null,
      s_update = this._update;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Check if a tile exists in the cache
   * @param zoom {number} The zoom value for the map [1-17]
   * @param x {number} X axis tile index
   * @param y {number} Y axis tile index
   */
  ////////////////////////////////////////////////////////////////////////////
  this._hasTile = function(zoom, x, y) {
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
  this._addTiles = function(request, zoom, x, y) {
    if (!m_tiles[zoom]) {
      m_tiles[zoom] = {};
    }

    if (!m_tiles[zoom][x]) {
      m_tiles[zoom][x] = {};
    }

    if (m_tiles[zoom][x][y]) {
      return;
    }

    /// Compute corner points
    var noOfTilesX = Math.max(1, Math.pow(2, zoom)),
        noOfTilesY = Math.max(1, Math.pow(2, zoom)),
        /// Convert into mercator
        totalLatDegrees = 360.0,
        lonPerTile = 360.0 / noOfTilesX,
        latPerTile = totalLatDegrees / noOfTilesY,
        llx = -180.0 + x * lonPerTile,
        lly = -totalLatDegrees * 0.5 + y * latPerTile,
        urx = -180.0 + (x + 1) * lonPerTile,
        ury = -totalLatDegrees * 0.5 + (y + 1) * latPerTile,
        feature = null,
        tile = new Image();
        //console.log("New tile: ["+llx+" , "+lly+"] ["+urx+" , "+ury+"]");

    tile.LOADING = true;
    tile.LOADED = false;
    tile.UNLOAD = false;
    tile.REMOVED = false;

    tile.crossOrigin = 'anonymous';

    // tile.src = "http://tile.openstreetmap.org/" + zoom + "/" + (x)
    //   + "/" + (Math.pow(2,zoom) - 1 - y) + ".png";
    tile.src = "http://otile1.mqcdn.com/tiles/1.0.0/osm/" + zoom + "/" +
      (x) + "/" + (Math.pow(2,zoom) - 1 - y) + ".jpg";

    feature = this.create('planeFeature')
                  .origin([llx, lly])
                  .upperLeft([llx, ury])
                  .lowerRight([urx, lly])
                  .gcs('"EPSG:3857"')
                  .style('image', tile);

    tile.feature = feature;
    tile.onload = function() {
      if (this.UNLOAD) {
        this.LOADING = false;
        m_this._delete(m_tiles[zoom][x][y].feature);
        m_tiles[zoom][x][y] = null;
        return;
      }
      this.LOADING = false;
      this.LOADED = true;
    };

    m_tiles[zoom][x][y] = tile;
    return tile;
  };


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Clear tiles that are no longer required
   */
  ////////////////////////////////////////////////////////////////////////////
  this._removeTiles = function(request) {
    var request = request === undefined ? {} : request,
        zoom = request.zoom === undefined ? 0 : request.zoom,
        x = null,
        y = null;

    if (m_previousZoom === null || m_previousZoom === zoom) {
      return;
    }

    if (!m_tiles) {
      return;
    }

    /// For now just clear the tiles from the last zoom.
    for (zoom in m_tiles) {
      if (!m_tiles[zoom]) {
        continue;
      }

      if (zoom === request.zoom) {
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
          m_this._delete(m_tiles[zoom][x][y].feature);
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
  this._updateTiles = function(request) {
    var ren = this.renderer(),
        node = this.node(),
        zoom = this.map().zoom(),
        /// First get corner points
        /// In display coordinates the origin is on top left corner (0, 0)
        llx = 0.0,
        lly = node.height(),
        urx = node.width(),
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
        worldPt1 = ren.displayToWorld([llx, lly])[0],
        worldPt2 = ren.displayToWorld([urx, ury])[0];

    /// TODO Currently we blindly remove all tiles from previous zoom
    /// state. This could be optimized.
    m_this._removeTiles(request);

    worldPt1[0] = Math.max(worldPt1[0], -180.0);
    worldPt1[0] = Math.min(worldPt1[0],  180.0);
    worldPt1[1] = Math.max(worldPt1[1], -180.0);
    worldPt1[1] = Math.min(worldPt1[1],  180.0);

    worldPt2[0] = Math.max(worldPt2[0], -180.0);
    worldPt2[0] = Math.min(worldPt2[0],  180.0);
    worldPt2[1] = Math.max(worldPt2[1], -180.0);
    worldPt2[1] = Math.min(worldPt2[1],  180.0);

    /// Compute tilex and tiley
    tile1x = geo.mercator.long2tilex(worldPt1[0], zoom);
    tile1y = geo.mercator.lat2tiley(worldPt1[1], zoom);

    tile2x = geo.mercator.long2tilex(worldPt2[0], zoom);
    tile2y = geo.mercator.lat2tiley(worldPt2[1], zoom);

    /// Clamp tilex and tiley
    tile1x = Math.max(tile1x, 0);
    tile1x = Math.min(Math.pow(2, zoom) - 1, tile1x);
    tile1y = Math.max(tile1y, 0);
    tile1y = Math.min(Math.pow(2, zoom) - 1, tile1y);

    tile2x = Math.max(tile2x, 0);
    tile2x = Math.min(Math.pow(2, zoom) - 1, tile2x);
    tile2y = Math.max(tile2y, 0);
    tile2y = Math.min(Math.pow(2, zoom) - 1, tile2y);

    /// Check and update variables appropriately if view
    /// direction is flipped. This should not happen but
    /// just in case.
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
        if  (!m_this._hasTile(zoom, i, invJ)) {
          tile = m_this._addTiles(request, zoom, i, invJ);
        }
      }
    }

    this.updateTime().modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function(request) {
    /// Update tiles (create new / delete old etc...)
    this._updateTiles(request);

    /// Now call base class update
    s_update.call(this, request);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function(arg) {
    this.gcs("EPSG:3857");

    this.on(geo.event.resize, function(event) {
      m_this.renderer()._resize(event.x, event.y, event.width, event.height);
      m_this._update({});
      m_this.renderer()._render();
    });

    this.on(geo.event.pan, function(event) {
      m_this.layer()._update({});
      m_this.renderer()._render();
    });
  };

  this._init(arg);
  return this;
};

inherit(geo.osmLayer, geo.featureLayer);
