(function () {
  'use strict';

  //////////////////////////////////////////////////////////////////////////////
  /**
   * This class defines the raw interface for a "tile" on a map.  A tile is
   * defined as a rectangular section of a map.  The base implementation
   * is independent of the actual content of the tile, but assumes that
   * the content is loaded asynchronously via a url.  The tile object
   * has a promise-like interface.  For example,
   *
   * tile.then(function (data) {...}).catch(function (data) {...});
   *
   * @class
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
  //////////////////////////////////////////////////////////////////////////////
  geo.tile = function (spec) {
    this._index = spec.index;
    this._size = spec.size;
    this._overlap = spec.overlap || {x: 0, y: 0};
    this._url = spec.url;
    this._jqXHR = null;
    return this;
  };
  geo.tile.prototype = {
    /**
     * Return the index coordinates.
     */
    get index() { return this._index; },

    /**
     * Return the tile sizes.
     */
    get size() { return this._size; },

    /**
     * Return the tile overlap sizes.
     */
    get overlap() { return this._overlap; },

    /**
     * Initiate the ajax request.
     * @returns {this} Supports chained calling
     */
    fetch: function () {
      if (!this._jqXHR) {
        this._jqXHR = $.ajax(this.url);
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
      return this.fetch()._jqXHR.success(method.bind(this));
    },

    /**
     * Add a method to be called with the data when the ajax fails.
     *
     * @param {function} method The rejection handler
     * @returns {this} Supports chained calling
     *
     */
    'catch': function (method) {
      return this.fetch()._jqXHR.fail(method.bind(this));
    },

    /**
     * Computes the global coordinates of the bottom left corner relative to
     * some given offset.  The offset can be provided to handle precision loss
     * due to global dimensions as commonly occurs in pyramid tiling schemes.
     *
     * @param {Object?} offset The index to compute the coordinates relative to
     * @param {Number} [offset.x=0]
     * @param {Number} [offset.y=0]
     * @returns {Object}
     */
    bottomLeft: function (offset) {
      offset = offset || {};
      var x = this.index.x - (offset.x || 0),
          y = this.index.y - (offset.y || 0);
      return {
        x: this.size.x * x - this.overlap.x,
        y: this.size.y * y - this.overlap.y
      };
    },

    /**
     * Computes the global coordinates of the top right corner relative to
     * some given offset.  The offset can be provided to handle precision loss
     * due to global dimensions as commonly occurs in pyramid tiling schemes.
     *
     * @param {Object?} offset The index to compute the coordinates relative to
     * @param {Number} [offset.x=0]
     * @param {Number} [offset.y=0]
     * @returns {Object}
     */
    topRight: function (offset) {
      offset = offset || {};
      var x = this.index.x - (offset.x || 0) + 1,
          y = this.index.y - (offset.y || 0) + 1;
      return {
        x: this.size.x * x + this.overlap.x,
        y: this.size.y * y + this.overlap.y
      };
    }
  };
})();
