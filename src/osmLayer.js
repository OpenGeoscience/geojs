var $ = require('jquery');
var inherit = require('./inherit');
var tileLayer = require('./tileLayer');
var registry = require('./registry');
var quadFeature = require('./quadFeature');

/**
 * Object specification for an OSM layer.
 *
 * @typedef {geo.tileLayer.spec} geo.osmLayer.spec
 * @extends {geo.tileLayer.spec}
 * @property {number} [mapOpacity] If specified, and `opacity` is not
 *   specified, use this as the layer opacity.
 * @property {string} [source] If specified and neither `url` nore `baseUrl`
 *   are specified, use the predefined tile source (see
 *   {@link geo.osmLayer.tileSources}).
 */

/**
 * Create a new instance of osmLayer.  This is a {@link geo.tileLayer} with
 * an OSM url and attribution defaults and with the tiles centered on the
 * origin.
 *
 * @class
 * @alias geo.osmLayer
 * @extends geo.tileLayer
 *
 * @param {geo.osmLayer.spec} [arg] Specification for the layer.
 */
var osmLayer = function (arg) {

  var imageTile = require('./imageTile');

  if (!(this instanceof osmLayer)) {
    return new osmLayer(arg);
  }
  if (arg.mapOpacity !== undefined && arg.opacity === undefined) {
    arg.opacity = arg.mapOpacity;
  }
  arg = $.extend(true, {}, this.constructor.defaults, arg || {});
  if (arg.source && !arg.url && !arg.baseUrl) {
    // if a source is used, it will override user-specified values for any of
    // its defined fields (attribution, minLevel, maxLevel, subdomains).
    $.extend(arg, osmLayer.tileSources[arg.source]);
  }
  tileLayer.call(this, arg);

  var m_this = this;

  /* mapOpacity is just another name for the layer opacity. */
  this.mapOpacity = this.opacity;

  /**
   * Returns an instantiated imageTile object with the given indices.  This
   * method always returns a new tile object.  Use `_getTileCached` to use
   * the caching layer.
   *
   * @param {object} index The tile index.
   * @param {number} index.x
   * @param {number} index.y
   * @param {number} index.level
   * @param {object} source The tile index used for constructing the url.
   * @param {number} source.x
   * @param {number} source.y
   * @param {number} source.level
   * @returns {geo.tile}
   */
  this._getTile = function (index, source) {
    var urlParams = source || index;
    return imageTile({
      index: index,
      size: {x: m_this._options.tileWidth, y: m_this._options.tileHeight},
      queue: m_this._queue,
      overlap: m_this._options.tileOverlap,
      scale: m_this._options.tileScale,
      url: m_this._options.url.call(
        m_this, urlParams.x, urlParams.y, urlParams.level || 0,
        m_this._options.subdomains),
      crossDomain: m_this._options.crossDomain
    });
  };

  /**
   * Get or set a defined tile source.  Tile sources are defined in
   *  {@link geo.osmLayer.tileSources}.
   *
   * @param {string} [source] The name of a defined tile source or `undefined`
   *    get the current named tile source, if any.
   * @returns {string|undefined|this} Either the name of the current tile
   *    source, if any.  Returns `this` when setting the source.
   */
  this.source = function (source) {
    if (source === undefined) {
      for (let key in osmLayer.tileSources) {
        if (osmLayer.tileSources[key].url === m_this.url()) {
          return key;
        }
      }
      return;
    }
    if (osmLayer.tileSources[source]) {
      m_this.url(osmLayer.tileSources[source].url);
      m_this.subdomains(osmLayer.tileSources[source].subdomains || 'abc');
      m_this.attribution(osmLayer.tileSources[source].attribution || '');
      m_this._options.maxLevel = osmLayer.tileSources[source].maxLevel || 18;
      m_this._options.minLevel = osmLayer.tileSources[source].minLevel || 0;
    }
    return m_this;
  };
};

/**
 * This object contains the default options used to initialize the osmLayer.
 */
osmLayer.defaults = $.extend({}, tileLayer.defaults, {
  tileOffset : function (level) {
    var s = Math.pow(2, level - 1) * 256;
    return {x: s, y: s};
  },
  url: '',
  source: 'osm'
});

/**
 * This is a list of known tile sources.  It can be added to via
 * `geo.osmLayer.tilesource[<key>] = <object>`, where the object has `url`,
 * `attribution`, `subdomains`, `minLevel`, and `maxLevel` defined.
 *
 * @type {object}
 */
osmLayer.tileSources = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: 'Tile data &copy; <a href="https://osm.org/copyright">' +
      'OpenStreetMap</a> contributors',
    subdomains: 'abc',
    minLevel: 0,
    maxLevel: 19
  },
  'stamen-toner-lite': {
    url: 'http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png',
    attribution: 'Tile design &copy; <a href="https://stamen.com">' +
      'Stamen Design</a>.  Tile data &copy; ' +
      '<a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minLevel: 0,
    maxLevel: 20
  }
};

inherit(osmLayer, tileLayer);
/* By default, ask to support image quads.  If the user needs full
 * reprojection, they will need to require the
 * quadFeature.capabilities.imageFull feature */
registry.registerLayer('osm', osmLayer, [quadFeature.capabilities.image]);

module.exports = osmLayer;
