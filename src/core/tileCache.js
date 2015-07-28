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
      for (i = n; i < this._size; i += 1) {
        this._remove(i);
      }
      this._size = n;
    },

    /**
     * Remove a tile from the cache.
     * @param {Number} index The position in the queue to remove
     */
    _remove: function (index) {
      var tile = this._atime[index];
      delete this._cache[tile];
    },

    /**
     * Remove all tiles from the cache.
     */
    clear: function () {
      this._cache = {};
      this._atime = [];
      this._index = 0;
    }
  };
})();
