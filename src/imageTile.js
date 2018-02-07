var inherit = require('./inherit');
var tile = require('./tile');

module.exports = (function () {
  'use strict';

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
   * @class geo.imageTile
   * @param {object} spec The tile specification object
   *
   * @param {object} spec.index The global position of the tile
   * @param {number} spec.index.x The x-coordinate (usually the column number)
   * @param {number} spec.index.y The y-coordinate (usually the row number)
   * @param {number} spec.index.level The zoom level
   *
   * @param {object?} spec.size The size of each tile
   * @param {number} [spec.size.x=256] Width in pixels
   * @param {number} [spec.size.y=256] Height in pixels
   *
   * @param {string} spec.url A url to the image
   * @param {string} [spec.crossDomain='anonymous'] Image CORS attribute
   *
   * @param {object} spec.overlap The size of overlap with neighboring tiles
   * @param {number} [spec.overlap.x=0]
   * @param {number} [spec.overlap.y=0]
   */
  var imageTile = function (spec) {
    if (!(this instanceof imageTile)) {
      return new imageTile(spec);
    }

    var $ = require('jquery');

    spec.size = spec.size || {x: 256, y: 256};
    this._image = null;

    this._cors = (spec.crossDomain || spec.crossDomain === null) ? spec.crossDomain : 'anonymous';

    // Call superclass constructor
    tile.call(this, spec);

    /**
     * Read only accessor to the Image object used by the
     * tile.  Note, this method does not gaurantee that the
     * image data is available.  Use the promise interface
     * to add asyncronous handlers.
     * @returns {Image}
     */
    Object.defineProperty(this, 'image', {
      get: function () { return this._image; }
    });

    /**
     * Initiate the image request.
     *
     * @returns {this} The current tile class instance.
     */
    this.fetch = function () {
      var defer;
      if (!this._image) {
        this._image = new Image(this.size.x, this.size.y);
        // Only set the crossOrigin parameter if this is going across origins.
        if (this._cors && this._url.indexOf(':') >= 0 &&
            this._url.indexOf('/') === this._url.indexOf(':') + 1) {
          this._image.crossOrigin = this._cors;
        }
        defer = $.Deferred();
        this._image.onload = defer.resolve;
        this._image.onerror = defer.reject;
        this._image.src = this._url;

        // attach a promise interface to `this`
        defer.done(function () {
          this._fetched = true;
        }.bind(this)).promise(this);
      }
      return this;
    };

    /**
     * Set the opacity of the tile to 0 and gradually fade in
     * over the given number of milliseconds.  This will also
     * resolve the embedded promise interface.
     * @param {number} duration the duration of the animation in ms
     * @returns {this} chainable
     */
    this.fadeIn = function (duration) {
      var promise = this.fetch(), defer = $.Deferred();
      $(this._image).css('display', 'none');
      promise.done(function () {
        $(this._image).fadeIn(duration, function () {
          defer.resolve();
        });
      }.bind(this));
      return defer.promise(this);
    };

    return this;
  };

  inherit(imageTile, tile);
  return imageTile;
})();
