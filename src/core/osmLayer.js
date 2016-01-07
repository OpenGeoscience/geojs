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
    if (arg.mapOpacity !== undefined && arg.opacity === undefined) {
      arg.opacity = arg.mapOpacity;
    }
    geo.tileLayer.call(this, arg);

    /* mapOpacity is just another name for the layer opacity. */
    this.mapOpacity = this.opacity;

    /**
     * Returns an instantiated imageTile object with the given indices.  This
     * method always returns a new tile object.  Use `_getTileCached`
     * to use the caching layer.
     * @param {Object} index The tile index
     * @param {Number} index.x
     * @param {Number} index.y
     * @param {Number} index.level
     * @param {Object} source The tile index used for constructing the url
     * @param {Number} source.x
     * @param {Number} source.y
     * @param {Number} source.level
     * @returns {geo.tile}
     */
    this._getTile = function (index, source) {
      var urlParams = source || index;
      return geo.imageTile({
        index: index,
        size: {x: this._options.tileWidth, y: this._options.tileHeight},
        queue: this._queue,
        url: this._options.url(urlParams.x, urlParams.y, urlParams.level || 0,
                               this._options.subdomains)
      });
    }.bind(this);
  };

  // Compute the circumference of the earth / 2 in meters for osm layer image bounds
  var cEarth = Math.PI * geo.util.radiusEarth;

  /**
   * This object contains the default options used to initialize the osmLayer.
   */
  geo.osmLayer.defaults = $.extend({}, geo.tileLayer.defaults, {
    minX: -cEarth,
    maxX: cEarth,
    minY: -cEarth,
    maxY: cEarth,
    minLevel: 0,
    maxLevel: 18,
    tileOverlap: 0,
    tileWidth: 256,
    tileHeight: 256,
    tileOffset : function (level) {
      var s = Math.pow(2, level - 1) * 256;
      return {x: s, y: s};
    },
    wrapX: true,
    wrapY: false,
    url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: 'Tile data &copy; <a href="http://osm.org/copyright">' +
      'OpenStreetMap</a> contributors'
  });

  inherit(geo.osmLayer, geo.tileLayer);

  geo.registerLayer('osm', geo.osmLayer);
})();
