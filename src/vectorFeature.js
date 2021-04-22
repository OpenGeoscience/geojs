var inherit = require('./inherit');
var feature = require('./feature');

/**
 * Object specification for a graph feature.
 *
 * @typedef {geo.feature.spec} geo.vectorFeature.spec
 * @extends geo.feature.spec
 * @property {geo.vectorFeature.styleSpec} [style] Style object with default
 *   style options.
 * @property {function|object} [origin={x: 0, y: 0, z: 0}] Origin accessor.
 */

/**
 * Style specification for a vector feature.
 *
 * @typedef {geo.feature.styleSpec} geo.vectorFeature.styleSpec
 * @extends geo.feature.styleSpec
 * @property {geo.geoColor|function} [strokeColor] Color to stroke each vector.
 * @property {number|function} [strokeOpacity] Opacity for each vector.
 *   Opacity is on a [0-1] scale.
 * @property {number|function} [strokeWidth] The weight of the vector stroke in
 *   pixels.
 * @property {string|function} [originStyle='none'] The style at the origin of
 *   the vector.  One of the marker styles or `'none'`.  Marker styles are
 *   usually `'arrow'`, `'point'`, `'bar'`, and `'wedge'`.
 * @property {string|function} [endStyle='arrow'] The style at the far end of
 *   the vector.  One of the marker styles or `'none'`.  Marker styles are
 *   usually `'arrow'`, `'point'`, `'bar'`, and `'wedge'`.
 * @property {geo.geoPosition|function} [origin={x: 0, y: 0, z: 0}] The origin
 *   of the vector.  One end of the vector will be at this point.
 * @property {geo.geoPosition|function} [delta] The direction that the vector
 *   points in.  The length of the vector is dependant on this and the `scale`.
 * @property {number|function} [scale] The size of the vector relative to the
 *   delta.  If `null`, `undefined`, or `0`, this is `75 / <maximum length of
 *   any delta in x-y space>`.
 */

/**
 * Create a new instance of class vectorFeature.
 *
 * @class
 * @alias geo.vectorFeature
 * @extends geo.feature
 * @param {geo.vectorFeature.spec} arg Feature options.
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
      s_init = this._init;

  this.featureType = 'vector';

  /**
   * Get or set the accessor for the origin of the vector.  This is the point
   * that the vector starts.
   *
   * @param {geo.geoPosition|function} [val] The new origin if specified.  If
   *   not specified, return the current origin.
   * @returns {geo.geoPosition|function|this} Either the current origin or
   *   this feature.
   */
  this.origin = function (val) {
    if (val === undefined) {
      return m_this.style('origin');
    } else {
      m_this.style('origin', val);
      m_this.dataTime().modified();
    }
    return m_this;
  };

  /**
   * Get or set the accessor for the displacement (coordinates) of the vector.
   * This is the direction of the vector.
   *
   * @param {geo.geoPosition|function} [val] The new delta if specified.  If
   *   not specified, return the current delta.
   * @returns {geo.geoPosition|function|this} Either the current delta or this
   *   feature.
   */
  this.delta = function (val) {
    if (val === undefined) {
      return m_this.style('delta');
    } else {
      m_this.style('delta', val);
      m_this.dataTime().modified();
    }
    return m_this;
  };

  /**
   * Initialize.
   *
   * @param {geo.vectorFeature.spec} arg The feature specification.
   * @returns {this}
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
    return m_this;
  };
};

inherit(vectorFeature, feature);
module.exports = vectorFeature;
