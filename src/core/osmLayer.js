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
    this._getTile = function (index) {
      return geo.imageTile({
        index: index,
        size: {x: this._options.tileWidth, y: this._options.tileHeight},
        url: this._options.url(index)
      });
    };

    /**
     * Returns content that will be inserted in place of a tile that has
     * failed to load.
     * @protected
     * @param {Object} index The tile's index
     * @returns {string|DOM} The html content to insert onto the page
     */
    this._errorTile = function (/* index */) {
      return [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 255 255"',
        ' width="' + this.options.tileWidth + 'px"',
        ' height="' + this.options.tileHeight + '256px">',
        '<rect style="stroke:black;stroke-width:1;fill:none" x="1" y="1"',
        ' width="252" height="252"/>',
        '<g style="fill-opacity:0.5;stroke-linecap:round">',
        '<rect style="stroke:grey;stroke-width:3px;fill:#ffffff;" height="200"',
        ' width="200" y="25" x="25"/>',
        '<line x1="76" x2="178" y1="76" y2="178"',
        ' style="stroke:#ff0000;stroke-width:5px"/>',
        '<line x2="76" x1="178" y1="76" y2="178"',
        ' style="stroke:#ff0000;stroke-width:5px"/>',
        '</g></svg>'
      ].join('');
    };

    /**
     * Returns content that will be inserted in place of a tile with
     * invalid indices.
     * @protected
     * @param {Object} index The tile's index
     * @returns {string|DOM} The html content to insert onto the page
     */
    this._invalidTile = function (/* index */) {
      return [
        '<div style="width: ' + this.options.tileWidth + 'px;',
        'height:"' + this.options.tileHeight + 'px"></div>'
      ];
    };
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
    url: function (index) {
      return 'http://tile.openstreetmap.org/' +
        index.level + '/' + index.x + '/' + index.y + '.png';
    },
    attribution: 'Tile data &copy; <a href="http://osm.org/copyright">' +
      'OpenStreetMap</a> contributors'
  });

  inherit(geo.osmLayer, geo.tileLayer);

  geo.registerLayer('osm', geo.osmLayer);
})();
