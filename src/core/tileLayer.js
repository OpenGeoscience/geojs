(function () {
  'use strict';

  /**
   * Standard modulo operator where the outputa is in [0, b) for all inputs.
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
   * to the current zoom level and changes when the zoom level crosses an
   * integer threshold.
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

    var lastZoom = null, lastX = null, lastY = null, unit;

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

    unit = this.map().unitsPerPixel(this._options.maxLevel);

    // initialize to/FromLocal transform matrices
    this._toLocalMatrix = geo.camera.affine(
      {},
      {x: 1 / unit, y: -1 / unit}
    );
    this._toLocalTransform = geo.camera.css(this._toLocalMatrix);
    this._fromLocalMatrix = geo.camera.affine(
      {},
      {x: unit, y: -unit}
    );
    this._fromLocalTransform = geo.camera.css(this._fromLocalMatrix);

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
     * Returns the current origin tile and offset at the given zoom level.
     * This is intended to be cached in the future to optimize coordinate
     * transformations.
     * @protected
     * @param {number} level The target zoom level
     * @returns {object} {index: {x, y}, offset: {x, y}}
     */
    this._origin = function (level) {
      var origin = this.toLevel(this.toLocal(this.map().origin()), level),
          o = this._options,
          index, offset;

      // get the tile index
      index = {
        x: Math.floor(origin.x / o.tileWidth),
        y: Math.floor(origin.y / o.tileHeight)
      };

      // get the offset inside the tile (in pixels)
      // This computation should contain the only numerically unstable
      // subtraction in this class.  All other methods will assume
      // coordinates are given relative to the map origin.
      offset = {
        x: origin.x - o.tileWidth * index.x,
        y: origin.y - o.tileHeight * index.y
      };
      return {index: index, offset: offset};
    };

    /**
     * Returns a tile's bounds in layer coordinates.
     * @param {geo.tile} tile
     * @param {number} zoom
     * @returns {object} bounds
     */
    this._tileBounds = function (tile) {
      var origin = this._origin(tile.index.level);
      return tile.bounds(origin.index, origin.offset);
    };

    /**
     * Returns the tile indices at the given point.
     * @param {Object} point The coordinates in pixels relative to the map origin.
     * @param {Number} point.x
     * @param {Number} point.y
     * @param {Number} level The target zoom level
     * @returns {Object} The tile indices
     */
    this.tileAtPoint = function (point, level) {
      var o = this._origin(level);
      var map = this.map();
      point = this.displayToLevel(map.gcsToDisplay(point), level);
      var to = this._options.tileOffset(level);
      if (to) {
        point.x += to.x;
        point.y += to.y;
      }
      var tile = {
        x: Math.floor(
          o.index.x + (o.offset.x + point.x) / this._options.tileWidth
        ),
        y: Math.floor(
          o.index.y + (o.offset.y + point.y) / this._options.tileHeight
        )
      };
      return tile;
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
     * @param {number} level The zoom level
     * @param {object} bounds The map bounds in world coordinates
     */
    this._getTileRange = function (level, bounds) {
      return {
        start: this.tileAtPoint({
          x: bounds.left,
          y: bounds.bottom
        }, level),
        end: this.tileAtPoint({
          x: bounds.right,
          y: bounds.top
        }, level)
      };
    };

    /**
     * Returns a list of tiles necessary to fill the screen at the given
     * zoom level, center point, and viewport size.  The list is optionally
     * ordered by loading priority (center tiles first).
     *
     * @protected
     * @param {number} level The zoom level
     * @param {object} bounds The map bounds
     * @param {boolean} sorted Return a sorted list
     * @returns {geo.tile[]} An array of tile objects
     */
    this._getTiles = function (level, bounds, sorted) {
      var i, j, tiles = [], index, nTilesLevel,
          start, end, indexRange, source, center;

      // get the tile range to fetch
      indexRange = this._getTileRange(level, bounds);
      start = indexRange.start;
      end = indexRange.end;
      /*
      console.log(
        JSON.stringify({
          bounds: this._getViewBounds(),
          passedBounds: bounds,
          level: level,
          range: indexRange,
          origin: this.map().origin(),
          center: this.map().center()
        })
      );
      */

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
        center = {
          x: (start.x + end.x) / 2,
          y: (start.y + end.y) / 2
        };
        tiles.sort(this._loadMetric(center));
      }
      return tiles;
    };

    /**
     * Prefetches tiles up to a given zoom level around a given bounding box.
     *
     * @param {number} level The zoom level
     * @param {object} bounds The map bounds
     * @returns {$.Deferred} resolves when all of the tiles are fetched
     */
    this.prefetch = function (level, bounds) {
      var tiles;
      tiles = [this._getTiles(level, bounds, true)];
      return $.when.apply($,
        tiles.map(function (tile) {
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
     * Convert a coordinate from pixel coordinates at the given zoom
     * level to world coordinates.
     * @param {Object} coord
     * @param {Number} coord.x The offset in pixels (level 0) from the left edge
     * @param {Number} coord.y The offset in pixels (level 0) from the bottom edge
     * @param {Number} level   The zoom level of the source coordinates
     */
    this.fromLevel = function (coord, level) {
      var s = Math.pow(2, -level);
      return {
        x: coord.x * s,
        y: coord.y * s
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
      var s = Math.pow(2, level);
      return {
        x: coord.x * s,
        y: coord.y * s
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
     * Get a sublayer container.  When requested, this method will create the sublayer
     * if it doesn't already exist.
     * @param {number} level The sublayer level
     * @param {boolean} create Whether to create the sublayer when missing
     * @return {DOM} A DOM element
     */
    this._subLayer = function (level, create) {
      var node;

      level = level.toFixed();
      node = this.canvas().find('[data-tile-sublayer=' + level + ']');

      if (!node.get(0) && create) {
        node = $(
          '<div class="geo-tile-sublayer" data-tile-sublayer="' + level + '"/>'
        ).appendTo(this.canvas());
        node.css({
          width: '100%',
          height: '100%',
          /*
          'transform-origin': '0% 0%',
          'transform': 'scale(' + Math.pow(2, this._options.maxLevel - level) + ')'
          */
        });
      }
      return node;
    };

    /**
     * Reorder and update scales for all sublayers.  This should be called
     * whenever the target zoom level for the map changes.  i.e. when map
     * transitions between integral zoom level (2.9 -> 3.1).
     * @param {number} zoom The target zoom level
     */
    this._updateSubLayers = function (zoom) {
      /*
      var slayers = $('.geo-tile-sublayer'), size = this.map().size();
      zoom = this._options.tileRounding(zoom);

      slayers.each(function (i, layer) {
        var level;
        layer = $(layer);
        level = parseInt(layer.data('tile-sublayer'));
        layer.css(
          'transform',
          'scale(' + Math.pow(2, level) + ') '
          );
      });
      */
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
      var div = this._subLayer(tile.index.level, true),
          bounds = this._tileBounds(tile);

      // append the image element
      div.append(tile.image);

      // apply a transform to place the image correctly
      tile.image.style.position = 'absolute';
      tile.image.style.left = bounds.left + 'px';
      tile.image.style.top = bounds.bottom + 'px';

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
          mapZoom = map.zoom(),
          zoom = this._options.tileRounding(mapZoom),
          scale = Math.pow(2, mapZoom - zoom),
          size = map.size();
      var ul = this.displayToLevel({x: 0, y: 0});
      var lr = this.displayToLevel({x: size.width, y: size.height});
      return {
        level: zoom,
        scale: scale,
        left: ul.x,
        right: lr.x,
        bottom: lr.y,
        top: ul.y
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
          console.log('Purging: ' + tile.toString());
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
      var map = this.map(),
          mapZoom = map.zoom(),
          zoom = this._options.tileRounding(mapZoom),
          center = this.displayToLevel(undefined, zoom),
          bounds = map.bounds(),
          tiles, t, c = map.camera(), m;

      // Update the transform for the local layer coordinates
      this.canvas().css(
        'transform',
        'translate(-' + (map.size().width / 2) + 'px,' + (map.size().height / 2) + 'px)' +
        map.camera().css() + ' ' +
        this._fromLocalTransform +
        ' scale(' + Math.pow(2, this._options.maxLevel - zoom) + ')'
      );

      if (zoom === lastZoom &&
          center.x === lastX &&
          center.y === lastY) {
        return;
      }

      tiles = this._getTiles(
        zoom, bounds, true
      );

      if (zoom !== lastZoom) {
        // rescale active tiles so they don't jump around during zoom transitions
        this._updateSubLayers(zoom);
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
      /* this needs to take into account wrapping.  We may want to add an (n)
       * tile edge buffer so we appear more responsive - DWM:: */
      var to = this._options.tileOffset(tile.index.level);
      return tile.bottom - to.y > bounds.top ||
             tile.left - to.x   > bounds.right ||
             tile.top - to.y    < bounds.bottom ||
             tile.right - to.x  < bounds.left;
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
      /*  Get fancy later
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

    /**
     * Convert actual pixel coordinates (where (0,0) is the upper left) to
     * layer pixel coordinates (typically (0,0) is the center of the map).
     * By default, this is done at the current base zoom level.
     *
     * @param pt: the point to convert.  If undefined, user the center of the
     *            display.
     * @param zoom: if specified, the zoom level to use.
     * @returns: the point in level coordinates.
     */
    this.displayToLevel = function (pt, zoom) {
      var map = this.map(),
          mapzoom = map.zoom(),
          roundzoom = this._options.tileRounding(mapzoom),
          unit = map.unitsPerPixel(zoom === undefined ? roundzoom : zoom);
      if (pt === undefined) {
        var size = map.size();
        pt = {x: size.width / 2, y: size.height / 2};
      }
      var gcsPt = map.displayToGcs(pt);
      return {x: gcsPt.x / unit, y: gcsPt.y / unit};
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
    tileOffset: function (level) {
      void(level);
      return {x: 0, y: 0};
    },
    cacheSize: 200,
    /* if tileRounding is Math.floor, tiles will be their native size or
     * larger, if Math.ceil, they will be their native size or smaller.  A
     * custom function could be used instead. */
    tileRounding: Math.floor,
    attribution: 'No data attribution provided.'
  };

  inherit(geo.tileLayer, geo.featureLayer);
})();
