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
 * @property {string} [source] If specified, use the predefined tile source
 *   (see {@link geo.osmLayer.tileSources}).
 * @property {string} [crossDomain='anonymous'] Image CORS attribute.  This is
 *   used for the `crossorigin` property when loading images.
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
  arg = arg || {};
  if (arg.mapOpacity !== undefined && arg.opacity === undefined) {
    arg = $.extend({}, arg);
    arg.opacity = arg.mapOpacity;
  }
  arg = $.extend(
    true,
    {},
    this.constructor.defaults,
    osmLayer.tileSources[this.constructor.defaults.source] || {},
    osmLayer.tileSources[arg.source] || {},
    // don't name the layer based on the source
    {name: ''},
    arg);
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
      for (const key in osmLayer.tileSources) {
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
  source: 'stamen-toner-lite'
});

/* Stamen's website (http://maps.stamen.com) as of 2019-08-28 says that the
 * maps they host may be used free of charge.  For http access, use a url like
 * http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png */
const StamenAttribution = 'Map tiles by <a href="http://stamen.com">Stamen ' +
  'Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">' +
  'CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap' +
  '</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.';

/* Per Carto's website regarding basemap attribution: https://carto.com/help/working-with-data/attribution/#basemaps */
const CartoAttribution = '<a href="https://carto.com"> Carto</a> ' + 'Contributors <a href="https://www.openstreetmap.org/"> OpenStreetMap</a>';

/**
 * This is a list of known tile sources.  It can be added to via
 * `geo.osmLayer.tilesource[<key>] = <object>`, where the object has `url`,
 * `attribution`, `subdomains`, `minLevel`, and `maxLevel` defined.
 *
 * @type {object}
 */
osmLayer.tileSources = {
  'dark-matter-with-labels': {
    url: ' https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
    attribution: CartoAttribution,
    name: 'Carto Dark Matter With Labels',
    minLevel: 0,
    maxLevel: 18
  },
  'dark-matter-without-labels': {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png',
    attribution: CartoAttribution,
    name: 'Carto Dark Matter Without Labels',
    minLevel: 0,
    maxLevel: 18
  },
  'nationalmap-satellite': {
    url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tile data from <a href="https://basemap.nationalmap.gov/">USGS</a>',
    name:'National Map Satellite',
    minLevel: 0,
    maxLevel: 16
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: 'Tile data &copy; <a href="https://osm.org/copyright">' +
      'OpenStreetMap</a> contributors',
    name:'OpenStreetMap',
    subdomains: 'abc',
    minLevel: 0,
    maxLevel: 19
  },
  'positron-with-labels': {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png',
    attribution: CartoAttribution,
    name:'Carto Positron With Labels',
    minLevel: 0,
    maxLevel: 18
  },
  'positron-without-labels': {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/light_nolabels/{z}/{x}/{y}.png',
    attribution: CartoAttribution,
    name:'Carto Positron Without Labels',
    minLevel: 0,
    maxLevel: 18
  },
  'stamen-terrain': {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png',
    attribution: StamenAttribution,
    name:'Stamen Terrain',
    subdomains: 'abcd',
    minLevel: 0,
    maxLevel: 14
  },
  'stamen-terrain-background': {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain-background/{z}/{x}/{y}.png',
    attribution: StamenAttribution,
    name:'Stamen Terrain Background',
    subdomains: 'abcd',
    minLevel: 0,
    maxLevel: 14
  },
  'stamen-toner': {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
    attribution: StamenAttribution,
    name:'Stamen Toner',
    subdomains: 'abcd',
    minLevel: 0,
    maxLevel: 20
  },
  'stamen-toner-lite': {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png',
    attribution: StamenAttribution,
    name:'Stamen Toner Lite',
    subdomains: 'abcd',
    minLevel: 0,
    maxLevel: 20
  },
  'voyager-with-labels': {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}.png',
    attribution: CartoAttribution,
    name:'Carto Voyager With Labels',
    minLevel: 0,
    maxLevel: 18
  },
  'voyager-without-labels': {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png',
    attribution: CartoAttribution,
    name:'Carto Voyager Without Labels',
    minLevel: 0,
    maxLevel: 18
  }
};

inherit(osmLayer, tileLayer);
/* By default, ask to support image quads.  If the user needs full
 * reprojection, they will need to require the
 * quadFeature.capabilities.imageFull feature */
registry.registerLayer('osm', osmLayer, [quadFeature.capabilities.image]);

module.exports = osmLayer;
