var inherit = require('./inherit');
var feature = require('./feature');

/**
 * Create a new instance of class vectorFeature
 *
 * @class geo.vectorFeature
 * @extends geo.feature
 * @returns {geo.vectorFeature}
 */
var vectorFeature = function (arg) {
  'use strict';
  if (!(this instanceof vectorFeature)) {
    return new vectorFeature(arg);
  }

  var $ = require('jquery');

  arg = arg || {};
  feature.call(this, arg);

  /**
   * @private
   */
  var m_this = this,
      s_init = this._init,
      s_style = this.style;

  /**
   * Get or set the accessor for the origin of the vector.  This is the point
   * that the vector base resides at.  Defaults to (0, 0, 0).
   * @param {geo.accessor|geo.geoPosition} [accessor] The origin accessor
   */
  this.origin = function (val) {
    if (val === undefined) {
      return s_style('origin');
    } else {
      s_style('origin', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Get or set the accessor for the displacement (coordinates) of the vector.
   * @param {geo.accessor|geo.geoPosition} [accessor] The accessor
   */
  this.delta = function (val) {
    if (val === undefined) {
      return s_style('delta');
    } else {
      s_style('delta', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Initialize
   * @protected
   */
  this._init = function (arg) {
    s_init.call(m_this, arg);

    var defaultStyle = $.extend(
      {},
      {
        strokeColor: 'black',
        strokeWidth: 2.0,
        strokeOpacity: 1.0,
        originStyle: 'none',
        endStyle: 'arrow',
        origin: {x: 0, y: 0, z: 0},
        delta: function (d) { return d; },
        scale: null // size scaling factor (null -> renderer decides)
      },
      arg.style === undefined ? {} : arg.style
    );

    if (arg.origin !== undefined) {
      defaultStyle.origin = arg.origin;
    }

    m_this.style(defaultStyle);
    m_this.dataTime().modified();
  };
};

inherit(vectorFeature, feature);
module.exports = vectorFeature;
