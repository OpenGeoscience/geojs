var $ = require('jquery');
var inherit = require('./inherit');
var tileLayer = require('./tileLayer');
var registry = require('./registry');
var quadFeature = require('./quadFeature');
var pixelmapFeature = require('./pixelmapFeature');

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
 * @param {geo.tileLayer.spec} [arg] Specification for the layer.
 */
var pixelmapLayer = function (arg) {

  var imageTile = require('./imageTile');

  if (!(this instanceof pixelmapLayer)) {
    return new pixelmapLayer(arg);
  }
  arg = arg || {};
  arg = $.extend(
    true,
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

    const pixelmapArgs = {quadFeature: m_this.features()[0]};
    if (arg.style) {
      pixelmapArgs.style = arg.style;
    }
    if (arg.color) {
      pixelmapArgs.color = arg.color;
    }
    m_pixelmapFeature = m_this.createFeature('pixelmap', pixelmapArgs);
    if (arg.data) {
      m_pixelmapFeature.data(arg.data);
    }
    m_this.style = m_pixelmapFeature.style;
    m_this.data = m_pixelmapFeature.data;
    const s_dataTimeModified = m_this.dataTime().modified;
    m_this.dataTime().modified = () => {
      m_pixelmapFeature.dataTime().modified();
      return s_dataTimeModified();
    };
    const s_modified = m_this.modified;
    m_this.modified = () => {
      m_pixelmapFeature.modified();
      return s_modified();
    };
    const s_geoOn = m_this.geoOn;
    const s_geoOff = m_this.geoOff;
    m_this.geoOn = (event, handler) => {
      m_pixelmapFeature.geoOn(event, handler);
      return s_geoOn(event, handler);
    };
    m_this.geoOff = (event, handler) => {
      m_pixelmapFeature.geoOff(event, handler);
      return s_geoOff(event, handler);
    };
    return m_this;
  };

  return m_this;
};

/**
 * This object contains the default options used to initialize the
 * pixelmapLayer.
 */
pixelmapLayer.defaults = $.extend({}, tileLayer.defaults, {
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
