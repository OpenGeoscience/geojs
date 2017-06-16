module.exports = (function () {
  'use strict';

  /**
   * This class implements a simple cache for tile objects.  Each tile is
   * stored in cache object keyed by a configurable hashing function.  Another
   * array keeps track of last access times for each tile to purge old tiles
   * once the maximum cache size is reached.
   *
   * @class geo.tileCache
   *
   * @param {object?} [options] A configuratoin object for the cache
   * @param {number} [options.size=64] The maximum number of tiles to store
   */
  var tileCache = function (options) {
    if (!(this instanceof tileCache)) {
      return new tileCache(options);
    }
    options = options || {};
    this._size = options.size || 64;

    /**
     * Get/set the maximum cache size.
     */
    Object.defineProperty(this, 'size', {
      get: function () { return this._size; },
      set: function (n) {
        while (this._atime.length > n) {
          this.remove(this._atime[this._atime.length - 1]);
        }
        this._size = n;
      }
    });

    /**
     * Get the current cache size.
     */
    Object.defineProperty(this, 'length', {
      get: function () { return this._atime.length; }
    });

    /**
     * Get the position of the tile in the access queue.
     * @param {string} hash The tile's hash value
     * @returns {number} The position in the queue or -1
     */
    this._access = function (hash) {
      return this._atime.indexOf(hash);
    };

    /**
     * Remove a tile from the cache.
     * @param {string|geo.tile} tile The tile or its hash
     * @returns {bool} true if a tile was removed
     */
    this.remove = function (tile) {
      var hash = typeof tile === 'string' ? tile : tile.toString();

      // if the tile is not in the cache
      if (!(hash in this._cache)) {
        return false;
      }

      // Remove the tile from the access queue
      this._atime.splice(this._access(hash), 1);

      // Remove the tile from the cache
      delete this._cache[hash];
      return true;
    };

    /**
     * Remove all tiles from the cache.
     */
    this.clear = function () {
      this._cache = {};  // The hash -> tile mapping
      this._atime = [];  // The access queue (the hashes are stored)
      return this;
    };

    /**
     * Get a tile from the cache if it exists, otherwise
     * return null.  This method also moves the tile to the
     * front of the access queue.
     *
     * @param {string|geo.tile} hash The tile or the tile hash value
     * @param {boolean} noMove if true, don't move the tile to the front of the
     *     access queue.
     * @returns {geo.tile|null}
     */
    this.get = function (hash, noMove) {
      hash = typeof hash === 'string' ? hash : hash.toString();
      if (!(hash in this._cache)) {
        return null;
      }

      if (!noMove) {
        this._atime.splice(this._access(hash), 1);
        this._atime.unshift(hash);
      }
      return this._cache[hash];
    };

    /**
     * Add a tile to the cache.
     * @param {geo.tile} tile
     * @param {function} removeFunc if specified and tiles must be purged from
     *      the cache, call this function on each tile before purging.
     * @param {boolean} noPurge if true, don't purge tiles.
     */
    this.add = function (tile, removeFunc, noPurge) {
      // remove any existing tiles with the same hash
      this.remove(tile);
      var hash = tile.toString();

      // add the tile
      this._cache[hash] = tile;
      this._atime.unshift(hash);

      if (!noPurge) {
        this.purge(removeFunc);
      }
    };

    /**
     * Purge tiles from the cache if it is full.
     * @param {function} removeFunc if specified and tiles must be purged from
     *      the cache, call this function on each tile before purging.
     */
    this.purge = function (removeFunc) {
      var hash;
      while (this._atime.length > this.size) {
        hash = this._atime.pop();
        var tile = this._cache[hash];
        if (removeFunc) {
          removeFunc(tile);
        }
        delete this._cache[hash];
      }
    };

    this.clear();
    return this;
  };
  return tileCache;
})();
