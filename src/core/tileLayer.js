(function () {
  'use strict';

  /**
   * Standard modulo operator where the output
   * is in [0, a - 1] for all inputs.
   * @private
   */
  function modulo(a, b) {
    return ((a % b) + b) % b;
  }

  //////////////////////////////////////////////////////////////////////////////
  /**
   * This method defines a tileLayer, which is an abstract class defining a
   * layer divided into tiles of arbitrary data.  Notably, this class provides
   * the core functionality of the osmLayer, but hooks exist to render tiles
   * dynamically from vector data, or to display arbitrary grids of images
   * in a custom coordinate system.  When multiple zoom levels are present
   * in a given dataset, this class assumes that the space occupied by
   * tile (i, j) at level z is covered by a 2x2 grid of tiles at zoom
   * level z + 1:
   *
   *   (2i, 2j),     (2i, 2j + 1)
   *   (2i + 1, 2j), (2i + 1, 2j + 1)
   *
   * The higher level tile set should represent a 2x increase in resolution.
   *
   * Although not currently supported, this class is intended to extend to
   * 3D grids of tiles as well where 1 tile is covered by a 2x2x2 grid of
   * tiles at the next level.  The tiles are assumed to be rectangular,
   * identically sized, and aligned with x/y axis of the underlying
   * coordinate system.  The local coordinate system is in pixels relative
   * to zoom level 0.
   *
   * @class
   * @extends geo.featureLayer
   * @param {Object?} options
   * @param {Number} [options.minLevel=0]    The minimum zoom level available
   * @param {Number} [options.maxLevel=18]   The maximum zoom level available
   * @param {Number} [options.tileOverlap=0] Number of pixels of overlap between tiles
   * @param {Number} [options.tileWidth=256] The tile width as displayed without overlap
   * @param {Number} [options.tileHeigh=256] The tile height as displayed without overlap
   * @param {Number} [options.cacheSize=200] The maximum number of tiles to cache
   * @param {Bool}   [options.wrapX=true]    Wrap in the x-direction
   * @param {Bool}   [options.wrapY=false]   Wrap in the y-direction
   * @param {function} [options.url=null]
   *   A function taking the current tile indices and returning a URL or jquery
   *   ajax config to be passed to the {geo.tile} constructor.
   *   Example:
   *     (x, y, z) => "http://example.com/z/y/x.png"
   * @returns {geo.tileLayer}
   */
  //////////////////////////////////////////////////////////////////////////////
  geo.tileLayer = function (options) {
    if (!(this instanceof geo.tileLayer)) {
      return new geo.tileLayer(options);
    }
    geo.featureLayer.call(this, options);

    options = $.extend(options || {}, this.constructor.defaults);

    var lastZoom = null, lastX = null, lastY = null;

    // copy the options into a private variable
    this._options = $.extend(true, {}, options);

    // set the layer attribution text
    this.attribution(options.attribution);

    // initialize the object that keeps track of actively drawn tiles
    this._activeTiles = {};

    // initialize the object that stores active tile regions in a
    // tree-like structure providing quick queries to determine
    // if tiles are completely obscured or not.
    this._tileTree = {};

    // initialize the in memory tile cache
    this._cache = geo.tileCache({size: options.cacheSize});

    /**
     * Readonly accessor to the options object
     */
    Object.defineProperty(this, 'options', {get: function () {
      return $.extend({}, this._options);
    }});

    /**
     * Readonly accessor to the tile cache object.
     */
    Object.defineProperty(this, 'cache', {get: function () {
      return this._cache;
    }});

    /**
     * Readonly accessor to the active tile mapping.  This is an object containing
     * all currently drawn tiles (hash(tile) => tile).
     */
    Object.defineProperty(this, 'activeTiles', {get: function () {
      return $.extend({}, this._activeTiles); // copy on output
    }});

    /**
     * The number of tiles at the given zoom level
     * The default implementation just returns `Math.pow(2, z)`.
     * @param {Number} level A zoom level
     * @returns {{x: nx, y: ny}} The number of tiles in each axis
     */
    this.tilesAtZoom = function (level) {
      var s = Math.pow(2, level);
      return {x: s, y: s};
    };

    /**
     * Returns true if the given tile index is valid:
     *   * min level <= level <= max level
     *   * 0 <= x <= 2^level - 1
     *   * 0 <= y <= 2^level - 1
     * @param {Object} index The tile index
     * @param {Number} index.x
     * @param {Number} index.y
     * @param {Number} index.level
     * @returns {geo.tile}
     */
    this.isValid = function (index) {
      if (!(this._options.minLevel <= index.level &&
           index.level <= this._options.maxLevel)) {
        return false;
      }
      if (!(this._options.wrapX ||
            0 <= index.x &&
            index.x <= this.tilesAtZoom(index.level).x - 1)) {
        return false;
      }
      if (!(this._options.wrapY ||
            0 <= index.y &&
            index.y <= this.tilesAtZoom(index.level).y - 1)) {
        return false;
      }
      return true;
    };

    /**
     * Returns the tile indices at the given point.
     * @param {Object} point The coordinates in pixels
     * @param {Number} point.x
     * @param {Number} point.y
     * @returns {Object} The tile indices
     */
    this.tileAtPoint = function (point) {
      return {
        x: Math.floor(point.x / this._options.tileWidth),
        y: Math.floor(point.y / this._options.tileHeight)
      };
    };

    /**
     * Returns an instantiated tile object with the given indices.  This
     * method always returns a new tile object.  Use `_getTileCached`
     * to use the caching layer.
     * @param {Object} index The tile index
     * @param {Number} index.x
     * @param {Number} index.y
     * @param {Number} index.level
     * @param {Object} source The tile index used for constructing the url
     * @param {Number} source.x
     * @param {Number} source.y
     * @param {Number} source.level
     * @returns {geo.tile}
     */
    this._getTile = function (index, source) {
      return geo.tile({
        index: index,
        size: {x: this._options.tileWidth, y: this._options.tileHeight},
        url: this._options.url(source || index)
      });
    };

    /**
     * Returns an instantiated tile object with the given indices.  This
     * method is similar to `_getTile`, but checks the cache before
     * generating a new tile.
     * @param {Object} index The tile index
     * @param {Number} index.x
     * @param {Number} index.y
     * @param {Number} index.level
     * @param {Object} source The tile index used for constructing the url
     * @param {Number} source.x
     * @param {Number} source.y
     * @param {Number} source.level
     * @returns {geo.tile}
     */
    this._getTileCached = function (index, source) {
      var tile = this.cache.get(this._tileHash(index));
      if (tile === null) {
        tile = this._getTile(index, source);
        this.cache.add(tile);
      }
      return tile;
    };

    /**
     * Returns a string representation of the tile at the given index.
     * This method is used as a hashing function for the caching layer.
     *
     * Note: This method _must_ return the same string as:
     *
     *   tile({index: index}).toString();
     *
     * @param {Object} index The tile index
     * @param {Number} index.x
     * @param {Number} index.y
     * @param {Number} index.level
     * @returns {string}
     */
    this._tileHash = function (index) {
      return [index.level || 0, index.y, index.x].join('_');
    };

    /**
     * Returns the optimal starting and ending tile indices
     * (inclusive) necessary to fill the given viewport.
     * @param {Number} level The zoom level
     * @param {Object} center The coordinates of the center (pixels)
     * @param {Object} size The size of the viewport in pixels
     */
    this._getTileRange = function (level, center, size) {
      return {
        start: this.tileAtPoint({
          x: center.x - size.width / 2,
          y: center.y - size.height / 2
        }, level),
        end: this.tileAtPoint({
          x: center.x + size.width / 2,
          y: center.y + size.height / 2
        }, level)
      };
    };

    /**
     * Returns a list of tiles necessary to fill the screen at the given
     * zoom level, center point, and viewport size.  The list is optionally
     * ordered by loading priority (center tiles first).
     *
     * @protected
     * @param {Number} level The zoom level
     * @param {Object} center The center point in pixels
     * @param {Number} center.x
     * @param {Number} center.y
     * @param {Object} size The viewport size in pixels
     * @param {Number} size.width
     * @param {Number} size.height
     * @param {Boolean} sorted Return a sorted list
     * @returns {geo.tile[]} An array of tile objects
     */
    this._getTiles = function (level, center, size, sorted) {
      var iCenter, i, j, tiles = [], index, nTilesLevel,
          start, end, indexRange, source;

      // indices of the center tile
      iCenter = this.tileAtPoint(center, level);

      // get the tile range to fetch
      indexRange = this._getTileRange(level, center, size);
      start = indexRange.start;
      end = indexRange.end;

      // total number of tiles existing at this level
      nTilesLevel = this.tilesAtZoom(level);

      // loop over the tile range
      index = {level: level};
      index.nx = nTilesLevel.x;
      index.ny = nTilesLevel.y;

      for (i = start.x; i <= end.x; i += 1) {
        index.x = i;
        for (j = start.y; j <= end.y; j += 1) {
          index.y = j;


          source = $.extend({}, index);
          if (this._options.wrapX) {
            source.x = modulo(index.x, index.nx);
          }
          if (this._options.wrapY) {
            source.y = modulo(index.y, index.ny);
          }

          if (this.isValid(source)) {
            tiles.push(this._getTileCached($.extend({}, index), source));
          }
        }
      }

      if (sorted) {
        tiles.sort(this._loadMetric(iCenter));
      }
      return tiles;
    };

    /**
     * Prefetches tiles up to a given zoom level around a given bounding box.
     *
     * @param {Number} level The zoom level
     * @param {Object} center The center point in GCS coordinates
     * @param {Number} center.x
     * @param {Number} center.y
     * @param {Object} size The viewport size in pixels
     * @param {Number} size.width
     * @param {Number} size.height
     * @returns {$.Deferred} resolves when all of the tiles are fetched
     */
    this.prefetch = function (level, center, size) {
      var tiles;
      center = this.toLevel(this.toLocal(center), level);
      tiles = [this._getTiles(level, center, size, false)];
      return $.when.apply($,
        tiles.sort(this._loadMetric(center))
          .map(function (tile) {
            return tile.fetch();
          })
      );
    };

    /**
     * This method returns a metric that determines tile loading order.  The
     * default implementation prioritizes tiles that are closer to the center,
     * or at a lower zoom level.
     * @protected
     * @param {index1} center   The center tile
     * @param {Number} center.x
     * @param {Number} center.y
     * @returns {function} A function accepted by Array.prototype.sort
     */
    this._loadMetric = function (center) {
      return function (a, b) {
        var a0, b0, dx, dy, cx, cy, scale;

        // shortcut if zoom level differs
        if (a.level !== b.level) {
          return b.level - a.level;
        }

        // compute the center coordinates relative to a.level
        scale = Math.pow(2, a.level - center.level);
        cx = center.x * scale;
        cy = center.y * scale;

        // calculate distances to the center squared
        dx = a.x - cx;
        dy = a.y - cy;
        a0 = dx * dx + dy * dy;

        dx = b.x - cx;
        dy = b.y - cy;
        b0 = dx * dx + dy * dy;

        // return negative if a < b, or positive if a > b
        return a - b;
      };
    };

    /**
     * Convert a coordinate from layer to map coordinate systems.
     * @param {Object} coord
     * @param {Number} coord.x The offset in pixels (level 0) from the left edge
     * @param {Number} coord.y The offset in pixels (level 0) from the bottom edge
     */
    this.fromLocal = function (coord) {
      var o = this._options;
      return {
        x: (o.maxX - o.minX) * coord.x + o.minX,
        y: (o.maxY - o.minY) * coord.y + o.minY
      };
    };

    /**
     * Convert a coordinate from map to layer coordinate systems.
     * @param {Object} coord
     * @param {Number} coord.x The offset in map units from the left edge
     * @param {Number} coord.y The offset in map units from the bottom edge
     */
    this.toLocal = function (coord) {
      var o = this._options;
      return {
        x: (coord.x - o.minX) / (o.maxX - o.minX),
        y: (coord.y - o.minY) / (o.maxY - o.minY)
      };
    };

    /**
     * Convert a coordinate from pixel coordinates at the given zoom
     * level to layer coordinates.
     * @param {Object} coord
     * @param {Number} coord.x The offset in pixels (level 0) from the left edge
     * @param {Number} coord.y The offset in pixels (level 0) from the bottom edge
     * @param {Number} level   The zoom level of the source coordinates
     */
    this.fromLevel = function (coord, level) {
      var scl = this.tilesAtZoom(level),
          o = this._options;
      return {
        x: coord.x / (scl.x * o.tileWidth),
        y: coord.y / (scl.y * o.tileHeight)
      };
    };

    /**
     * Convert a coordinate from layer coordinates to pixel coordinates at the
     * given zoom level.
     * @param {Object} coord
     * @param {Number} coord.x The offset in pixels (level 0) from the left edge
     * @param {Number} coord.y The offset in pixels (level 0) from the bottom edge
     * @param {Number} level   The zoom level of the new coordinates
     */
    this.toLevel = function (coord, level) {
      var scl = this.tilesAtZoom(level),
          o = this._options;
      return {
        x: coord.x * scl.x * o.tileWidth,
        y: coord.y * scl.y * o.tileHeight
      };
    };
    /**
     * Draw the given tile on the active canvas.
     * @param {geo.tile} tile The tile to draw
     */
    this.drawTile = function (tile) {
      var hash = tile.toString();

      if (this._activeTiles.hasOwnProperty(hash)) {
        // the tile is already drawn, move it to the top
        this._moveToTop(tile);
      } else {
        // pass to the rendering implementation
        this._drawTile(tile);
      }

      // add the tile to the active cache
      this._activeTiles[tile.toString()] = tile;
    };

    /**
     * Render the tile on the canvas.  This implementation draws the tiles directly
     * on the DOM using <img> tags.  Derived classes should override this method
     * to draw the tile on a renderer specific context.
     * @protected
     * @param {geo.tile} tile The tile to draw
     */
    this._drawTile = function (tile) {
      // Make sure this method is not called when there is
      // a renderer attached.
      //
      if (this.renderer() !== null) {
        throw new Error('This draw method is not valid on renderer managed layers.');
      }

      // get the layer node
      var div = this.canvas();

      // append the image element
      div.append(tile.image);

      // apply a transform to place the image correctly
      tile.image.style.position = 'absolute';
      tile.image.style.left = tile.left() + 'px';
      tile.image.style.top = tile.bottom() + 'px';

      // add an error handler
      tile.catch(function () {
        // May want to do something special here later
        console.warn('Could not load tile at ' + tile.index);
        tile.image.remove();
      });
    };

    /**
     * Remove the given tile from the canvas and the active cache.
     * @param {geo.tile|string} tile The tile (or hash) to remove
     * @returns {geo.tile} the tile removed from the active layer
     */
    this.remove = function (tile) {
      tile = tile.toString();
      var value = this._activeTiles[tile];

      if (value instanceof geo.tile) {
        this._remove(value);
      }

      delete this._activeTiles[tile];
      return value;
    };

    /**
     * Remove the given tile from the canvas.  This implementation just
     * finds and removes the <img> element created for the tile.
     * @param {geo.tile|string} tile The tile object to remove
     */
    this._remove = function (tile) {
      tile.image.remove();
    };

    /**
     * Move the given tile to the top on the canvas.  The default
     * implementation deletes the tile and re-adds it.  This is
     * exposed to make it possible to optimize drawing when possible.
     * @param {geo.tile} tile The tile object to move
     */
    this._moveToTop = function (tile) {
      this._remove(tile);
      this._drawTile(tile);
    };

    /**
     * Query the attached map for the current bounds and return them
     * as pixels at the current zoom level.
     * @returns {Object}
     *  Bounds object with left, right, top, bottom keys
     * @protected
     */
    this._getViewBounds = function () {
      var map = this.map(),
          zoom = Math.floor(map.zoom()),
          center = this.toLevel(this.toLocal(map.center()), zoom),
          size = map.size();
      return {
        level: zoom,
        left: center.x - size.width / 2,
        right: center.x + size.width / 2,
        bottom: center.y - size.height / 2,
        top: center.y + size.height / 2
      };
    };

    /**
     * Remove all inactive tiles from the display.  An inactive tile
     * is one that is no longer visible either because it was panned
     * out of the active view or the zoom has changed.
     * @protected
     */
    this._purge = function () {
      var tile, hash, bounds = {};

      // get the view bounds
      bounds = this._getViewBounds();

      for (hash in this._activeTiles) {// jshint ignore: line

        tile = this._activeTiles[hash];
        if (this._canPurge(tile, bounds)) {
          this.remove(tile);
        }
      }
      return this;
    };

    /**
     * Remove all active tiles from the canvas.
     * @returns {geo.tile[]} The array of tiles removed
     */
    this.clear = function () {
      var tiles = [], tile;

      // ignoring the warning here because this is a privately
      // controlled object with simple keys
      for (tile in this._activeTiles) {  // jshint ignore: line
        tiles.push(this.remove(tile));
      }

      // clear out the tile coverage tree
      this._tileTree = {};

      return tiles;
    };

    /**
     * Reset the layer to the initial state, clearing the canvas
     * and resetting the tile cache.
     * @returns {this} Chainable
     */
    this.reset = function () {
      this.clear();
      this._cache.clear();
    };

    /**
     * Update the view according to the map/camera.
     * @returns {this} Chainable
     */
    this._update = function () {
      var zoom = Math.floor(this.map().zoom()),
          center = this.toLevel(this.toLocal(this.map().center()), zoom),
          size = this.map().size(),
          tiles;

      tiles = this._getTiles(zoom, center, size, true);

      // Update the transform for the local layer coordinates
      this.canvas().css(
        'transform',
        'translate(' +
          (size.width / 2 - center.x) + 'px,' +
          (size.height / 2 - center.y) + 'px' +
        ')'
      );


      if (zoom === lastZoom &&
          center.x === lastX &&
          center.y === lastY) {
        return;
      }
      lastZoom = zoom;
      lastX = center.x;
      lastY = center.y;

      // reset the tile coverage tree
      this._tileTree = {};

      tiles.forEach(function (tile) {
        tile.then(function () {
          this.drawTile(tile);

          // mark the tile as covered
          this._setTileTree(tile);
        }.bind(this));
      }.bind(this));

      // purge all old tiles when the new tiles are loaded (successfully or not)
      $.when.apply($, tiles)
        .done(// called on success and failure
          function () {
            this._purge();
          }.bind(this)
        );
    };

    /**
     * Set a value in the tile tree object indicating that the given area of
     * the canvas is covered by the tile.
     * @protected
     * @param {geo.tile} tile
     */
    this._setTileTree = function (tile) {
      var index = tile.index;
      this._tileTree[index.level] = this._tileTree[index.level] || {};
      this._tileTree[index.level][index.x] = this._tileTree[index.level][index.x] || {};
      this._tileTree[index.level][index.x][index.y] = tile;
    };

    /**
     * Get a value in the tile tree object if it exists or return null.
     * @protected
     * @param {object} index A tile index object
     * @param {object} index.level
     * @param {object} index.x
     * @param {object} index.y
     * @returns {geo.tile|null}
     */
    this._getTileTree = function (index) {
      return (
          (
            this._tileTree[index.level] || {}
          )[index.x] || {}
        )[index.y] || null;
    };

    /**
     * Returns true if the tile is completely covered by other tiles on the canvas.
     * Currently this method only checks layers +/- 1 away from `tile`.  If the
     * zoom level is allowed to change by 2 or more in a single update step, this
     * method will need to be refactored to make a more robust check.  Returns
     * an array of tiles covering it or null if any part of the tile is exposed.
     * @protected
     * @param {geo.tile} tile
     * @returns {geo.tile[]|null}
     */
    this._isCovered = function (tile) {
      var level = tile.index.level,
          x = tile.index.x,
          y = tile.index.y,
          tiles = [];


      // Short cut to null if the tile was directly added
      // at the previous update step.  In this case, the
      // tile is on top by definition.
      if (this._getTileTree(tile.index)) {
        return null;
      }

      // Check one level up
      tiles = this._getTileTree({
        level: level - 1,
        x: Math.floor(x / 2),
        y: Math.floor(y / 2)
      });
      if (tiles) {
        return [tiles];
      }

      // Check one level down
      tiles = [
        this._getTileTree({
          level: level + 1,
          x: 2 * x,
          y: 2 * y
        }),
        this._getTileTree({
          level: level + 1,
          x: 2 * x + 1,
          y: 2 * y
        }),
        this._getTileTree({
          level: level + 1,
          x: 2 * x,
          y: 2 * y + 1
        }),
        this._getTileTree({
          level: level + 1,
          x: 2 * x + 1,
          y: 2 * y + 1
        })
      ];
      if (tiles.every(function (t) { return t !== null; })) {
        return tiles;
      }

      return null;
    };

    /**
     * Returns true if the provided tile is outside of the current view bounds
     * and can be removed from the canvas.
     * @protected
     * @param {geo.tile} tile
     * @param {Object?} bounds The view bounds
     * @param {Object?} bounds.left
     * @param {Object?} bounds.right
     * @param {Object?} bounds.top
     * @param {Object?} bounds.bottom
     * @returns {boolean}
     */
    this._outOfBounds = function (tile, bounds) {
      return tile.bottom() > bounds.top ||
             tile.left()   > bounds.right ||
             tile.top()    < bounds.bottom ||
             tile.right()  < bounds.left;
    };

    /**
     * Returns true if the provided tile can be purged from the canvas.  This method
     * will return `true` if the tile is completely covered by one or more other tiles
     * or it is outside of the active view bounds.  This method returns the logical and
     * of `_isCovered` and `_outOfBounds`.
     * @protected
     * @param {geo.tile} tile
     * @param {Object?} bounds The view bounds (if empty, assume global bounds)
     * @param {Number} bounds.left
     * @param {Number} bounds.right
     * @param {Number} bounds.top
     * @param {Number} bounds.bottom
     * @param {Number} bounds.level The zoom level the bounds are given as
     * @returns {boolean}
     */
    this._canPurge = function (tile, bounds) {
      /*  Get fancy laterj
      if (this._isCovered(tile)) {
        return true;
      }
      */
      // for now purge all tiles at different zoom levels
      if (tile.index.level !== bounds.level) {
        return true;
      }
      if (bounds) {
        return this._outOfBounds(tile, bounds);
      }
      return false;
    };

    return this;
  };

  /**
   * This object contains the default options used to initialize the tileLayer.
   */
  geo.tileLayer.defaults = {
    minLevel: 0,
    maxLevel: 18,
    tileOverlap: 0,
    tileWidth: 256,
    tileHeight: 256,
    wrapX: true,
    wrapY: false,
    url: null,
    minX: 0,
    maxX: 255,
    minY: 0,
    maxY: 255,
    cacheSize: 200,
    attribution: 'No data attribution provided.'
  };

  inherit(geo.tileLayer, geo.featureLayer);
})();
