(function () {
  'use strict';

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
   * coordinate system.
   *
   * @class
   * @extends geo.featureLayer
   * @param {Object?} options
   * @param {Number} [options.minLevel=0]    The minimum zoom level available
   * @param {Number} [options.maxLevel=18]   The maximum zoom level available
   * @param {Number} [options.tileOverlap=0] Number of pixels of overlap between tiles
   * @param {Number} [options.tileWidth=256] The tile width as displayed without overlap
   * @param {Number} [options.tileHeigh=256] The tile height as displayed without overlap
   * @param {function} [options.url=null]
   *   A function taking the current tile indices and returning a URL or jquery
   *   ajax config to be passed to the {geo.tile} constructor.
   *   Example:
   *     (x, y, z) => "http://example.com/z/y/x.png"
   * @returns {geo.tileLayer}
   */
  //////////////////////////////////////////////////////////////////////////////
  geo.tileLayer = function (options) {
    var opt;

    if (!(this instanceof geo.tileLayer)) {
      return new geo.tileLayer(options);
    }
    geo.featureLayer.call(this, options);
    $.extend(options || {}, geo.tileLayer.defaults);

    // store options in protected `_optionName` properties
    for (opt in geo.tileLayer.defaults) { // jshint ignore: line
      this['_' + opt] = options[opt];
    }
    return this;
  };

  geo.tileLayer.prototype = {
    /**
     * Readonly accessor to the minimum zoom level
     */
    get minLevel() {
      return this._minLevel;
    },

    /**
     * Readonly accessor to the maximum zoom level
     */
    get maxLevel() {
      return this._maxLevel;
    },

    /**
     * Readonly accessor to the overlap width between tiles
     */
    get tileOverlap() {
      return this._tileOverlap;
    },

    /**
     * Readonly accessor to the tile width in pixels
     */
    get tileWidth() {
      return this._tileWidth;
    },

    /**
     * Readonly accessor to the tile height in pixels
     */
    get tileHeight() {
      return this._tileHeight;
    },

    /**
     * Readonly accessor to the URL formatting method.
     */
    get url() {
      return this._url;
    },

    /**
     * Tile scaling factor relative to zoom level 0.
     * The default implementation just returns a memoized
     * version of `1 / Math.pow(2, z - 1)`.
     * @param {Number} level A zoom level
     * @returns {Number} The size of a pixel at level z relative to level 0
     */
    scaleAtZoom: function (level) {
      var scale = [], i;
      for (i = 0; i < this.maxLevel; i += 1) {
        scale.push[i] = 1 / Math.pow(2, i - 1);
      }
      this.scaleAtZoom = function (z) {
        return scale[z];
      };
      return this.scaleAtZoom(level);
    },

    /**
     * Computes the bounds for the given tile in the map's coordinate system.
     */
    tileBounds: function (x, y, level) {
    },

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
    url: null,
    minX: -180,
    maxX: 180,
    minY: 
  };

  inherit(geo.tileLayer, geo.featureLayer);
})();
