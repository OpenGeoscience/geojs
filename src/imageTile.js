var inherit = require('./inherit');
var tile = require('./tile');

/**
 * @typedef {geo.tile.spec} geo.imageTile.spec
 * @extends {geo.tile.spec}
 * @property {object} index The global position of the tile.
 * @property {number} index.x The x-coordinate (the column number).
 * @property {number} index.y The y-coordinate (the row number).
 * @property {number} index.level The zoom level.
 * @property {object} [size] The size of each tile.
 * @property {number} [size.x=256] Width in pixels.
 * @property {number} [size.y=256] Height in pixels.
 * @property {string} [crossDomain='anonymous'] Image CORS attribute.
 */

/**
 * This class defines a tile that is part of a standard "image pyramid", such
 * as an open street map tile set.  Every tile is uniquely indexed by a row,
 * column, and zoom level.  The number of rows/columns at zoom level z is
 * `2^z`, the number of pixels per tile is configurable.
 *
 * By default, this class assumes that images are fetched from the url, but
 * subclasses may define additional rendering steps to produce the images
 * before passing them off to the handlers.
 *
 * @class
 * @alias geo.imageTile
 * @extends geo.tile
 * @param {geo.imageTile.spec} spec The tile specification.
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
   * Read only accessor to the Image object used by the tile.  Note, this
   * method does not guarantee that the image data is available.  Use the
   * promise interface to add asynchronous handlers.
   *
   * @property {Image} image The image object used by the tile.
   * @name geo.imageTile#image
   */
  Object.defineProperty(this, 'image', {
    get: function () { return this._image; }
  });

  /**
   * Initiate the image request.
   *
   * @returns {this}
   */
  this.fetch = function () {
    var defer;
    if (!this._image) {
      this._image = new Image(this.right - this.left, this.bottom - this.top);
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
   * Set the opacity of the tile to 0 and gradually fade in over the given
   * number of milliseconds.  This will also resolve the embedded promise
   * interface.
   *
   * @param {number} duration The duration of the animation in ms.
   * @returns {this}
   */
  this.fadeIn = function (duration) {
    var promise = this.fetch(),
        defer = $.Deferred();
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

module.exports = imageTile;
