(function () {
  'use strict';

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Create a new instance of osmLayer
   *
   * @class
   * @extends geo.featureLayer
   *
   * @param {Object} arg - arg can contain following keys: baseUrl,
   *        imageFormat (such as png or jpeg), and displayLast
   *        (to decide whether or not render tiles from last zoom level).
   */
  //////////////////////////////////////////////////////////////////////////////
  geo.osmLayer = function (arg) {

    if (!(this instanceof geo.osmLayer)) {
      return new geo.osmLayer(arg);
    }
    geo.tileLayer.call(this, arg);

    return this;
  };

  geo.osmLayer.prototype  = {
    /**
     * Returns an instantiated imageTile object with the given indices.  This
     * method always returns a new tile object.  Use `_getTileCached`
     * to use the caching layer.
     * @param {Object} index The tile index
     * @param {Number} index.x
     * @param {Number} index.y
     * @param {Number} index.level
     * @returns {geo.tile}
     */
    _getTile: function (index) {
      return geo.imageTile({
        index: index,
        size: {x: this._options.tileWidth, y: this._options.tileHeight},
        url: this._options.url(index)
      });
    }
  };

  /**
   * This object contains the default options used to initialize the osmLayer.
   */
  geo.osmLayer.defaults = $.extend({}, geo.tileLayer.defaults, {
    minLevel: 0,
    maxLevel: 18,
    tileOverlap: 0,
    tileWidth: 256,
    tileHeight: 256,
    wrapX: true,
    wrapY: false,
    url: null
  });

  inherit(geo.osmLayer, geo.tileLayer);

  geo.registerLayer('osm', geo.osmLayer);
})();
