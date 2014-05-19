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
  'use strict';

  if (!(this instanceof geo.osmLayer)) {
    return new geo.osmLayer(arg);
  }
  geo.featureLayer.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Private member variables
   *
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
    m_hiddenBinNumber = 0,
    m_visibleBinNumber = 1000,
    m_pendingNewTiles = [],
    m_pendingInactiveTiles = [],
    m_numberOfCachedTiles = 0,
    m_tileCacheSize = 100,
    m_previousZoom = null,
    m_baseUrl = 'http://otile1.mqcdn.com/tiles/1.0.0/osm/',
    s_init = this._init,
    s_update = this._update;

  if (arg && arg.baseUrl !== undefined) {
    m_baseUrl = arg.baseUrl;
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set tile cache size
   */
  ////////////////////////////////////////////////////////////////////////////
  this.tileCacheSize = function(val) {
    if (val === undefined) {
      return m_tileCacheSize;
    }
    m_tileCacheSize = val;
    this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Transform a point or array of points in latitude-longitude space to
   * local space of the layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.toLocal = function(input) {
    var i, output = [];

    /// Now handle different data types
    if (input instanceof Array && input.length > 0) {
      output.length = input.length;

      /// Input is array of geo.latlng
      if (input[0] instanceof geo.latlng) {
        for (i = 0; i < input.length; ++i) {
          output[i] = geo.latlng(input[i]);
          output[i].lat(geo.mercator.lat2y(output[i].lat()));
        }
      } else {
        output = m_baseLayer.renderer().worldToDisplay(input).slice(0);
      }
    } else if (input instanceof geo.latlng) {
      output.push(geo.latlng(input));
      output[0].lat(geo.mercator.lat2y(output[0].lat()));
    } else {
      throw 'toLocal does not handle ' + input;
    }

    return output;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Transform a point or array of points in local space to
   * latitude-longitude space
   */
  ////////////////////////////////////////////////////////////////////////////
  this.fromLocal = function(input) {
    var i, output = [];

    if (input instanceof Array && input.length > 0) {
      output.length = input.length;

      if (input[0] instanceof Object) {
        for (i = 0; i < input.length; ++i) {
          output[i] = {};
          output[i].x = input[i].x;
          output[i].y = geo.mercator.y2lat(input[i].y);
        }
      } else {
        for (i = 0; i < input.length; ++i) {
          output[i] = input[i];
          output[i + 1] = geo.mercator.y2lat(input[i + 1]);
        }
      }
    } else {
      throw 'fromLocal does not handle ' + input;
    }

    return output;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Check if a tile exists in the cache
   *
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
    return true;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create a new tile
   * @param x {number} X axis tile index
   * @param y {number} Y axis tile index
   */
  ////////////////////////////////////////////////////////////////////////////
  this._addTile = function(request, zoom, x, y) {
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
    tile.REMOVED = false;
    tile.REMOVING = false;

    tile.crossOrigin = 'anonymous';
    tile.zoom = zoom;
    tile.index_x = x;
    tile.index_y = y;
    tile.llx = llx;
    tile.lly = lly;
    tile.urx = urx;
    tile.ury = ury;
    tile.lastused = new Date();

    // tile.src = "http://tile.openstreetmap.org/" + zoom + "/" + (x)
    //   + "/" + (Math.pow(2,zoom) - 1 - y) + ".png";
    tile.src = m_baseUrl + zoom + "/" +
      (x) + "/" + (Math.pow(2,zoom) - 1 - y) + ".jpg";

    m_tiles[zoom][x][y] = tile;
    m_pendingNewTiles.push(tile);

    ++m_numberOfCachedTiles;
    return tile;
  };


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Clear tiles that are no longer required
   */
  ////////////////////////////////////////////////////////////////////////////
  this._removeTiles = function(request) {
    var i, x, y, tile, zoom, currZoom = this.map().zoom();

    if (!m_tiles) {
      return this;
    }

    if (m_previousZoom === currZoom) {
      return this;
    }
    m_previousZoom = currZoom;

    for (zoom in m_tiles) {
      if (currZoom === zoom) {
        continue;
      }
      for (x in m_tiles[zoom]) {
        for (y in m_tiles[zoom][x]) {
          tile = m_tiles[zoom][x][y];
          if (tile) {
            tile.REMOVING = true;
            m_pendingInactiveTiles.push(tile);
          }
        }
      }
    }

    setTimeout(function() {
      var tile, i;

      /// First remove the tiles if we have cached more than max cached limit
      m_pendingInactiveTiles.sort(function(a, b) {
        return a.lastused - b.lastused;
      });

      i = 0;
      /// Get rid of tiles if we have reached our threshold. However,
      /// If the tile is required for current zoom, then do nothing.
      while (m_numberOfCachedTiles > m_tileCacheSize &&
        i < m_pendingInactiveTiles.length) {
        tile = m_pendingInactiveTiles[i];
        if (tile.zoom !== m_this.map().zoom()) {
          m_this._delete(tile.feature);
          delete m_tiles[tile.zoom][tile.index_x][tile.index_y];
          m_pendingInactiveTiles.splice(i, 1);
          --m_numberOfCachedTiles;
        }
        ++i;
      }

      for (i = 0; i < m_pendingInactiveTiles.length; ++i) {
        tile = m_pendingInactiveTiles[i];
        if (tile.zoom !== m_this.map().zoom()) {
          tile.REMOVING = false;
          tile.REMOVED = true;
          tile.feature.bin(m_hiddenBinNumber);
        } else {
          tile.REMOVING = false;
          tile.REMOVED = false;
          tile.lastused = new Date();
          tile.feature.bin(m_visibleBinNumber);
        }
        tile.feature._update();
      }
      m_pendingInactiveTiles = [];
      m_this._draw();
    }, 100);

    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create / delete tiles as necessary
   */
  ////////////////////////////////////////////////////////////////////////////
  this._addTiles = function(request) {
    var feature, ren = this.renderer(), node = this.node(),
        zoom = this.map().zoom(),
        /// First get corner points
        /// In display coordinates the origin is on top left corner (0, 0)
        llx = 0.0, lly = this.height(), urx = this.width(), ury = 0.0,
        temp = null, tile = null, tile1x = null, tile1y = null, tile2x = null,
        tile2y = null, invJ = null, i = 0, j = 0,
        worldPt1 = ren.displayToWorld([llx, lly])[0],
        worldPt2 = ren.displayToWorld([urx, ury])[0];

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
          m_this._addTile(request, zoom, i, invJ);
        } else {
          tile = m_tiles[zoom][i][invJ];
          tile.feature.bin(m_visibleBinNumber);
          tile.lastused = new Date();
          tile.feature._update();
        }
      }
    }

    /// And now finally add them
    for (i = 0; i < m_pendingNewTiles.length; ++i) {
      tile = m_pendingNewTiles[i];

      tile.onload = function() {
        this.LOADING = false;
        this.LOADED = true;
        if ((tile.REMOVING || this.REMOVED) &&
          this.feature &&
          tile.zoom !== m_this.map().zoom()) {
          this.feature.bin(m_hiddenBinNumber);
          this.REMOVING = false;
          this.REMOVED = true;
        } else {
          this.REMOVED = false;
          this.lastused = new Date();
          this.feature.bin(m_visibleBinNumber);
        }
        this.feature._update();
        m_this._draw();
      };
      feature = this.create('planeFeature', {drawOnAsyncResourceLoad: false})
                  .origin([tile.llx, tile.lly])
                  .upperLeft([tile.llx, tile.ury])
                  .lowerRight([tile.urx, tile.lly])
                  .gcs('"EPSG:3857"')
                  .style('image', tile);
      tile.feature = feature;
    }
    m_pendingNewTiles = [];
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create / delete tiles as necessary
   */
  ////////////////////////////////////////////////////////////////////////////
  this._updateTiles = function(request) {
    var zoom = m_this.map().zoom();
    /// Add tiles that are currently visible
    this._addTiles(request);

    /// Remove or hide tiles that are not visible
    m_this._removeTiles(request);

    /// Trigger draw now
    m_this._draw();

    this.updateTime().modified();
    return this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   *
   * Do not call parent _init method as its already been executed
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function() {
    s_init.call(this);
    this.gcs("EPSG:3857");
    return this;
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

  return this;
};

inherit(geo.osmLayer, geo.featureLayer);
