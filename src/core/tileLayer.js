(function () {
  'use strict';

  /**
   * Standard modulo operator where the output is in [0, b) for all inputs.
   * @private
   */
  function modulo(a, b) {
    return ((a % b) + b) % b;
  }

  /**
   * Pick a subdomain from a list of subdomains based on a the tile location.
   *
   * @param {number} x: the x tile coordinate.
   * @param {number} y: the y tile coordinate.
   * @param {list} subdomains: the list of known subdomains.
   */
  function m_getTileSubdomain(x, y, subdomains) {
    return subdomains[modulo(x + y, subdomains.length)];
  }

  /**
   * Returns an OSM tile server formatting function from a standard format
   * string. Replaces {s}, {z}, {x}, and {y}.
   *
   * @param {string} base The tile format string
   * @returns: a conversion function.
   * @private.
   */
  function m_tileUrlFromTemplate(base) {
    return function (x, y, z, subdomains) {
      return base.replace('{s}', m_getTileSubdomain(x, y, subdomains))
        .replace('{z}', z)
        .replace('{x}', x)
        .replace('{y}', y);
    };
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
   * The constructor takes a number of optional parameters that customize
   * the display of the tiles.  The default values of these options are
   * stored as the `defaults` attribution on the constructor.  Supporting
   * alternate tiling protocols often only requires adjusting these
   * defaults.
   *
   * @class
   * @extends geo.featureLayer
   * @param {object?} options
   * @param {number} [options.minLevel=0]    The minimum zoom level available
   * @param {number} [options.maxLevel=18]   The maximum zoom level available
   * @param {number} [options.tileOverlap=0]
   *    Number of pixels of overlap between tiles
   * @param {number} [options.tileWidth=256]
   *    The tile width as displayed without overlap
   * @param {number} [options.tileHeight=256]
   *    The tile height as displayed without overlap
   * @param {number} [options.cacheSize=400] The maximum number of tiles to
   *    cache.  The default is 200 if keepLower is false.
   * @param {bool}   [options.keepLower=true]
   *    Keep lower zoom level tiles when showing high zoom level tiles.  This
   *    uses more memory but results in smoother transitions.
   * @param {bool}   [options.wrapX=true]    Wrap in the x-direction
   * @param {bool}   [options.wrapY=false]   Wrap in the y-direction
   * @param {number} [options.minX=0]        The minimum world coordinate in X
   * @param {number} [options.maxX=255]      The maximum world coordinate in X
   * @param {number} [options.minY=0]        The minimum world coordinate in Y
   * @param {number} [options.maxY=255]      The maximum world coordinate in Y
   * @param {function|string} [options.url=null]
   *   A function taking the current tile indices and returning a URL or jquery
   *   ajax config to be passed to the {geo.tile} constructor.
   *   Example:
   *     (x, y, z, subdomains) => "http://example.com/z/y/x.png"
   *   If this is a string, a template url with {x}, {y}, {z}, and {s} as
   *   template variables.  {s} picks one of the subdomains parameter.
   * @param {string|list} [options.subdomain="abc"]  Subdomains to use in
   *   template url strings.  If a string, this is converted to a list before
   *   being passed to a url function.
   * @param {string} [options.baseUrl=null]  If defined, use the old-style base
   *   url instead of the options.url parameter.  This is functionally the same
   *   as using a url of baseUrl/{z}/{x}/{y}.(options.imageFormat || png).  If
   *   the specified string does not end in a slash, one is added.
   * @param {string} [options.imageFormat='png']
   *   This is only used if a baseUrl is specified, in which case it determines
   *   the image name extension used in the url.
   * @param {number} [options.animationDuration=0]
   *   The number of milliseconds for the tile loading animation to occur.  **This
   *   option is currently buggy because old tiles will purge before the animation
   *   is complete.**
   * @param {string} [options.attribution]
   *   An attribution to display with the layer (accepts HTML)
   * @param {function} [options.tileRounding=Math.round]
   *   This function determines which tiles will be loaded when the map is at
   *   a non-integer zoom.  For example, `Math.floor`, will use tile level 2
   *   when the map is at zoom 2.9.
   * @param {function} [options.tileOffset]
   *   This function takes a zoom level argument and returns, in units of
   *   pixels, the coordinates of the point (0, 0) at the given zoom level
   *   relative to the bottom left corner of the domain.
   * @param {bool}   [options.topDown=false]  True if the gcs is top-down,
   *   false if bottom-up (the ingcs does not matter, only the gcs coordinate
   *   system).  When false, this inverts the gcs y-coordinate when calculating
   *   local coordinates.
   * @returns {geo.tileLayer}
   */
  //////////////////////////////////////////////////////////////////////////////
  geo.tileLayer = function (options) {
    if (!(this instanceof geo.tileLayer)) {
      return new geo.tileLayer(options);
    }
    geo.featureLayer.call(this, options);

    options = $.extend(true, {}, this.constructor.defaults, options || {});
    if (!options.cacheSize) {
      // this size should be sufficient for a 4k display
      options.cacheSize = options.keepLower ? 600 : 200;
    }
    if ($.type(options.subdomains) === 'string') {
      options.subdomains = options.subdomains.split('');
    }
    /* We used to call the url option baseUrl.  If a baseUrl is specified, use
     * it instead of url, interpretting it as before. */
    if (options.baseUrl) {
      var url = options.baseUrl;
      if (url && url.charAt(url.length - 1) !== '/') {
        url += '/';
      }
      options.url = url + '{z}/{x}/{y}.' + (options.imageFormat || 'png');
    }
    /* Save the original url so that we can return it if asked */
    options.originalUrl = options.url;
    if ($.type(options.url) === 'string') {
      options.url = m_tileUrlFromTemplate(options.url);
    }

    var lastZoom = null, lastX = null, lastY = null, s_init = this._init,
        _deferredPurge = null;

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
     * @param {number} level A zoom level
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
     * @param {object} index The tile index
     * @param {number} index.x
     * @param {number} index.y
     * @param {number} index.level
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
     * Returns a tile's bounds in its level coordinates.
     * @param {geo.tile} tile
     * @returns {object} bounds
     */
    this._tileBounds = function (tile) {
      var origin = this._origin(tile.index.level);
      return tile.bounds(origin.index, origin.offset);
    };

    /**
     * Returns the tile indices at the given point.
     * @param {object} point The coordinates in pixels relative to the map origin.
     * @param {number} point.x
     * @param {number} point.y
     * @param {number} level The target zoom level
     * @returns {object} The tile indices
     */
    this.tileAtPoint = function (point, level) {
      var o = this._origin(level);
      var map = this.map();
      point = this.displayToLevel(map.gcsToDisplay(point, null), level);
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
     * Returns a tile's bounds in a gcs.
     * @param {object|tile} either a tile or an object with {x, y, level}
     *                      specifying a tile.
     * @param {string|geo.transform} [gcs] undefined to use the interface gcs,
     *    null to use the map gcs, or any other transform.
     * @returns {object} The tile bounds in the specified gcs.
     */
    this.gcsTileBounds = function (indexOrTile, gcs) {
      var tile = (indexOrTile.index ? indexOrTile : geo.tile({
            index: indexOrTile,
            size: {x: this._options.tileWidth, y: this._options.tileHeight},
            url: ''
          }));
      var to = this._options.tileOffset(tile.index.level),
          bounds = tile.bounds({x: 0, y: 0}, to),
          map = this.map(),
          unit = map.unitsPerPixel(tile.index.level);
      var coord = [{
            x: bounds.left * unit, y: this._topDown() * bounds.top * unit
          }, {
            x: bounds.right * unit, y: this._topDown() * bounds.bottom * unit
          }];
      gcs = (gcs === null ? map.gcs() : (
          gcs === undefined ? map.ingcs() : gcs));
      if (gcs !== map.gcs()) {
        coord = geo.transform.transformCoordinates(gcs, map.gcs(), coord);
      }
      return {
        left: coord[0].x,
        top: coord[0].y,
        right: coord[1].x,
        bottom: coord[1].y
      };
    };

    /**
     * Returns an instantiated tile object with the given indices.  This
     * method always returns a new tile object.  Use `_getTileCached`
     * to use the caching layer.
     * @param {object} index The tile index
     * @param {number} index.x
     * @param {number} index.y
     * @param {number} index.level
     * @param {object} source The tile index used for constructing the url
     * @param {number} source.x
     * @param {number} source.y
     * @param {number} source.level
     * @returns {geo.tile}
     */
    this._getTile = function (index, source) {
      var urlParams = source || index;
      return geo.tile({
        index: index,
        size: {x: this._options.tileWidth, y: this._options.tileHeight},
        url: this._options.url(urlParams.x, urlParams.y, urlParams.level || 0,
                               this._options.subdomains)
      });
    };

    /**
     * Returns an instantiated tile object with the given indices.  This
     * method is similar to `_getTile`, but checks the cache before
     * generating a new tile.
     * @param {object} index The tile index
     * @param {number} index.x
     * @param {number} index.y
     * @param {number} index.level
     * @param {object} source The tile index used for constructing the url
     * @param {number} source.x
     * @param {number} source.y
     * @param {number} source.level
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
     * @param {object} index The tile index
     * @param {number} index.x
     * @param {number} index.y
     * @param {number} index.level
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
          y: bounds.top
        }, level),
        end: this.tileAtPoint({
          x: bounds.right,
          y: bounds.bottom
        }, level)
      };
    };

    /**
     * Returns a list of tiles necessary to fill the screen at the given
     * zoom level, center point, and viewport size.  The list is optionally
     * ordered by loading priority (center tiles first).
     *
     * @protected
     * @param {number} maxLevel The zoom level
     * @param {object} bounds The map bounds
     * @param {boolean} sorted Return a sorted list
     * @returns {geo.tile[]} An array of tile objects
     */
    this._getTiles = function (maxLevel, bounds, sorted) {
      var i, j, tiles = [], index, nTilesLevel,
          start, end, indexRange, source, center,
          level, minLevel = this._options.keepLower ? 0 : maxLevel;

      for (level = minLevel; level <= maxLevel; level += 1) {
        // get the tile range to fetch
        indexRange = this._getTileRange(level, bounds);
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
      tiles = this._getTiles(level, bounds, true);
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
     * @param {number} center.x
     * @param {number} center.y
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
        return a0 - b0;
      };
    };

    /**
     * Convert a coordinate from pixel coordinates at the given zoom
     * level to world coordinates.
     * @param {object} coord
     * @param {number} coord.x The offset in pixels (level 0) from the left edge
     * @param {number} coord.y The offset in pixels (level 0) from the bottom edge
     * @param {number} level   The zoom level of the source coordinates
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
     * @param {object} coord
     * @param {number} coord.x The offset in pixels (level 0) from the left edge
     * @param {number} coord.y The offset in pixels (level 0) from the bottom edge
     * @param {number} level   The zoom level of the new coordinates
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
      this._activeTiles[hash] = tile;
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
      var div = $(this._getSubLayer(tile.index.level)),
          bounds = this._tileBounds(tile),
          duration = this._options.animationDuration,
          container = $('<div class="geo-tile-container"/>').attr(
            'tile-reference', tile.toString());

      // apply a transform to place the image correctly
      container.append(tile.image);
      container.css({
        position: 'absolute',
        left: (bounds.left - parseInt(div.attr('offsetx') || 0)) + 'px',
        top: (bounds.top - parseInt(div.attr('offsety') || 0)) + 'px'
      });

      // apply fade in animation
      if (duration > 0) {
        tile.fadeIn(duration);
      }

      // append the image element
      div.append(container);

      // add an error handler
      tile.catch(function () {
        // May want to do something special here later
        console.warn('Could not load tile at ' + tile.index);
        this._remove(tile);
      }.bind(this));
    };

    /**
     * Remove the given tile from the canvas and the active cache.
     * @param {geo.tile|string} tile The tile (or hash) to remove
     * @returns {geo.tile} the tile removed from the active layer
     */
    this.remove = function (tile) {
      var hash = tile.toString();
      var value = this._activeTiles[hash];

      if (value instanceof geo.tile) {
        this._remove(value);
      }

      delete this._activeTiles[hash];
      return value;
    };

    /**
     * Remove the given tile from the canvas.  This implementation just
     * finds and removes the <img> element created for the tile.
     * @param {geo.tile|string} tile The tile object to remove
     */
    this._remove = function (tile) {
      if (tile.image) {
        if (tile.image.parentElement) {
          $(tile.image.parentElement).remove();
        } else {
          /* This shouldn't happen, but sometimes does.  Originally it happened
           * when a tile was removed from the cache before it was finished
           * being used; there is still some much rarer condition that can
           * cause it.  Log that it happened until we can figure out how to fix
           * the issue. */
          console.log('No parent element to remove ' + tile.toString(), tile);
        }
        $(tile.image).remove();
      }
    };

    /**
     * Move the given tile to the top on the canvas.
     * @param {geo.tile} tile The tile object to move
     */
    this._moveToTop = function (tile) {
      $.noop(tile);
    };

    /**
     * Query the attached map for the current bounds and return them
     * as pixels at the current zoom level.
     * @returns {object}
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
     * @param {number} zoom Tiles (in bounds) at this zoom level will be kept
     * @param {boolean} doneLoading If true, allow purging additional tiles.
     */
    this._purge = function (zoom, doneLoading) {
      var tile, hash, bounds = {};

      // Don't purge tiles in an active update
      if (this._updating) {
        return;
      }

      // get the view bounds
      bounds = this._getViewBounds();

      for (hash in this._activeTiles) {// jshint ignore: line

        tile = this._activeTiles[hash];
        if (this._canPurge(tile, bounds, zoom, doneLoading)) {
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
     * Compute local coordinates from the given world coordinates.  The
     * tile layer uses units of pixels relative to the world space
     * coordinate origin.
     * @param {object} pt A point in world space coordinates
     * @param {number|undefined} zoom If unspecified, use the map zoom.
     * @returns {object} Local coordinates
     */
    this.toLocal = function (pt, zoom) {
      var map = this.map(),
          unit = map.unitsPerPixel(zoom === undefined ? map.zoom() : zoom);
      return {
        x: pt.x / unit,
        y: this._topDown() * pt.y / unit
      };
    };

    /**
     * Compute world coordinates from the given local coordinates.  The
     * tile layer uses units of pixels relative to the world space
     * coordinate origin.
     * @param {object} pt A point in world space coordinates
     * @param {number|undefined} zoom If unspecified, use the map zoom.
     * @returns {object} Local coordinates
     */
    this.fromLocal = function (pt, zoom) {
      var map = this.map(),
          unit = map.unitsPerPixel(zoom === undefined ? map.zoom() : zoom);
      return {
        x: pt.x * unit,
        y: this._topDown() * pt.y * unit
      };
    };

    /**
     * Return a factor for invertin the y units as appropriate.
     * @return {number}
     */
    this._topDown = function () {
      return this._options.topDown ? 1 : -1;
    };

    /**
     * Return the DOM element containing a level specific layer.  This will
     * create the element if it doesn't already exist.
     * @param {number} level The zoom level of the layer to fetch
     * @return {DOM}
     */
    this._getSubLayer = function (level) {
      var node = this.canvas()
        .find('div[data-tile-layer=' + level.toFixed() + ']').get(0);
      if (!node) {
        node = $(
          '<div class=geo-tile-layer data-tile-layer="' + level.toFixed() + '"/>'
        ).css('transform-origin', '0px').get(0);
        this.canvas().append(node);
      }
      return node;
    };

    /**
     * Set sublayer transforms to align them with the given zoom level.
     * @param {number} level The target zoom level
     * @param {object} view The view bounds.  The top and left are used to
     *                      adjust the offset of tile layers.
     * @return {object} the x and y offsets for the current level.
     */
    this._updateSubLayers = function (level, view) {
      var canvas = this.canvas(),
          lastlevel = parseInt(canvas.attr('lastlevel')),
          lastx = parseInt(canvas.attr('lastoffsetx') || 0),
          lasty = parseInt(canvas.attr('lastoffsety') || 0);
      if (lastlevel === level && Math.abs(lastx - view.left) < 65536 &&
          Math.abs(lasty - view.top) < 65536) {
        return {x: lastx, y: lasty};
      }
      var x = parseInt(view.left), y = parseInt(view.top);
      canvas.find('.geo-tile-layer').each(function (idx, el) {
        var $el = $(el),
            layer = parseInt($el.data('tileLayer'));
        $el.css(
          'transform',
          'scale(' + Math.pow(2, level - layer) + ')'
        );
        var layerx = parseInt(x / Math.pow(2, level - layer)),
            layery = parseInt(y / Math.pow(2, level - layer)),
            dx = layerx - parseInt($el.attr('offsetx') || 0),
            dy = layery - parseInt($el.attr('offsety') || 0);
        $el.attr({offsetx: layerx, offsety: layery});
        $el.find('.geo-tile-container').each(function (tileidx, tileel) {
          $(tileel).css({
            left: (parseInt($(tileel).css('left')) - dx) + 'px',
            top: (parseInt($(tileel).css('top')) - dy) + 'px'
          });
        }.bind(this));
      }.bind(this));
      canvas.attr({lastoffsetx: x, lastoffsety: y, lastlevel: level});
      return {x: x, y: y};
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
          bounds = map.bounds(undefined, null),
          tiles, view = this._getViewBounds(), myPurge = {};

      _deferredPurge = myPurge;
      tiles = this._getTiles(
        zoom, bounds, true
      );

      // Update the transform for the local layer coordinates
      var offset = this._updateSubLayers(zoom, view) || {x: 0, y: 0};

      var to = this._options.tileOffset(zoom);
      if (this.renderer() === null) {
        this.canvas().css(
          'transform-origin',
          'center center'
        );
        this.canvas().css(
          'transform',
          'scale(' + (Math.pow(2, mapZoom - zoom)) + ')' +
          'translate(' +
          (-to.x + -(view.left + view.right) / 2 + map.size().width / 2 +
           offset.x) + 'px' + ',' +
          (-to.y + -(view.bottom + view.top) / 2 + map.size().height / 2 +
           offset.y) + 'px' + ')' +
          ''
        );
      }
      /* Set some attributes that can be used by non-css based viewers.  This
       * doesn't include the map center, as that may need to be handled
       * differently from the view center. */
      this.canvas().attr({
        scale: Math.pow(2, mapZoom - zoom),
        dx: -to.x + -(view.left + view.right) / 2,
        dy: -to.y + -(view.bottom + view.top) / 2,
        offsetx: offset.x,
        offsety: offset.y
      });

      lastZoom = mapZoom;
      lastX = center.x;
      lastY = center.y;

      // reset the tile coverage tree
      this._tileTree = {};

      tiles.forEach(function (tile) {
        if (tile.fetched()) {
          /* if we have already fetched the tile, don't recompute the map zoom
           *  and view bounds, as we can use what we currently have. */
          if (this._canPurge(tile, view, zoom)) {
            this.remove(tile);
            return;
          }

          this.drawTile(tile);

          // mark the tile as covered
          this._setTileTree(tile);
        } else {
          tile.then(function () {
            if (tile !== this.cache.get(tile.toString())) {
              /* If the tile has fallen out of the cache, don't draw it -- it
               * is untracked.  This may be an indication that a larger cache
               * should have been used. */
              return;
            }
            /* Check if a tile is still desired.  Don't draw it if it isn't. */
            var mapZoom = map.zoom(),
                zoom = this._options.tileRounding(mapZoom),
                view = this._getViewBounds();
            if (this._canPurge(tile, view, zoom)) {
              this.remove(tile);
              return;
            }

            this.drawTile(tile);

            // mark the tile as covered
            this._setTileTree(tile);
          }.bind(this));

          this.addPromise(tile);
        }
      }.bind(this));

      // purge all old tiles when the new tiles are loaded (successfully or not)
      $.when.apply($, tiles)
        .done(// called on success and failure
          function () {
            if (_deferredPurge === myPurge) {
              this._purge(zoom, true);
            }
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
     * @param {object?} bounds The view bounds
     * @param {object?} bounds.left
     * @param {object?} bounds.right
     * @param {object?} bounds.top
     * @param {object?} bounds.bottom
     * @returns {boolean}
     */
    this._outOfBounds = function (tile, bounds) {
      /* We may want to add an (n) tile edge buffer so we appear more
       * responsive */
      var to = this._options.tileOffset(tile.index.level);
      var scale = 1;
      if (tile.index.level !== bounds.level) {
        scale = Math.pow(2, (bounds.level || 0) - (tile.index.level || 0));
      }
      return (tile.bottom - to.y) * scale < bounds.top ||
             (tile.left - to.x) * scale   > bounds.right ||
             (tile.top - to.y) * scale    > bounds.bottom ||
             (tile.right - to.x) * scale  < bounds.left;
    };

    /**
     * Returns true if the provided tile can be purged from the canvas.  This method
     * will return `true` if the tile is completely covered by one or more other tiles
     * or it is outside of the active view bounds.  This method returns the logical and
     * of `_isCovered` and `_outOfBounds`.
     * @protected
     * @param {geo.tile} tile
     * @param {object?} bounds The view bounds (if empty, assume global bounds)
     * @param {number} bounds.left
     * @param {number} bounds.right
     * @param {number} bounds.top
     * @param {number} bounds.bottom
     * @param {number} bounds.level The zoom level the bounds are given as
     * @param {number} zoom Keep in bound tile at this zoom level
     * @param {boolean} doneLoading If true, allow purging additional tiles.
     * @returns {boolean}
     */
    this._canPurge = function (tile, bounds, zoom, doneLoading) {
      if (this._options.keepLower) {
        zoom = zoom || 0;
        if (zoom < tile.index.level) {
          return true;
        }
      } else {
        /* For tile layers that should only keep one layer, if loading is
         * finished, purge all but the current layer.  This is important for
         * semi-transparanet layers. */
        if ((doneLoading || this._isCovered(tile)) &&
            zoom !== tile.index.level) {
          return true;
        }
      }
      if (bounds) {
        return this._outOfBounds(tile, bounds);
      }
      return false;
    };

    /**
     * Convert display pixel coordinates (where (0,0) is the upper left) to
     * layer pixel coordinates (typically (0,0) is the center of the map and
     * the upper-left has the most negative values).
     * By default, this is done at the current base zoom level.
     *
     * @param pt: the point to convert.  If undefined, use the center of the
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
      /* Reverse the y coordinate, since we expect the gcs coordinate system
       * to be right-handed and the level coordinate system to be
       * left-handed. */
      var gcsPt = map.displayToGcs(pt, null),
          lvlPt = {x: gcsPt.x / unit, y: this._topDown() * gcsPt.y / unit};
      return lvlPt;
    };

    /**
     * Get or set the tile url string or function.  If changed, load the new
     * tiles.
     *
     * @param {string|function} [url] The new tile url.
     * @returns {string|function|this}
     */
    this.url = function (url) {
      if (url === undefined) {
        return this._options.originalUrl;
      }
      if (url === this._options.originalUrl) {
        return this;
      }
      this._options.originalUrl = url;
      if ($.type(url) === 'string') {
        url = m_tileUrlFromTemplate(url);
      }
      this._options.url = url;
      this.reset();
      this.map().draw();
      return this;
    };

    /**
     * Initialize after the layer is added to the map.
     */
    this._init = function () {
      var sublayer;

      // call super method
      s_init.apply(this, arguments);

      if (this.renderer() === null) {
        // Initialize sublayers in the correct order
        for (sublayer = 0; sublayer <= this._options.maxLevel; sublayer += 1) {
          this._getSubLayer(sublayer);
        }
      }
      return this;
    };

    geo.adjustLayerForRenderer('tile', this);

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
    subdomains: 'abc',
    minX: 0,
    maxX: 255,
    minY: 0,
    maxY: 255,
    tileOffset: function (level) {
      void(level);
      return {x: 0, y: 0};
    },
    topDown: false,
    keepLower: true,
    // cacheSize: 400,  // set depending on keepLower
    tileRounding: Math.round,
    attribution: '',
    animationDuration: 0
  };

  inherit(geo.tileLayer, geo.featureLayer);
})();
