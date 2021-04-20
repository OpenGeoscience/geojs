var $ = require('jquery');

/**
 * @typedef {object} geo.tile.spec
 *
 * @property {object} index The global position of the tile.
 * @property {number} index.x The x-coordinate (usually the column number).
 * @property {number} index.y The y-coordinate (usually the row number).
 * @property {object} size The size of each tile.
 * @property {number} size.x Width (usually in pixels).
 * @property {number} size.y Height (usually in pixels).
 * @property {object|string} url A url or jQuery ajax config object.
 * @property {object} [overlap] The size of overlap with neighboring tiles.
 * @property {number} overlap.x=0
 * @property {number} overlap.y=0
 */

/**
 * This class defines the raw interface for a "tile" on a map.  A tile is
 * defined as a quadrilateral section of a map.  The base implementation is
 * independent of the actual content of the tile, but assumes that the content
 * is loaded asynchronously via a url.  The tile object has a promise-like
 * interface.
 * @example
 * tile.then(function (data) {...}).catch(function (data) {...});
 *
 * @class
 * @alias geo.tile
 * @param {geo.tile.spec} spec The tile specification.
 * @returns {geo.tile}
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
   * Return the index coordinates.  Read only.
   *
   * @property {object} index The tile index.
   * @property {number} index.x The tile x index.
   * @property {number} index.y The tile y index.
   * @property {number} [index.level] The tile level index.
   * @property {number} [index.reference] The tile reference index.
   * @name geo.tile#index
   */
  Object.defineProperty(this, 'index', {
    get:
      function () { return this._index; }
  });

  /**
   * Return the tile size.  Read only.
   *
   * @property {object} size The tile size.
   * @property {number} size.x The tile width.
   * @property {number} size.y The tile height.
   * @name geo.tile#size
   */
  Object.defineProperty(this, 'size', {
    get: function () { return this._size; }
  });

  /**
   * Return the tile overlap.  Read only.
   *
   * @property {object} overlap The tile overlap.
   * @property {number} overlap.x The tile x overlap.
   * @property {number} overlap.y The tile y overlap.
   * @name geo.tile#overlap
   */
  Object.defineProperty(this, 'overlap', {
    get: function () { return this._overlap; }
  });

  /**
   * Initiate the ajax request and add a promise interface to the tile
   * object.  This method exists to allow derived classes the ability to
   * override how the tile is obtained.  For example, imageTile uses an
   * Image element rather than $.get.
   *
   * @returns {this}
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
   * @param {function?} onSuccess The success handler.
   * @param {function?} onFailure The failure handler.
   * @returns {this}
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
   * @param {function} method The rejection handler.
   * @returns {this}
   */
  this.catch = function (method) {
    this.then(undefined, method);
    return this;
  };

  /**
   * Return a unique string representation of the given tile useble as a hash
   * key.  Possibly extend later to include url information to make caches
   * aware of the tile source.
   *
   * @returns {string}
   */
  this.toString = function () {
    return [this._index.level || 0, this._index.y, this._index.x, this._index.reference || 0].join('_');
  };

  /**
   * Return the bounds of the tile given an index offset and a translation.
   *
   * @param {object} index The tile index containing (0, 0).
   * @param {object} shift The coordinates of (0, 0) inside the tile.
   * @returns {object} An object with `left`, `top`, `right`, `bottom`.
   */
  this.bounds = function (index, shift) {
    var left, right, bottom, top;
    left = this.size.x * (this.index.x - index.x) - this.overlap.x - shift.x;
    right = left + this.size.x + this.overlap.x * 2;
    top = this.size.y * (this.index.y - index.y) - this.overlap.y - shift.y;
    bottom = top + this.size.y + this.overlap.y * 2;
    if (this.overlap.x && this.index.x === index.x) {
      left += this.overlap.x;
    }
    if (this.overlap.y && this.index.y === index.y) {
      top += this.overlap.y;
    }
    return {
      left: left,
      right: right,
      bottom: bottom,
      top: top
    };
  };

  /**
   * Computes the global coordinates of the bottom edge.
   * @property {number} bottom The global coordinates of the bottom edge.
   * @name geo.tile#bottom
   */
  Object.defineProperty(this, 'bottom', {
    get: function () {
      return this.size.y * (this.index.y + 1) + this.overlap.y;
    }
  });

  /**
   * Computes the global coordinates of the top edge.
   * @property {number} top The global coordinates of the top edge.
   * @name geo.tile#top
   */
  Object.defineProperty(this, 'top', {
    get: function () {
      return this.size.y * this.index.y - (this.index.y ? this.overlap.y : 0);
    }
  });

  /**
   * Computes the global coordinates of the left edge.
   * @property {number} left The global coordinates of the left edge.
   * @name geo.tile#left
   */
  Object.defineProperty(this, 'left', {
    get: function () {
      return this.size.x * this.index.x - (this.index.x ? this.overlap.x : 0);
    }
  });

  /**
   * Computes the global coordinates of the right edge.
   * @property {number} right The global coordinates of the right edge.
   * @name geo.tile#right
   */
  Object.defineProperty(this, 'right', {
    get: function () {
      return this.size.x * (this.index.x + 1) + this.overlap.x;
    }
  });

  /**
   * Set the opacity of the tile to 0 and gradually fade in over the given
   * number of milliseconds.  This is just a delay.
   *
   * @param {number} duration The duration of the animation in ms.
   * @returns {this}
   */
  this.fadeIn = function (duration) {
    $.noop(duration);
    return this;
  };
};

module.exports = tile;
