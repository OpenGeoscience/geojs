(function () {
  'use strict';

  //////////////////////////////////////////////////////////////////////////////
  /**
   * This class implements a simple cache for tile objects.  Each tile is
   * stored in cache object keyed by a configurable hashing function.  Another
   * array keeps track of last access times for each tile to purge old tiles
   * once the maximum cache size is reached.
   *
   * @class
   *
   * @param {Object?} [options] A configuratoin object for the cache
   * @param {Number} [options.size=64] The maximum number of tiles to store
   * @param {function?} options.hash A string valued hashing function
   */
  //////////////////////////////////////////////////////////////////////////////
  geo.tileCache = function (options) {
    if (!(this instanceof geo.tileCache)) {
      return new geo.tileCache(options);
    }
    options = options || {};
    this._size = options.size || 64;

    /*
     * The default hashing function is sufficient for imagePyramid tiles.
     */
    this._hash = options.hash || function (tile) {
      var i = tile.index;
      return [(i.level || 0), i.y, i.x].join('/');
    };

    this.clear();
    return this;
  };
  geo.tileCache.prototype = {
    /**
     * Get/set the current tile hashing function.
     */
    get hash() {
      return this._hash;
    },
    set hash(h) {
      this._hash = h;
      this.clear();
    },

    /**
     * Get/set the maximum cache size.
     */
    get size() {
      return this._size;
    },
    set size(n) {
      var i;
      for (i = n; i < this.length; i += 1) {
        this.remove(this._atime[i]);
      }
      this._size = n;
    },

    /**
     * Get the current cache size.
     */
    get length() {
      return this._atime.length;
    },

    /**
     * Get the position of the tile in the access queue.
     * @param {string} hash The tile's hash value
     * @returns {Number} The position in the queue or -1
     */
    _access: function (tile) {
      return this._atime.indexOf(tile);
    },

    /**
     * Remove a tile from the cache.
     * @param {string|geo.tile} tile The tile or its hash
     * @returns {bool} true if a tile was removed
     */
    remove: function (tile) {
      if (typeof tile !== 'string') {
        tile = this.hash(tile);
      }

      // if the tile is not in the cache
      if (!(tile in this._cache)) {
        return false;
      }

      // Remove the tile from the access queue
      this._atime.splice(this._access(tile), 1);

      // Remove the tile from the cache
      delete this._cache[tile];
      return true;
    },

    /**
     * Remove all tiles from the cache.
     */
    clear: function () {
      this._cache = {};  // The hash -> tile mapping
      this._atime = [];  // The access queue
      return this;
    },

    /**
     * Get a tile from the cache if it exists, otherwise
     * return null.  This method also moves the tile to the
     * front of the access queue.
     *
     * @param {string} hash The tile hash value
     * @returns {geo.tile|null}
     */
    get: function (hash) {
      if (!(hash in this._cache)) {
        return null;
      }

      this._atime.unshift(
        this._atime.splice(this._access(hash), 1)
      );
      return this._cache[hash];
    },

    /**
     * Add a tile to the cache.
     * @param {geo.tile} tile
     */
    add: function (tile) {
      // remove any existing tiles with the same hash
      this.remove(tile);

      // add the tile
      this._cache[this.hash(tile)] = tile;
      this._atime.unshift(tile);

      // purge a tile from the cache if necessary
      if (this._atime.length > this.size) {
        tile = this._atime.pop();
        delete this._cache[tile];
      }
    }
  };
})();
