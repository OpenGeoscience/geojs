//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of osmLayer
 */
//////////////////////////////////////////////////////////////////////////////
geo.osmLayer = function (arg) {
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
    m_tiles = {},
    m_hiddenBinNumber = 0,
    m_lastVisibleBinNumber = 999,
    m_visibleBinNumber = 1000,
    m_pendingNewTiles = [],
    m_pendingInactiveTiles = [],
    m_numberOfCachedTiles = 0,
    m_tileCacheSize = 100,
    m_previousZoom = null,
    m_baseUrl = 'http://tile.openstreetmap.org/',
    m_imageFormat = 'png',
    m_updateTimerId = null,
    m_lastVisibleZoom = null,
    m_visibleTilesRange = {},
    s_init = this._init,
    m_pendingNewTilesStat = {},
    s_update = this._update;

  if (arg && arg.baseUrl !== undefined) {
    m_baseUrl = arg.baseUrl;
  }

  if (arg && arg.imageFormat !== undefined) {
    m_imageFormat = arg.imageFormat;
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return zoom to be used for fetching the tiles
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function getModifiedMapZoom() {
    if (m_this.map().zoom() < 18) {
      return (m_this.map().zoom() + 1);
    } else {
      return m_this.map().zoom();
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Check if a tile is visible in current view
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function isTileVisible(tile) {
    if (tile.zoom in m_visibleTilesRange) {
      if (tile.index_x >= m_visibleTilesRange[tile.zoom].startX &&
          tile.index_x <= m_visibleTilesRange[tile.zoom].endX &&
          tile.index_y >= m_visibleTilesRange[tile.zoom].startY &&
          tile.index_y <= m_visibleTilesRange[tile.zoom].endY) {
        return true;
      }
    }
    return false;
  }


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Draw new tiles and remove the old ones
   *
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  function drawTiles() {
    m_this._removeTiles();
    m_this._draw();
    delete m_pendingNewTilesStat[m_updateTimerId];
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set tile cache size
   */
  ////////////////////////////////////////////////////////////////////////////
  this.tileCacheSize = function (val) {
    if (val === undefined) {
      return m_tileCacheSize;
    }
    m_tileCacheSize = val;
    m_this.modified();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Transform a point or array of points in latitude-longitude-altitude
   * space to local space of the layer
   *
   * @param input Input can be of following types:
   * geo.latlng, [geo.latlng], [x1,y1, x2, y2], [[x,y]], {x:val: y:val, z:val},
   * [{x:val: y:val}]
   *
   * @returns geo.latlng, [geo.latlng], or {x:lon, y:lat}, [{x:lon, y:lat}]
   * [x1,y1, x2, y2], [[x,y]]
   */
  ////////////////////////////////////////////////////////////////////////////
  this.toLocal = function (input) {
    var i, output, delta;

    /// Now handle different data types
    if (input instanceof Array && input.length > 0) {
      output = [];
      output.length = input.length;

      /// Input is array of geo.latlng
      if (input[0] instanceof geo.latlng) {
        for (i = 0; i < input.length; i += 1) {
          output[i] = geo.latlng(input[i]);
          output[i].lat(geo.mercator.lat2y(output[i].lat()));
        }
      } else if (input[0] instanceof Array) {
        delta = input % 3 === 0 ? 3 : 2;

        if (delta === 2) {
          for (i = 0; i < input.length; i += delta) {
            output[i] = input[i];
            output[i + 1] = geo.mercator.lat2y(input[i + 1]);
          }
        } else {
          for (i = 0; i < input.length; i += delta) {
            output[i] = input[i];
            output[i + 1] = geo.mercator.lat2y(input[i + 1]);
            output[i + 2] = input[i + 2];
          }
        }
      } else if ('x' in input[0] && 'y' in input[0] && 'z' in input[0]) {
        /// Input is array of object
        output[i] = { x: input[i].x, y: geo.mercator.lat2y(input[i].y),
                      z: input[i].z };
      } else if ('x' in input[0] && 'y' in input[0] && 'z' in input[0]) {
        /// Input is array of object
        output[i] = { x: input[i].x, y: geo.mercator.lat2y(input[i].y)};
      }
    } else if (input instanceof geo.latlng) {
      output = {};
      output.x = input.x();
      output.y = geo.mercator.lat2y(input.y());
    } else {
      output = {};
      output.x = input.x;
      output.y = geo.mercator.lat2y(input.y);
    }

    return output;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Transform a point or array of points in local space to
   * latitude-longitude space
   *
   * @input Input An object, array, of array of objects/array representing 2D
   * point in space. [x,y], [[x,y]], [{x:val: y:val}], {x:val, y:val}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.fromLocal = function (input) {
    var i, output;

    if (input instanceof Array && input.length > 0) {
      output = [];
      output.length = input.length;

      if (input[0] instanceof Object) {
        for (i = 0; i < input.length; i += 1) {
          output[i] = {};
          output[i].x = input[i].x;
          output[i].y = geo.mercator.y2lat(input[i].y);
        }
      } else if (input[0] instanceof Array) {
        for (i = 0; i < input.length; i += 1) {
          output[i] = input[i];
          output[i][1] = geo.mercator.y2lat(input[i][1]);
        }
      } else {
        for (i = 0; i < input.length; i += 1) {
          output[i] = input[i];
          output[i + 1] = geo.mercator.y2lat(input[i + 1]);
        }
      }
    }
    else {
      output = {};
      output.x = input.x;
      output.y = geo.mercator.y2lat(input.y);
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
  this._hasTile = function (zoom, x, y) {
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
  this._addTile = function (request, zoom, x, y) {
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
        tile = new Image();

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
    tile.src = m_baseUrl + zoom + '/' +
      (x) + '/' + (Math.pow(2, zoom) - 1 - y) + '.' + m_imageFormat;

    m_tiles[zoom][x][y] = tile;
    m_pendingNewTiles.push(tile);
    m_numberOfCachedTiles += 1;
    return tile;
  };


  ////////////////////////////////////////////////////////////////////////////
  /**
   * Clear tiles that are no longer required
   */
  ////////////////////////////////////////////////////////////////////////////
  /* jshint -W089 */
  this._removeTiles = function () {
    var i, x, y, tile, zoom, currZoom = getModifiedMapZoom(),
        lastZoom = m_lastVisibleZoom;

    if (!m_tiles) {
      return m_this;
    }

    for (zoom in m_tiles) {
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

    /// First remove the tiles if we have cached more than max cached limit
    m_pendingInactiveTiles.sort(function (a, b) {
      return a.lastused - b.lastused;
    });

    i = 0;

    /// Get rid of tiles if we have reached our threshold. However,
    /// If the tile is required for current zoom, then do nothing.
    /// Also don't delete the tile if its from the previous zoom
    while (m_numberOfCachedTiles > m_tileCacheSize &&
      i < m_pendingInactiveTiles.length) {
      tile = m_pendingInactiveTiles[i];

      if (isTileVisible(tile)) {
        i += 1;
        continue;
      }
      m_this._delete(tile.feature);
      delete m_tiles[tile.zoom][tile.index_x][tile.index_y];
      m_pendingInactiveTiles.splice(i, 1);
      m_numberOfCachedTiles -= 1;
    }

    // console.log("m_numberOfCachedTiles ", m_numberOfCachedTiles);
    // console.log("m_tileCacheSize ", m_tileCacheSize);

    for (i = 0; i < m_pendingInactiveTiles.length; i += 1) {
      tile = m_pendingInactiveTiles[i];
      tile.REMOVING = false;
      tile.REMOVED = false;
      if (tile.zoom !== currZoom) {
        if (tile.zoom === lastZoom) {
          tile.feature.bin(m_lastVisibleBinNumber);
        } else {
          tile.feature.bin(m_hiddenBinNumber);
        }
      } else {
        tile.lastused = new Date();
        tile.feature.bin(m_visibleBinNumber);
      }
      tile.feature._update();
    }
    m_pendingInactiveTiles = [];

    return m_this;
  };
  /* jshint +W089 */

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create / delete tiles as necessary
   */
  ////////////////////////////////////////////////////////////////////////////
  this._addTiles = function (request) {
    var feature, ren = m_this.renderer(),
        zoom = getModifiedMapZoom(),
        /// First get corner points
        /// In display coordinates the origin is on top left corner (0, 0)
        llx = 0.0, lly = m_this.height(), urx = m_this.width(), ury = 0.0,
        temp = null, tile = null, tile1x = null, tile1y = null, tile2x = null,
        tile2y = null, invJ = null, i = 0, j = 0, lastStartX, lastStartY,
        lastEndX, lastEndY, currStartX, currStartY, currEndX, currEndY,
        worldPt1 = ren.displayToWorld([llx, lly]),
        worldPt2 = ren.displayToWorld([urx, ury]);

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
      tile1y = tile2y;
      tile2y = temp;
    }

    /// Compute current tile indices
    currStartX = tile1x;
    currEndX = tile2x;
    currStartY = (Math.pow(2, zoom) - 1 - tile1y);
    currEndY = (Math.pow(2, zoom) - 1 - tile2y);
    if (currEndY < currStartY) {
      temp = currStartY;
      currStartY = currEndY;
      currEndY = temp;
    }

    /// Compute last tile indices
    lastStartX = geo.mercator.long2tilex(worldPt1[0],
                   m_lastVisibleZoom);
    lastStartY = geo.mercator.lat2tiley(worldPt1[1],
                   m_lastVisibleZoom);
    lastEndX = geo.mercator.long2tilex(worldPt2[0],
                   m_lastVisibleZoom);
    lastEndY = geo.mercator.lat2tiley(worldPt2[1],
                   m_lastVisibleZoom);
    lastStartY = Math.pow(2, m_lastVisibleZoom) - 1 - lastStartY;
    lastEndY   = Math.pow(2, m_lastVisibleZoom) - 1 - lastEndY;
    if (lastEndY < lastStartY) {
      temp = lastStartY;
      lastStartY = lastEndY;
      lastEndY = temp;
    }

    m_visibleTilesRange = {};
    m_visibleTilesRange[zoom] = { startX: currStartX, endX: currEndX,
                                  startY: currStartY, endY: currEndY };

    m_visibleTilesRange[m_lastVisibleZoom] =
                                { startX: lastStartX, endX: lastEndX,
                                  startY: lastStartY, endY: lastEndY };
    m_pendingNewTilesStat[m_updateTimerId] = { total:
      ((tile2x - tile1x + 1) * (tile1y - tile2y + 1)), count: 0 };

    for (i = tile1x; i <= tile2x; i += 1) {
      for (j = tile2y; j <= tile1y; j += 1) {
        invJ = (Math.pow(2, zoom) - 1 - j);
        if  (!m_this._hasTile(zoom, i, invJ)) {
          tile = m_this._addTile(request, zoom, i, invJ);
        } else {
          tile = m_tiles[zoom][i][invJ];
          tile.feature.bin(m_visibleBinNumber);
          if (tile.LOADED && m_updateTimerId in m_pendingNewTilesStat) {
            m_pendingNewTilesStat[m_updateTimerId].count += 1;
          }
          tile.lastused = new Date();
          tile.feature._update();
        }
        tile.updateTimerId = m_updateTimerId;
      }
    }

    // define a function here to set tile properties after it is loaded
    function tileOnLoad(tile) {
      return function () {
        tile.LOADING = false;
        tile.LOADED = true;
        if ((tile.REMOVING || tile.REMOVED) &&
          tile.feature &&
          tile.zoom !== getModifiedMapZoom()) {
          tile.feature.bin(m_hiddenBinNumber);
          tile.REMOVING = false;
          tile.REMOVED = true;
        } else {
          tile.REMOVED = false;
          tile.lastused = new Date();
          tile.feature.bin(m_visibleBinNumber);
        }
        tile.feature._update();

        if (tile.updateTimerId === m_updateTimerId &&
            m_updateTimerId in m_pendingNewTilesStat) {
          m_pendingNewTilesStat[m_updateTimerId].count += 1;
          if (m_pendingNewTilesStat[m_updateTimerId].count >=
              m_pendingNewTilesStat[m_updateTimerId].total) {
            drawTiles();
          }
        } else {
          tile.REMOVED = true;
          tile.feature.bin(m_hiddenBinNumber);
        }
      };
    }

    /// And now finally add them
    for (i = 0; i < m_pendingNewTiles.length; i += 1) {
      tile = m_pendingNewTiles[i];
      feature = m_this.createFeature('plane', {drawOnAsyncResourceLoad: false,
                    onload: tileOnLoad(tile)})
                  .origin([tile.llx, tile.lly])
                  .upperLeft([tile.llx, tile.ury])
                  .lowerRight([tile.urx, tile.lly])
                  .gcs('"EPSG:3857"')
                  .style('image', tile);
      tile.feature = feature;
      tile.feature._update();
    }
    m_pendingNewTiles = [];

    if (m_updateTimerId in m_pendingNewTilesStat &&
        m_pendingNewTilesStat[m_updateTimerId].count >=
        m_pendingNewTilesStat[m_updateTimerId].total) {
      drawTiles();
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update OSM tiles as needed
   */
  ////////////////////////////////////////////////////////////////////////////
  function updateOSMTiles(request) {
    if (request === undefined) {
      request = {};
    }

    var zoom = getModifiedMapZoom();

    if (!m_lastVisibleZoom) {
      m_lastVisibleZoom = zoom;
    }

    /// Add tiles that are currently visible
    m_this._addTiles(request);

    /// Update the zoom
    if (m_lastVisibleZoom !== zoom) {
      m_lastVisibleZoom = zoom;
    }

    m_this.updateTime().modified();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create / delete tiles as necessary
   */
  ////////////////////////////////////////////////////////////////////////////
  this._updateTiles = function (request) {
    if (m_updateTimerId !== null) {
      clearTimeout(m_updateTimerId);
      if (m_updateTimerId in m_pendingNewTilesStat) {
        delete m_pendingNewTilesStat[m_updateTimerId]
      }
      m_updateTimerId = setTimeout(function () {
        updateOSMTiles(request);
      }, 30);
    } else {
      m_updateTimerId = setTimeout(function () {
        updateOSMTiles(request);
      }, 0);
    }
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   *
   * Do not call parent _init method as its already been executed
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function () {
    s_init.call(m_this);
    this.gcs('EPSG:3857');
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update layer
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function (request) {
    /// Update tiles (create new / delete old etc...)
    m_this._updateTiles(request);

    /// Now call base class update
    s_update.call(m_this, request);
  };

  return this;
};

inherit(geo.osmLayer, geo.featureLayer);

geo.registerLayer('osm', geo.osmLayer);
