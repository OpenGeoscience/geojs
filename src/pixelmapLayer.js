var inherit = require('./inherit');
var tileLayer = require('./tileLayer');
var registry = require('./registry');
var quadFeature = require('./quadFeature');
var pixelmapFeature = require('./pixelmapFeature');
var util = require('./util');

/**
 * Object specification for a pixelmap layer.
 *
 * @typedef {geo.tileLayer.spec} geo.pixelmapLayer.spec
 * @extends {geo.tileLayer.spec}
 * @property {geo.geoColor|function} [color] The color that should be used
 *   for each data element.  Data elements correspond to the indices in the
 *   pixel map. If an index is larger than the number of data elements, it will
 *   be transparent.  If there is more data than there are indices, it is
 *   ignored.
 * @property {object} [style] An optional style object that could contain
 *   `color` or other style values.
 * @property {array} [data] A new data array.
 * @property {string} [crossDomain='anonymous'] Image CORS attribute.  This is
 *   used for the `crossorigin` property when loading images.
 */

/**
 * Create a new instance of pixelmapLayer.  This is a {@link geo.tileLayer} with
 * an OSM url and attribution defaults and with the tiles centered on the
 * origin.
 *
 * @class
 * @alias geo.pixelmapLayer
 * @extends geo.tileLayer
 *
 * @param {geo.pixelmapLayer.spec} [arg] Specification for the layer.
 */
var pixelmapLayer = function (arg) {

  var imageTile = require('./imageTile');

  if (!(this instanceof pixelmapLayer)) {
    return new pixelmapLayer(arg);
  }
  arg = arg || {};
  /* Don't extend data from args -- it can be very slow */
  let argdata;
  if (arg.data) {
    argdata = arg.data;
    delete arg.data;
  }
  arg = util.deepMerge(
    {},
    this.constructor.defaults,
    arg);
  tileLayer.call(this, arg);

  var s_init = this._init,
      m_pixelmapFeature,
      m_this = this;

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
   * Initialize.
   *
   * @returns {this} The current layer.
   */
  this._init = function () {
    // Call super class init
    s_init.apply(m_this, arguments);
    m_this.nearestPixel(true, true);

    const pixelmapArgs = {quadFeature: m_this.features()[0]};
    if (arg.style) {
      pixelmapArgs.style = arg.style;
    }
    if (arg.color) {
      pixelmapArgs.color = arg.color;
    }
    m_pixelmapFeature = m_this.createFeature('pixelmap', pixelmapArgs);
    if (argdata) {
      m_pixelmapFeature.data(argdata);
    }
    m_this.style = m_pixelmapFeature.style;
    m_this.data = m_pixelmapFeature.data;
    m_this.indexModified = m_pixelmapFeature.indexModified;
    const s_dataTimeModified = m_this.dataTime().modified;
    m_this.dataTime().modified = () => {
      m_pixelmapFeature.dataTime().modified();
      return s_dataTimeModified();
    };
    ['modified', 'geoOn', 'geoOff', 'geoOnce'].forEach((funcName) => {
      const superFunc = m_this[funcName];
      m_this[funcName] = function () {
        if (!Array.isArray(arguments[0])) {
          m_pixelmapFeature[funcName].apply(this, arguments);
        }
        return superFunc.apply(this, arguments);
      };
    });
    return m_this;
  };

  return m_this;
};

/**
 * This object contains the default options used to initialize the
 * pixelmapLayer.
 */
pixelmapLayer.defaults = Object.assign({}, tileLayer.defaults, {
  features: [quadFeature.capabilities.image, pixelmapFeature.capabilities.lookup],
  tileOffset : function (level) {
    var s = Math.pow(2, level - 1) * 256;
    return {x: s, y: s};
  },
  url: ''
});

inherit(pixelmapLayer, tileLayer);
/* By default, ask to support image quads.  If the user needs full
 * reprojection, they will need to require the
 * quadFeature.capabilities.imageFull feature */
registry.registerLayer('pixelmap', pixelmapLayer, [quadFeature.capabilities.image]);

module.exports = pixelmapLayer;
