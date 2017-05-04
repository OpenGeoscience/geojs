var inherit = require('./inherit');
var tile = require('./tile');

module.exports = (function () {
  'use strict';
  var vactorTile = function (spec) {
    if (!(this instanceof vactorTile)) {
      return new vactorTile(spec);
    }

    var $ = require('jquery');

    spec.size = spec.size || {x: 256, y: 256};
    this._image = null;

    // Cache the coordinate scaling
    this._cors = spec.crossDomain || 'anonymous';

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
     */
    this.fetch = function () {
      var defer;
      if (!this._image) {
        this._image = new Image(this.size.x, this.size.y);
        // Only set the crossOrigin parameter if this is going across origins.
        if (this._url.indexOf(':') >= 0 &&
            this._url.indexOf('/') === this._url.indexOf(':') + 1) {
          this._image.crossOrigin = this._cors;
        }
        defer = new $.Deferred();
        this._image.onload = defer.resolve;
        this._image.onerror = defer.reject;
        this._image.src = this._url;

        // attach a promise interface to `this`
        defer.then(function () {
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

  inherit(vactorTile, tile);
  return vactorTile;
})();
