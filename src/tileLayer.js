module.exports = (function () {
  'use strict';

  var inherit = require('./inherit');
  var featureLayer = require('./featureLayer');

  /**
   * Standard modulo operator where the output is in [0, b) for all inputs.
   * @private
   * @param {number} a Any finite number.
   * @param {number} b A positive number.
   * @returns {number} The positive version of `a % b`.
   */
  function modulo(a, b) {
    return ((a % b) + b) % b;
  }

  /**
   * Pick a subdomain from a list of subdomains based on a the tile location.
   *
   * @param {number} x The x tile coordinate.
   * @param {number} y The y tile coordinate.
   * @param {number} z The tile layer.
   * @param {string[]} subdomains The list of known subdomains.
   * @returns {string} A subdomain based on the location.
   */
  function m_getTileSubdomain(x, y, z, subdomains) {
    return subdomains[modulo(x + y + z, subdomains.length)];
  }

  /**
   * Returns an OSM tile server formatting function from a standard format
   * string. Replaces `{s}`, `{z}`, `{x}`, and `{y}`.  These may be any case
   * and may be prefixed with `$` (e.g., `${X}` is the same as `{x}`).  The
   * subdomain can be specifed by a string of characters, listed as a range,
   * or as a comma-separated list (e.g., `{s:abc}`, `{a-c}`, `{a,b,c}` are
   * all equivalent.  The comma-separated list can have subdimains that are of
   * any length; the string and range both use one-character subdomains.
   *
   * @param {string} base The tile format string
   * @returns {function} A conversion function.
   * @private.
   */
  function m_tileUrlFromTemplate(base) {
    var xPattern = new RegExp(/\$?\{[xX]\}/),
        yPattern = new RegExp(/\$?\{[yY]\}/),
        zPattern = new RegExp(/\$?\{[zZ]\}/),
        sPattern = new RegExp(/\$?\{(s|S|[sS]:[^{}]+|[^-{}]-[^-{}]|([^,{}]+,)+[^,{}]+)\}/);
    var url = base
        .replace(sPattern, '{s}')
        .replace(xPattern, '{x}')
        .replace(yPattern, '{y}')
        .replace(zPattern, '{z}');
    var urlSubdomains;
    var sMatch = base.match(sPattern);
    if (sMatch) {
      if (sMatch[2]) {
        urlSubdomains = sMatch[1].split(',');
      } else if (sMatch[1][1] === ':') {
        urlSubdomains = sMatch[1].substr(2).split('');
      } else if (sMatch[1][1] === '-') {
        urlSubdomains = [];
        var start = sMatch[1].charCodeAt(0),
            end = sMatch[1].charCodeAt(2);
        for (var i = Math.min(start, end); i <= Math.max(start, end); i += 1) {
          urlSubdomains.push(String.fromCharCode(i));
        }
      }
    }

    return function (x, y, z, subdomains) {
      return url
        .replace('{s}', m_getTileSubdomain(x, y, z, urlSubdomains || subdomains))
        .replace('{x}', x)
        .replace('{y}', y)
        .replace('{z}', z);
    };
  }

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
   * @class geo.tileLayer
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
   * @param {function} [options.tilesAtZoom=null]
   *    A function that is given a zoom level and returns {x: (num), y: (num)}
   *    with the number of tiles at that zoom level.
   * @param {number} [options.cacheSize=400] The maximum number of tiles to
   *    cache.  The default is 200 if keepLower is false.
   * @param {boolean}   [options.keepLower=true]
   *    Keep lower zoom level tiles when showing high zoom level tiles.  This
   *    uses more memory but results in smoother transitions.
   * @param {boolean}   [options.wrapX=true]    Wrap in the x-direction
   * @param {boolean}   [options.wrapY=false]   Wrap in the y-direction
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
   * @param {function} [options.tilesMaxBounds=null]
   *   This function takes a zoom level argument and returns, in units of
   *   pixels, the top, left, right, and bottom maximum value for which tiles
   *   should be drawn at the given zoom level relative to the bottom left
   *   corner of the domain.  This can be used to crop tiles at the edges of
   *   tile layer.  Note that if tiles wrap, only complete tiles in the
   *   wrapping direction(s) are supported, and this max bounds will probably
   *   not behave properly.
   * @param {boolean}   [options.topDown=false]  True if the gcs is top-down,
   *   false if bottom-up (the ingcs does not matter, only the gcs coordinate
   *   system).  When false, this inverts the gcs y-coordinate when calculating
   *   local coordinates.
   * @returns {geo.tileLayer}
   */
  var tileLayer = function (options) {
    'use strict';
    if (!(this instanceof tileLayer)) {
      return new tileLayer(options);
    }
    featureLayer.call(this, options);

    var $ = require('jquery');
    var geo_event = require('./event');
    var transform = require('./transform');
    var tileCache = require('./tileCache');
    var fetchQueue = require('./fetchQueue');
    var adjustLayerForRenderer = require('./registry').adjustLayerForRenderer;
    var Tile = require('./tile');

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

    var s_init = this._init,
        s_exit = this._exit,
        s_visible = this.visible,
        m_lastTileSet = [],
        m_maxBounds = [],
        m_exited;

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
    this._cache = tileCache({size: options.cacheSize});

    // initialize the tile fetch queue
    this._queue = fetchQueue({
      // this should probably be 6 * subdomains.length if subdomains are used
      size: 6,
      // if track is the same as the cache size, then neither processing time
      // nor memory will be wasted.  Larger values will use more memory,
      // smaller values will do needless computations.
      track: options.cacheSize,
      needed: function (tile) {
        return tile === this.cache.get(tile.toString(), true);
      }.bind(this)
    });

    var m_tileOffsetValues = {};

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
     *
     * @param {number} level A zoom level
     * @returns {{x: nx, y: ny}} The number of tiles in each axis
     */
    this.tilesAtZoom = function (level) {
      if (this._options.tilesAtZoom) {
        return this._options.tilesAtZoom.call(this, level);
      }
      var s = Math.pow(2, level);
      return {x: s, y: s};
    };

    /**
     * The maximum tile bounds at the given zoom level, or null if no special
     * tile bounds.
     *
     * @param {number} level A zoom level
     * @returns {object} {x: width, y: height} The maximum tile bounds in
     *      pixels for the specified level, or null if none specified.
     */
    this.tilesMaxBounds = function (level) {
      if (this._options.tilesMaxBounds) {
        return this._options.tilesMaxBounds.call(this, level);
      }
      return null;
    };

    /**
     * Get the crop values for a tile based on the tilesMaxBounds function.
     * Returns undefined if the tile should not be cropped.
     *
     * @param {object} tile: the tile to compute crop values for.
     * @returns {object} either undefined or an object with x and y values
     *      which is the size in pixels for the tile.
     */
    this.tileCropFromBounds = function (tile) {
      if (!this._options.tilesMaxBounds) {
        return;
      }
      var level = tile.index.level,
          bounds = this._tileBounds(tile);
      if (m_maxBounds[level] === undefined) {
        m_maxBounds[level] = this.tilesMaxBounds(level) || null;
      }
      if (m_maxBounds[level] && (bounds.right > m_maxBounds[level].x ||
          bounds.bottom > m_maxBounds[level].y)) {
        return {
          x: Math.max(0, Math.min(m_maxBounds[level].x, bounds.right) - bounds.left),
          y: Math.max(0, Math.min(m_maxBounds[level].y, bounds.bottom) - bounds.top)
        };
      }
    };

    /**
     * Returns true if the given tile index is valid:
     *   * min level <= level <= max level
     *   * 0 <= x <= 2^level - 1
     *   * 0 <= y <= 2^level - 1
     * If the layer wraps, the x and y values may be allowed to extend beyond
     * these values.
     *
     * @param {object} index The tile index.
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
      if (!(this._options.wrapX || (
            0 <= index.x &&
            index.x <= this.tilesAtZoom(index.level).x - 1))) {
        return false;
      }
      if (!(this._options.wrapY || (
            0 <= index.y &&
            index.y <= this.tilesAtZoom(index.level).y - 1))) {
        return false;
      }
      return true;
    };

    /**
     * Returns the current origin tile and offset at the given zoom level.
     * This is intended to be cached in the future to optimize coordinate
     * transformations.
     * @protected
     * @param {number} level The target zoom level.
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
     * @param {geo.tile} tile The tile to check.
     * @returns {object} The tile's bounds.
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
     * @param {number} level The target zoom level.
     * @returns {object} The tile indices.
     */
    this.tileAtPoint = function (point, level) {
      var o = this._origin(level);
      var map = this.map();
      point = this.displayToLevel(map.gcsToDisplay(point, null), level);
      if (isNaN(point.x)) { point.x = 0; }
      if (isNaN(point.y)) { point.y = 0; }
      var to = this._tileOffset(level);
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
     *
     * @param {object|tile} indexOrTile Either a tile or an object with
     *    {x, y, level}` specifying a tile.
     * @param {string|geo.transform|null} [gcs] `undefined` to use the
     *    interface gcs, `null` to use the map gcs, or any other transform.
     * @returns {object} The tile bounds in the specified gcs.
     */
    this.gcsTileBounds = function (indexOrTile, gcs) {
      var tile = (indexOrTile.index ? indexOrTile : Tile({
        index: indexOrTile,
        size: {x: this._options.tileWidth, y: this._options.tileHeight},
        url: ''
      }));
      var to = this._tileOffset(tile.index.level),
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
        coord = transform.transformCoordinates(map.gcs(), gcs, coord);
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
     *
     * @param {object} index The tile index.
     * @param {number} index.x
     * @param {number} index.y
     * @param {number} index.level
     * @param {object} source The tile index used for constructing the url.
     * @param {number} source.x
     * @param {number} source.y
     * @param {number} source.level
     * @returns {geo.tile}
     */
    this._getTile = function (index, source) {
      var urlParams = source || index;
      return Tile({
        index: index,
        size: {x: this._options.tileWidth, y: this._options.tileHeight},
        queue: this._queue,
        url: this._options.url.call(
            this, urlParams.x, urlParams.y, urlParams.level || 0,
            this._options.subdomains)
      });
    };

    /**
     * Returns an instantiated tile object with the given indices.  This
     * method is similar to `_getTile`, but checks the cache before
     * generating a new tile.
     *
     * @param {object} index The tile index.
     * @param {number} index.x
     * @param {number} index.y
     * @param {number} index.level
     * @param {object} source The tile index used for constructing the url.
     * @param {number} source.x
     * @param {number} source.y
     * @param {number} source.level
     * @param {boolean} delayPurge If true, don't purge tiles from the cache.
     * @returns {geo.tile}
     */
    this._getTileCached = function (index, source, delayPurge) {
      var tile = this.cache.get(this._tileHash(index));
      if (tile === null) {
        tile = this._getTile(index, source);
        this.cache.add(tile, this.remove.bind(this), delayPurge);
      }
      return tile;
    };

    /**
     * Returns a string representation of the tile at the given index.
     *
     * Note: This method _must_ return the same string as:
     *
     *   tile({index: index}).toString();
     *
     * This method is used as a hashing function for the caching layer.
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
     * Returns the optimal starting and ending tile indices (inclusive)
     * necessary to fill the given viewport.
     *
     * @param {number} level The zoom level
     * @param {geo.geoBounds} bounds The map bounds in world coordinates.
     * @returns {object} The tile range with a `start`  and `end` record, each
     *      with `x` and `y` tile indices.
     */
    this._getTileRange = function (level, bounds) {
      var corners = [
        this.tileAtPoint({x: bounds.left, y: bounds.top}, level),
        this.tileAtPoint({x: bounds.right, y: bounds.top}, level),
        this.tileAtPoint({x: bounds.left, y: bounds.bottom}, level),
        this.tileAtPoint({x: bounds.right, y: bounds.bottom}, level)
      ];
      return {
        start: {
          x: Math.min(corners[0].x, corners[1].x, corners[2].x, corners[3].x),
          y: Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y)
        },
        end: {
          x: Math.max(corners[0].x, corners[1].x, corners[2].x, corners[3].x),
          y: Math.max(corners[0].y, corners[1].y, corners[2].y, corners[3].y)
        }
      };
    };

    /**
     * Returns a list of tiles necessary to fill the screen at the given
     * zoom level, center point, and viewport size.  The list is optionally
     * ordered by loading priority (center tiles first).
     *
     * @protected
     * @param {number} maxLevel The zoom level
     * @param {geo.geoBounds} bounds The map bounds
     * @param {boolean} sorted Return a sorted list
     * @param {boolean} onlyIfChanged If the set of tiles have not changed
     *     (even if their desired order has), return undefined instead of an
     *     array of tiles.
     * @returns {geo.tile[]} An array of tile objects
     */
    this._getTiles = function (maxLevel, bounds, sorted, onlyIfChanged) {
      var i, j, tiles = [], index, nTilesLevel,
          start, end, indexRange, source, center, changed = false, old, level,
          minLevel = (this._options.keepLower ? this._options.minLevel :
                      maxLevel);
      if (maxLevel < minLevel) {
        maxLevel = minLevel;
      }

      /* Generate a list of the tiles that we want to create.  This is done
       * before sorting, because we want to actually generate the tiles in
       * the sort order. */
      for (level = minLevel; level <= maxLevel; level += 1) {
        // get the tile range to fetch
        indexRange = this._getTileRange(level, bounds);
        start = indexRange.start;
        end = indexRange.end;
        // total number of tiles existing at this level
        nTilesLevel = this.tilesAtZoom(level);

        if (!this._options.wrapX) {
          start.x = Math.min(Math.max(start.x, 0), nTilesLevel.x - 1);
          end.x = Math.min(Math.max(end.x, 0), nTilesLevel.x - 1);
          if (level === minLevel && this._options.keepLower) {
            start.x = 0;
            end.x = nTilesLevel.x - 1;
          }
        }
        if (!this._options.wrapY) {
          start.y = Math.min(Math.max(start.y, 0), nTilesLevel.y - 1);
          end.y = Math.min(Math.max(end.y, 0), nTilesLevel.y - 1);
          if (level === minLevel && this._options.keepLower) {
            start.y = 0;
            end.y = nTilesLevel.y - 1;
          }
        }
        /* If we are reprojecting tiles, we need a check to not use all levels
         * if the number of tiles is excessive. */
        if (this._options.gcs && this._options.gcs !== this.map().gcs() &&
            level !== minLevel &&
            (end.x + 1 - start.x) * (end.y + 1 - start.y) >
            (this.map().size().width * this.map().size().height /
            this._options.tileWidth / this._options.tileHeight) * 16) {
          break;
        }

        // loop over the tile range
        for (i = start.x; i <= end.x; i += 1) {
          for (j = start.y; j <= end.y; j += 1) {
            index = {level: level, x: i, y: j};
            source = {level: level, x: i, y: j};
            if (this._options.wrapX) {
              source.x = modulo(source.x, nTilesLevel.x);
            }
            if (this._options.wrapY) {
              source.y = modulo(source.y, nTilesLevel.y);
            }
            if (this.isValid(source)) {
              if (onlyIfChanged && tiles.length < m_lastTileSet.length) {
                old = m_lastTileSet[tiles.length];
                changed = changed || (index.level !== old.level ||
                    index.x !== old.x || index.y !== old.y);
              }
              tiles.push({index: index, source: source});
            }
          }
        }
      }

      if (onlyIfChanged) {
        if (!changed && tiles.length === m_lastTileSet.length) {
          return;
        }
        m_lastTileSet.splice(0, m_lastTileSet.length);
        $.each(tiles, function (idx, tile) {
          m_lastTileSet.push(tile.index);
        });
      }

      if (sorted) {
        center = {
          x: (start.x + end.x) / 2,
          y: (start.y + end.y) / 2,
          level: maxLevel,
          bottomLevel: maxLevel
        };
        var numTiles = Math.max(end.x - start.x, end.y - start.y) + 1;
        for (; numTiles >= 1; numTiles /= 2) {
          center.bottomLevel -= 1;
        }
        tiles.sort(this._loadMetric(center));
        /* If we are using a fetch queue, start a new batch */
        if (this._queue) {
          this._queue.batch(true);
        }
      }
      if (this.cache.size < tiles.length) {
        console.log('Increasing cache size to ' + tiles.length);
        this.cache.size = tiles.length;
      }
      /* Actually get the tiles. */
      for (i = 0; i < tiles.length; i += 1) {
        tiles[i] = this._getTileCached(tiles[i].index, tiles[i].source, true);
      }
      this.cache.purge(this.remove.bind(this));
      return tiles;
    };

    /**
     * Prefetches tiles up to a given zoom level around a given bounding box.
     *
     * @param {number} level The zoom level.
     * @param {geo.geoBounds} bounds The map bounds.
     * @returns {jQuery.Deferred} resolves when all of the tiles are fetched.
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
     * @param {object} center The center tile.
     * @param {number} center.x
     * @param {number} center.y
     * @returns {function} A function accepted by `Array.prototype.sort`.
     */
    this._loadMetric = function (center) {
      return function (a, b) {
        var a0, b0, dx, dy, cx, cy, scale;

        a = a.index || a;
        b = b.index || b;
        // shortcut if zoom level differs
        if (a.level !== b.level) {
          if (center.bottomLevel && ((a.level >= center.bottomLevel) !==
                                     (b.level >= center.bottomLevel))) {
            return a.level >= center.bottomLevel ? -1 : 1;
          }
          return a.level - b.level;
        }

        /* compute the center coordinates relative to a.level.  Since we really
         * care about the center of the tiles, use an offset */
        scale = Math.pow(2, a.level - center.level);
        cx = (center.x + 0.5) * scale - 0.5;
        cy = (center.y + 0.5) * scale - 0.5;

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
     *
     * @param {object} coord
     * @param {number} coord.x The offset in pixels (level 0) from the left
     *      edge.
     * @param {number} coord.y The offset in pixels (level 0) from the bottom
     *      edge.
     * @param {number} level The zoom level of the source coordinates.
     * @returns {object} World coordinates with `x` and `y`.
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
     *
     * @param {object} coord
     * @param {number} coord.x The offset in pixels (level 0) from the left
     *      edge.
     * @param {number} coord.y The offset in pixels (level 0) from the bottom
     *      edge.
     * @param {number} level The zoom level of the new coordinates.
     * @returns {object} The pixel coordinates.
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
     * Render the tile on the canvas.  This implementation draws the tiles
     * directly on the DOM using <img> tags.  Derived classes should override
     * this method to draw the tile on a renderer specific context.
     *
     * @protected
     * @param {geo.tile} tile The tile to draw
     */
    this._drawTile = function (tile) {
      // Make sure this method is not called when there is
      // a renderer attached.
      if (this.renderer() !== null) {
        throw new Error('This draw method is not valid on renderer managed layers.');
      }

      // get the layer node
      var level = tile.index.level,
          div = $(this._getSubLayer(level)),
          bounds = this._tileBounds(tile),
          duration = this._options.animationDuration,
          container = $('<div class="geo-tile-container"/>').attr(
            'tile-reference', tile.toString()),
          crop;

      // apply a transform to place the image correctly
      container.append(tile.image);
      container.css({
        left: (bounds.left - parseInt(div.attr('offsetx') || 0, 10)) + 'px',
        top: (bounds.top - parseInt(div.attr('offsety') || 0, 10)) + 'px'
      });

      crop = this.tileCropFromBounds(tile);
      if (crop) {
        container.addClass('crop').css({
          width: crop.x + 'px',
          height: crop.y + 'px'
        });
      }

      // apply fade in animation
      if (duration > 0) {
        tile.fadeIn(duration);
      }

      // append the image element
      div.append(container);

      // add an error handler
      tile.catch(function () {
        // May want to do something special here later
        console.warn('Could not load tile at ' + tile.toString());
        this._remove(tile);
      }.bind(this));
    };

    /**
     * Remove the given tile from the canvas and the active cache.
     * @param {geo.tile|string} tile The tile (or hash) to remove.
     * @returns {geo.tile} The tile removed from the active layer.
     */
    this.remove = function (tile) {
      var hash = tile.toString();
      var value = this._activeTiles[hash];

      if (value instanceof Tile) {
        this._remove(value);
      }

      delete this._activeTiles[hash];
      return value;
    };

    /**
     * Remove the given tile from the canvas.  This implementation just
     * finds and removes the <img> element created for the tile.
     * @param {geo.tile|string} tile The tile object to remove.
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
     * @param {geo.tile} tile The tile object to move.
     */
    this._moveToTop = function (tile) {
      $.noop(tile);
    };

    /**
     * Query the attached map for the current bounds and return them as pixels
     *      at the current zoom level.
     *
     * @returns {object} Bounds object with `left`, `right`, `top`, `bottom`,
     *      `scale`, and `level` keys.
     * @protected
     */
    this._getViewBounds = function () {
      var map = this.map(),
          mapZoom = map.zoom(),
          zoom = this._options.tileRounding(mapZoom),
          scale = Math.pow(2, mapZoom - zoom),
          size = map.size();
      var ul = this.displayToLevel({x: 0, y: 0}),
          ur = this.displayToLevel({x: size.width, y: 0}),
          ll = this.displayToLevel({x: 0, y: size.height}),
          lr = this.displayToLevel({x: size.width, y: size.height});
      return {
        level: zoom,
        scale: scale,
        left: Math.min(ul.x, ur.x, ll.x, lr.x),
        right: Math.max(ul.x, ur.x, ll.x, lr.x),
        top: Math.min(ul.y, ur.y, ll.y, lr.y),
        bottom: Math.max(ul.y, ur.y, ll.y, lr.y)
      };
    };

    /**
     * Remove all inactive tiles from the display.  An inactive tile is one
     * that is no longer visible either because it was panned out of the active
     * view or the zoom has changed.
     *
     * @protected
     * @param {number} zoom Tiles (in bounds) at this zoom level will be kept
     * @param {boolean} doneLoading If true, allow purging additional tiles.
     * @param {object} bounds view bounds.  If not specified, this is
     *   obtained from _getViewBounds().
     * @returns {this}
     */
    this._purge = function (zoom, doneLoading, bounds) {
      var tile, hash;

      // Don't purge tiles in an active update
      if (this._updating) {
        return this;
      }

      // get the view bounds
      if (!bounds) {
        bounds = this._getViewBounds();
      }

      for (hash in this._activeTiles) {

        tile = this._activeTiles[hash];
        if (this._canPurge(tile, bounds, zoom, doneLoading)) {
          this.remove(tile);
        }
      }
      return this;
    };

    /**
     * Remove all active tiles from the canvas.
     * @returns {geo.tile[]} The array of tiles removed.
     */
    this.clear = function () {
      var tiles = [], tile;

      // ignoring the warning here because this is a privately
      // controlled object with simple keys
      for (tile in this._activeTiles) {
        tiles.push(this.remove(tile));
      }

      // clear out the tile coverage tree
      this._tileTree = {};

      m_lastTileSet = [];

      return tiles;
    };

    /**
     * Reset the layer to the initial state, clearing the canvas
     * and resetting the tile cache.
     * @returns {this} Chainable.
     */
    this.reset = function () {
      this.clear();
      this._cache.clear();
      return this;
    };

    /**
     * Compute local coordinates from the given world coordinates.  The
     * tile layer uses units of pixels relative to the world space
     * coordinate origin.
     * @param {object} pt A point in world space coordinates.
     * @param {number|undefined} zoom If unspecified, use the map zoom.
     * @returns {object} Local coordinates.
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
     * @param {object} pt A point in world space coordinates.
     * @param {number|undefined} zoom If unspecified, use the map zoom.
     * @returns {object} Local coordinates.
     */
    this.fromLocal = function (pt, zoom) {
      // these need to always use the *layer* unitsPerPixel, or possibly
      // convert tile space using a transform
      var map = this.map(),
          unit = map.unitsPerPixel(zoom === undefined ? map.zoom() : zoom);
      return {
        x: pt.x * unit,
        y: this._topDown() * pt.y * unit
      };
    };

    /**
     * Return a factor for inverting the y units as appropriate.
     *
     * @returns {number} Either 1 to not invert y, or -1 to invert it.
     */
    this._topDown = function () {
      return this._options.topDown ? 1 : -1;
    };

    /**
     * Return the DOM element containing a level specific layer.  This will
     * create the element if it doesn't already exist.
     * @param {number} level The zoom level of the layer to fetch.
     * @returns {DOM} The layer's DOM element.
     */
    this._getSubLayer = function (level) {
      if (!this.canvas()) {
        return;
      }
      var node = this.canvas()
        .find('div[data-tile-layer=' + level.toFixed() + ']').get(0);
      if (!node) {
        node = $(
          '<div class=geo-tile-layer data-tile-layer="' + level.toFixed() + '"/>'
        ).get(0);
        this.canvas().append(node);
      }
      return node;
    };

    /**
     * Set sublayer transforms to align them with the given zoom level.
     * @param {number} level The target zoom level.
     * @param {geo.geoBounds} view The view bounds.  The top and left are used
     *      to adjust the offset of tile layers.
     * @returns {object} The x and y offsets for the current level.
     */
    this._updateSubLayers = function (level, view) {
      var canvas = this.canvas(),
          lastlevel = parseInt(canvas.attr('lastlevel'), 10),
          lastx = parseInt(canvas.attr('lastoffsetx') || 0, 10),
          lasty = parseInt(canvas.attr('lastoffsety') || 0, 10);
      if (lastlevel === level && Math.abs(lastx - view.left) < 65536 &&
          Math.abs(lasty - view.top) < 65536) {
        return {x: lastx, y: lasty};
      }
      var map = this.map(),
          to = this._tileOffset(level),
          x = parseInt((view.left + view.right - map.size().width) / 2 + to.x, 10),
          y = parseInt((view.top + view.bottom - map.size().height) / 2 + to.y, 10);
      canvas.find('.geo-tile-layer').each(function (idx, el) {
        var $el = $(el),
            layer = parseInt($el.data('tileLayer'), 10);
        $el.css(
          'transform',
          'scale(' + Math.pow(2, level - layer) + ')'
        );
        var layerx = parseInt(x / Math.pow(2, level - layer), 10),
            layery = parseInt(y / Math.pow(2, level - layer), 10),
            dx = layerx - parseInt($el.attr('offsetx') || 0, 10),
            dy = layery - parseInt($el.attr('offsety') || 0, 10);
        $el.attr({offsetx: layerx, offsety: layery});
        $el.find('.geo-tile-container').each(function (tileidx, tileel) {
          $(tileel).css({
            left: (parseInt($(tileel).css('left'), 10) - dx) + 'px',
            top: (parseInt($(tileel).css('top'), 10) - dy) + 'px'
          });
        });
      });
      canvas.attr({lastoffsetx: x, lastoffsety: y, lastlevel: level});
      return {x: x, y: y};
    };

    /**
     * Update the view according to the map/camera.
     * @param {geo.event} evt The event that triggered the change.  Zoom and
     *      rotate events do nothing, since they are always followed by a pan
     *      event which will cause appropriate action.
     * @returns {this} Chainable.
     */
    this._update = function (evt) {
      /* Ignore zoom and rotate events, as they are ALWAYS followed by a pan
       * event */
      if (evt && evt.event && (evt.event.event === geo_event.zoom ||
          evt.event.event === geo_event.rotate)) {
        return this;
      }
      if (!this.visible()) {
        return this;
      }
      var map = this.map(),
          bounds = map.bounds(undefined, null),
          mapZoom = map.zoom(),
          zoom = this._options.tileRounding(mapZoom),
          tiles;
      if (this._updateSubLayers) {
        var view = this._getViewBounds();
        // Update the transform for the local layer coordinates
        var offset = this._updateSubLayers(zoom, view) || {x: 0, y: 0};

        var to = this._tileOffset(zoom);
        if (this.renderer() === null) {
          var scale = Math.pow(2, mapZoom - zoom),
              rotation = map.rotation(),
              rx = -to.x + -(view.left + view.right) / 2 + offset.x,
              ry = -to.y + -(view.bottom + view.top) / 2 + offset.y,
              dx = (rx + map.size().width / 2),
              dy = (ry + map.size().height / 2);

          this.canvas().css({
            'transform-origin': '' +
                -rx + 'px ' +
                -ry + 'px'
          });
          var transform = 'translate(' + dx + 'px' + ',' + dy + 'px' + ')' +
              'scale(' + scale + ')';
          if (rotation) {
            transform += 'rotate(' + (rotation * 180 / Math.PI) + 'deg)';
          }
          this.canvas().css('transform', transform);
        }
        /* Set some attributes that can be used by non-css based viewers.  This
         * doesn't include the map center, as that may need to be handled
         * differently from the view center. */
        this.canvas().attr({
          scale: Math.pow(2, mapZoom - zoom),
          dx: -to.x + -(view.left + view.right) / 2,
          dy: -to.y + -(view.bottom + view.top) / 2,
          offsetx: offset.x,
          offsety: offset.y,
          rotation: map.rotation()
        });
      }

      tiles = this._getTiles(
        zoom, bounds, true, true
      );

      if (tiles === undefined) {
        return this;
      }

      // reset the tile coverage tree
      this._tileTree = {};

      tiles.forEach(function (tile) {
        if (tile.fetched()) {
          /* if we have already fetched the tile, we know we can just draw it,
           * as the bounds won't have changed since the call to _getTiles. */
          this.drawTile(tile);

          // mark the tile as covered
          this._setTileTree(tile);
        } else {
          if (!tile._queued) {
            tile.then(function () {
              if (m_exited) {
                /* If we have disconnected the renderer, do nothing.  This
                 * happens when the layer is being deleted. */
                return;
              }
              if (tile !== this.cache.get(tile.toString())) {
                /* If the tile has fallen out of the cache, don't draw it -- it
                 * is untracked.  This may be an indication that a larger cache
                 * should have been used. */
                return;
              }
              /* Check if a tile is still desired.  Don't draw it if it
               * isn't. */
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
            tile._queued = true;
          } else {
            /* If we are using a fetch queue, tell the queue so this tile can
             * be reprioritized. */
            var pos = this._queue ? this._queue.get(tile) : -1;
            if (pos >= 0) {
              this._queue.add(tile);
            }
          }
        }
      }.bind(this));
      // purge all old tiles when the new tiles are loaded (successfully or not)
      $.when.apply($, tiles)
        .done(// called on success and failure
          function () {
            var map = this.map(),
                mapZoom = map.zoom(),
                zoom = this._options.tileRounding(mapZoom);
            this._purge(zoom, true);
          }.bind(this)
        );
      return this;
    };

    /**
     * Set a value in the tile tree object indicating that the given area of
     * the canvas is covered by the tile.
     * @protected
     * @param {geo.tile} tile
     */
    this._setTileTree = function (tile) {
      if (this._options.keepLower) {
        return;
      }
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
     * Returns true if the tile is completely covered by other tiles on the
     * canvas.  Currently this method only checks layers +/- 1 away from
     * `tile`.  If the zoom level is allowed to change by 2 or more in a single
     * update step, this method will need to be refactored to make a more
     * robust check.  Returns an array of tiles covering it or null if any
     * part of the tile is exposed.
     *
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
     * @param {geo.geoBounds} bounds The view bounds.
     * @returns {boolean}
     */
    this._outOfBounds = function (tile, bounds) {
      /* We may want to add an (n) tile edge buffer so we appear more
       * responsive */
      var to = this._tileOffset(tile.index.level);
      var scale = 1;
      if (tile.index.level !== bounds.level) {
        scale = Math.pow(2, (bounds.level || 0) - (tile.index.level || 0));
      }
      return (tile.bottom - to.y) * scale < bounds.top ||
             (tile.left - to.x) * scale > bounds.right ||
             (tile.top - to.y) * scale > bounds.bottom ||
             (tile.right - to.x) * scale < bounds.left;
    };

    /**
     * Returns true if the provided tile can be purged from the canvas.  This method
     * will return `true` if the tile is completely covered by one or more other tiles
     * or it is outside of the active view bounds.  This method returns the logical and
     * of `_isCovered` and `_outOfBounds`.
     * @protected
     * @param {geo.tile} tile
     * @param {geo.geoBounds} [bounds] The view bounds (if unspecified, assume
     *      global bounds)
     * @param {number} bounds.level The zoom level the bounds are given as.
     * @param {number} zoom Keep in bound tile at this zoom level.
     * @param {boolean} doneLoading If true, allow purging additional tiles.
     * @returns {boolean}
     */
    this._canPurge = function (tile, bounds, zoom, doneLoading) {
      if (this._options.keepLower) {
        zoom = zoom || 0;
        if (zoom < tile.index.level &&
            tile.index.level !== this._options.minLevel) {
          return true;
        }
        if (tile.index.level === this._options.minLevel &&
            !this._options.wrapX && !this._options.wrapY) {
          return false;
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
     * @param {object} [pt] The point to convert with `x` and `y`.  If
     *      `undefined`, use the center of the display.
     * @param {number} [zoom] If specified, the zoom level to use.
     * @returns {object} The point in level coordinates.
     */
    this.displayToLevel = function (pt, zoom) {
      var map = this.map(),
          mapzoom = map.zoom(),
          roundzoom = this._options.tileRounding(mapzoom),
          unit = map.unitsPerPixel(zoom === undefined ? roundzoom : zoom),
          gcsPt;
      if (pt === undefined) {
        var size = map.size();
        pt = {x: size.width / 2, y: size.height / 2};
      }
      /* displayToGcs can fail under certain projections.  If this happens,
       * just return the origin. */
      try {
        gcsPt = map.displayToGcs(pt, this._options.gcs || null);
      } catch (err) {
        gcsPt = {x: 0, y: 0};
      }
      /* Reverse the y coordinate, since we expect the gcs coordinate system
       * to be right-handed and the level coordinate system to be
       * left-handed. */
      var lvlPt = {x: gcsPt.x / unit, y: this._topDown() * gcsPt.y / unit};
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
     * Get or set the subdomains used for templating.
     *
     * @param {string|list} [subdomains] A comma-separated list, a string of
     *      single character subdomains, or a list.
     * @returns {string|list|this}
     */
    this.subdomains = function (subdomains) {
      if (subdomains === undefined) {
        return this._options.subdomains;
      }
      if (subdomains) {
        if ($.type(subdomains) === 'string') {
          if (subdomains.indexOf(',') >= 0) {
            subdomains = subdomains.split(',');
          } else {
            subdomains = subdomains.split('');
          }
        }
        this._options.subdomains = subdomains;
        this.reset();
        this.map().draw();
      }
      return this;
    };

    /**
     * Return a value from the tileOffset function, caching it for different
     * levels.
     *
     * @param {number} level The level to pass to the tileOffset function.
     * @returns {object} A tile offset object with `x` and `y` properties.
     */
    this._tileOffset = function (level) {
      if (m_tileOffsetValues[level] === undefined) {
        m_tileOffsetValues[level] = this._options.tileOffset(level);
      }
      return m_tileOffsetValues[level];
    };

    /**
     * Get/Set visibility of the layer.
     *
     * @param {boolean|undefined} val If unspecified, return the visibility,
     *    otherwise set it.
     * @returns {boolean|this} Either the visibility (if getting) or the layer
     *    (if setting).
     */
    this.visible = function (val) {
      if (val === undefined) {
        return s_visible();
      }
      if (this.visible() !== val) {
        s_visible(val);

        if (val) {
          this._update();
        }
      }
      return this;
    };

    /**
     * Initialize after the layer is added to the map.
     *
     * @returns {this}
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

    /**
     * Clean up the layer.
     *
     * @returns {this}
     */
    this._exit = function () {
      this.reset();
      // call super method
      s_exit.apply(this, arguments);
      m_exited = true;
      return this;
    };

    adjustLayerForRenderer('tile', this);

    return this;
  };

  /**
   * This object contains the default options used to initialize the tileLayer.
   */
  tileLayer.defaults = {
    minLevel: 0,
    maxLevel: 18,
    tileOverlap: 0,
    tileWidth: 256,
    tileHeight: 256,
    wrapX: true,
    wrapY: false,
    url: null,
    subdomains: 'abc',
    tileOffset: function (level) {
      return {x: 0, y: 0};
    },
    tilesMaxBounds: null,
    topDown: false,
    keepLower: true,
    // cacheSize: 400,  // set depending on keepLower
    tileRounding: Math.round,
    attribution: '',
    animationDuration: 0
  };

  inherit(tileLayer, featureLayer);
  return tileLayer;
})();
