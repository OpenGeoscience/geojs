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

    // Cache the coordinate scaling
    this._cors = spec.crossDomain || 'anonymous';

    // Call superclass constructor
    geo.tile.call(this, spec);

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
     */
    this.fetch = function () {
      var defer;
      if (!this._image) {
        this._image = new Image(this.size.x, this.size.y);
        this._image.crossOrigin = this._cors;
        defer = new $.Deferred();
        this._image.onload = function () { defer.resolve(); };
        this._image.onerror = function () { defer.reject(); };
        this._image.src = this._url;

        // attach a promise interface to `this`
        defer.promise(this);
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
      var promise = this.fetch(), defer = new $.Deferred();
      $(this._image).css('display', 'none');
      promise.then(function () {
        $(this._image).fadeIn(duration, function () {
          defer.resolve();
        });
      }.bind(this));
      return defer.promise(this);
    };

    return this;
  };

  inherit(geo.imageTile, geo.tile);
})();
