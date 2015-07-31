/* global Promise */
(function () {
  'use strict';

  //////////////////////////////////////////////////////////////////////////////
  /**
   * This class defines a tile that is part of a standard "image pyramid", such
   * as an open street map tile set.  Every tile is uniquely indexed by a row,
   * column, and zoom level.  The number of rows/columns at zoom level z is
   * `2^z`, the number of pixels per tile is configurable.
   *
   * By default, this class assumes that images are fetch from the url, but
   * subclasses may define additional rendering steps to produce the images
   * before passing them off to the handlers.
   *
   * @class
   * @param {Object} spec The tile specification object
   *
   * @param {Object} spec.index The global position of the tile
   * @param {Number} spec.index.x The x-coordinate (usually the column number)
   * @param {Number} spec.index.y The y-coordinate (usually the row number)
   * @param {Number} spec.index.level The zoom level
   *
   * @param {Object?} spec.size The size of each tile
   * @param {Number} [spec.size.x=256] Width in pixels
   * @param {Number} [spec.size.y=256] Height in pixels
   *
   * @param {String} spec.url A url to the image
   * @param {String} [spec.crossDomain='anonymous'] Image CORS attribute
   *
   * @param {Object} spec.overlap The size of overlap with neighboring tiles
   * @param {Number} [spec.overlap.x=0]
   * @param {Number} [spec.overlap.y=0]
   */
  //////////////////////////////////////////////////////////////////////////////
  geo.imageTile = function (spec) {
    if (!(this instanceof geo.imageTile)) {
      return new geo.imageTile(spec);
    }

    spec.size = spec.size || {x: 256, y: 256};
    this._image = null;

    var index = spec.index;

    // Cache the coordinate scaling
    this._scale = Math.pow(2, spec.index.level);
    this._cors = spec.crossDomain || 'anonymous';

    // Check that the tile indices are valid at the given zoom level
    if (index.x < 0 || index.x >= this._scale ||
        index.y < 0 || index.y >= this._scale) {
      throw new Error('Invalid tile index provided.');
    }

    // Call superclass constructor
    return geo.tile.call(this, spec);
  };

  geo.imageTile.prototype = {
    /**
     * Initiate the image request.
     * @returns {this} Supports chained calling
     */
    fetch: function () {
      if (!this._image) {
        this._image = new Image();
        this._image.crossOrigin = this._cors;
        this._promise = new Promise(this._image.onload, this._image.onerror);
        this._image.src = this._url;
      }
      return this;
    },

    /**
     * Add a method to be called with the data when the ajax request is
     * successfully resolved.
     *
     * @param {function} method The success handler
     * @returns {this} Supports chained calling
     *
     */
    then: function (method) {
      return this.fetch()._promise.then(method.bind(this));
    },

    /**
     * Add a method to be called with the data when the ajax fails.
     *
     * @param {function} method The rejection handler
     * @returns {this} Supports chained calling
     *
     */
    'catch': function (method) {
      return this.fetch()._promise.catch(method.bind(this));
    }
  };

  inherit(geo.imageTile, geo.tile);
})();
