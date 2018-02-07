module.exports = (function () {
  'use strict';

  var $ = require('jquery');

  /**
   * This class defines the raw interface for a "tile" on a map.  A tile is
   * defined as a rectangular section of a map.  The base implementation
   * is independent of the actual content of the tile, but assumes that
   * the content is loaded asynchronously via a url.  The tile object
   * has a promise-like interface.  For example,
   *
   * tile.then(function (data) {...}).catch(function (data) {...});
   *
   * @class geo.tile
   * @param {Object} spec The tile specification object
   *
   * @param {Object} spec.index The global position of the tile
   * @param {Number} spec.index.x The x-coordinate (usually the column number)
   * @param {Number} spec.index.y The y-coordinate (usually the row number)
   *
   * @param {Object} spec.size The size of each tile
   * @param {Number} spec.size.x Width (usually in pixels)
   * @param {Number} spec.size.y Height (usually in pixels)
   *
   * @param {Object|String} spec.url A url or jQuery ajax config object
   *
   * @param {Object?} spec.overlap The size of overlap with neighboring tiles
   * @param {Number} [spec.overlap.x=0]
   * @param {Number} [spec.overlap.y=0]
   */
  var tile = function (spec) {
    if (!(this instanceof tile)) {
      return new tile(spec);
    }

    this._index = spec.index;
    this._size = spec.size;
    this._overlap = spec.overlap || {x: 0, y: 0};
    this._wrap = spec.wrap || {x: 1, y: 1};
    this._url = spec.url;
    this._fetched = false;
    this._queue = spec.queue || null;

    /**
     * Return the index coordinates.
     */
    Object.defineProperty(this, 'index', {
      get:
        function () { return this._index; }
    });

    /**
     * Return the tile sizes.
     */
    Object.defineProperty(this, 'size', {
      get: function () { return this._size; }
    });

    /**
     * Return the tile overlap sizes.
     */
    Object.defineProperty(this, 'overlap', {
      get: function () { return this._overlap; }
    });

    /**
     * Initiate the ajax request and add a promise interface
     * to the tile object.  This method exists to allow
     * derived classes the ability to override how the tile
     * is obtained.  For example, imageTile uses an Image
     * element rather than $.get.
     */
    this.fetch = function () {
      if (!this._fetched) {
        $.get(this._url).done(function () {
          this._fetched = true;
        }.bind(this)).promise(this);
      }
      return this;
    };

    /**
     * Return whether this tile has been fetched already.
     *
     * @returns {boolean} True if the tile has been fetched.
     */
    this.fetched = function () {
      return this._fetched;
    };

    /**
     * Add a method to be called with the data when the ajax request is
     * successfully resolved.
     *
     * @param {function?} onSuccess The success handler
     * @param {function?} onFailure The failure handler
     * @returns {this} Supports chained calling
     *
     */
    this.then = function (onSuccess, onFailure) {
      // both fetch and _queueAdd can replace the current then method
      if (!this.fetched() && this._queue && this._queue.add && (!this.state ||
          this.state() === 'pending')) {
        this._queue.add(this, this.fetch);
      } else {
        this.fetch();
      }
      // Call then on the new promise
      if (this.done && this.fail) {
        this.done(onSuccess).fail(onFailure);
      } else {
        this.then(onSuccess, onFailure);
      }
      return this;
    };

    /**
     * Add a method to be called with the data when the ajax fails.
     *
     * @param {function} method The rejection handler
     * @returns {this} Supports chained calling
     *
     */
    this.catch = function (method) {
      this.then(undefined, method);
      return this;
    };

    /**
     * Return a unique string representation of the given tile useable
     * as a hash key.  Possibly extend later to include url information
     * to make caches aware of the tile source.
     * @returns {string}
     */
    this.toString = function () {
      return [this._index.level || 0, this._index.y, this._index.x].join('_');
    };

    /**
     * Return the bounds of the tile given an index offset and
     * a translation.
     *
     * @param {object} index The tile index containing (0, 0)
     * @param {object} shift The coordinates of (0, 0) inside the tile
     */
    this.bounds = function (index, shift) {
      var left, right, bottom, top;
      left = this.size.x * (this.index.x - index.x) - this.overlap.x - shift.x;
      right = left + this.size.x + this.overlap.x * 2;
      top = this.size.y * (this.index.y - index.y) - this.overlap.y - shift.y;
      bottom = top + this.size.y + this.overlap.y * 2;
      return {
        left: left,
        right: right,
        bottom: bottom,
        top: top
      };
    };

    /**
     * Computes the global coordinates of the bottom edge.
     * @returns {number}
     */
    Object.defineProperty(this, 'bottom', {
      get: function () {
        return this.size.y * (this.index.y + 1) + this.overlap.y;
      }
    });

    /**
     * Computes the global coordinates of the top edge.
     * @returns {number}
     */
    Object.defineProperty(this, 'top', {
      get: function () {
        return this.size.y * this.index.y - this.overlap.y;
      }
    });

    /**
     * Computes the global coordinates of the left edge.
     * @returns {number}
     */
    Object.defineProperty(this, 'left', {
      get: function () {
        return this.size.x * this.index.x - this.overlap.x;
      }
    });

    /**
     * Computes the global coordinates of the right edge.
     * @returns {number}
     */
    Object.defineProperty(this, 'right', {
      get: function () {
        return this.size.x * (this.index.x + 1) + this.overlap.x;
      }
    });

    /**
     * Returns the global image size at this level.
     * @returns {number}
     */
    Object.defineProperty(this, 'levelSize', {
      value: {
        width: Math.pow(2, this.index.level || 0) * this.size.x,
        height: Math.pow(2, this.index.level || 0) * this.size.y
      }
    });

    /**
     * Set the opacity of the tile to 0 and gradually fade in
     * over the given number of milliseconds.  This will also
     * resolve the embedded promise interface.
     * @param {number} duration the duration of the animation in ms
     * @returns {this} chainable
     */
    this.fadeIn = function (duration) {
      $.noop(duration);
      return this;
    };
  };
  return tile;
})();
