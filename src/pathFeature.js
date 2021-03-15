var $ = require('jquery');
var inherit = require('./inherit');
var feature = require('./feature');

/**
 * Specification for pathFeature.
 *
 * @typedef {geo.feature.spec} geo.pathFeature.spec
 * @extends {geo.feature.spec}
 * @property {geo.geoPosition|function} [position] Position of the data.
 *   Default is (data).
 */

/**
 * Style specification for a path feature.
 *
 * The style for components of the stroke are passed `(dataElement,
 * dataIndex)`, where the result applies to the stroke between that data
 * element and the following element (at index `dataIndex + `).
 *
 * @typedef {geo.feature.styleSpec} geo.pathFeature.styleSpec
 * @extends geo.feature.styleSpec
 * @property {boolean|function} [stroke=true] True to stroke the path.
 * @property {geo.geoColor|function} [strokeColor='white'] Color to stroke each
 *   path.
 * @property {number|function} [strokeOpacity=1] Opacity for each path's
 *   stroke.  Opacity is on a [0-1] scale.
 * @property {number|function} [strokeWidth=1] The weight of the path's stroke
 *   in pixels.
 */

/**
 * Create a new instance of class pathFeature.
 *
 * @class
 * @alias geo.pathFeature
 * @extends geo.feature
 * @param {geo.pathFeature.spec} arg
 * @returns {geo.pathFeature}
 */
var pathFeature = function (arg) {
  'use strict';
  if (!(this instanceof pathFeature)) {
    return new pathFeature(arg);
  }
  arg = arg || {};
  feature.call(this, arg);

  var m_this = this,
      s_init = this._init;

  this.featureType = 'path';

  /**
   * Get/Set position.
   *
   * @param {function|geo.geoPosition} [val] If not specified, return the
   *    position accessor.  Otherwise, change the position accessor.
   * @returns {this|function}
   */
  this.position = function (val) {
    if (val === undefined) {
      return m_this.style('position');
    }
    if (val !== m_this.style('position')) {
      m_this.style('position', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Initialize.
   *
   * @param {geo.pathFeature.spec} arg The feature specification.
   * @returns {this}
   */
  this._init = function (arg) {
    s_init.call(m_this, arg);

    var defaultStyle = $.extend(
      {},
      {
        strokeWidth: 1,
        strokeColor: {r: 1.0, g: 1.0, b: 1.0},
        position: (d) => Array.isArray(d) ? {x: d[0], y: d[1], z: d[2] || 0} : d
      },
      arg.style === undefined ? {} : arg.style
    );

    if (arg.position !== undefined) {
      defaultStyle.position = arg.position;
    }
    m_this.style(defaultStyle);
    if (defaultStyle.position) {
      m_this.position(defaultStyle.position);
    }
    m_this.dataTime().modified();
    return m_this;
  };

  this._init(arg);
  return this;
};

inherit(pathFeature, feature);
module.exports = pathFeature;
