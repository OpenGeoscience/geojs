var inherit = require('./inherit');
var meshFeature = require('./meshFeature');

/**
 * Grid feature specification.
 *
 * @typedef {geo.feature.spec} geo.gridFeature.spec
 * @extends geo.feature.spec
 * @property {object[]} [data=[]] An array of arbitrary objects used to
 *    construct the feature.
 * @property {geo.gridFeature.styleSpec} [style] An object that contains
 *    style values for the feature.
 * @property {geo.gridFeature.gridSpec} [grid] The grid specification for the
 *    feature.
 */

/**
 * Style specification for a grid feature.
 *
 * @typedef {geo.feature.styleSpec} geo.gridFeature.styleSpec
 * @extends geo.feature.styleSpec
 * @property {geo.geoPosition|function} [position=data] The position of each
 *    data element.  This defaults to just using `x`, `y`, and `z` properties
 *    of the data element itself.  The position is in the feature's gcs
 *    coordinates.
 * @property {number|function} [value=data.z] The value of each data element.
 *    This defaults to the `z` property of the data elements.  If the value of
 *    a grid point is `null` or `undefined`, the point and elements that use
 *    that point won't be included in the results.
 * @property {number|function} [opacity=1] The opacity for the whole feature on
 *    a scale of 0 to 1.
 * @property {number[]|function} [origin] Origin in map gcs coordinates used
 *   for to ensure high precision drawing in this location.  When called as a
 *   function, this is passed the vertex positions as a single continuous array
 *   in map gcs coordinates.  It defaults to the first vertex used in the
 *   grid.
 */

/**
 * Grid specification.  All of these properties can be functions, which get
 * passed the {@link geo.meshFeature.meshInfo} object.
 *
 * @typedef {geo.meshFeature.meshSpec} geo.gridFeature.gridSpec
 * @extends geo.meshFeature.meshSpec
 * @property {number} [min] Minimum grid value.  If unspecified, taken from
 *    the computed minimum of the `value` style.
 * @property {number} [max] Maximum grid value.  If unspecified, taken from
 *    the computed maximum of the `value` style.
 * @property {geo.geoColor} [minColor='black'] Color used for any value below
 *    the minimum.
 * @property {number} [minOpacity=0] Opacity used for any value below the
 *    minimum.
 * @property {geo.geoColor} [maxColor='black'] Color used for any value above
 *    the maximum.
 * @property {number} [maxOpacity=0] Opacity used for any value above the
 *    maximum.
 * @property {boolean} [stepped] If falsy but not `undefined`, smooth
 *    transitions between colors.
 * @property {geo.geoColor[]} [colorRange=<color table>] An array of colors
 *    used to show the range of values.  The default is a 9-step color table.
 * @property {number[]} [opacityRange] An array of opacities used to show the
 *    range of values.  If unspecified, the opacity is 1.  If this is a shorter
 *    list than the `colorRange`, an opacity of 1 is used for the entries near
 *    the end of the color range.
 * @property {number[]} [rangeValues] An array used to map values to the
 *    `colorRange`.  By default, values are spaced linearly.  If specified, the
 *    entries must be increasing weakly monotonic, and there must be one more
 *    entry then the length of `colorRange`.
 */

/**
 * Computed grid information.
 *
 * @typedef {geo.meshFeature.meshColoredInfo} geo.gridFeature.gridInfo
 * @extends geo.meshFeature.meshColoredInfo
 */

/**
 * Create a new instance of class gridFeature.
 *
 * @class
 * @alias geo.gridFeature
 * @extends geo.meshFeature
 *
 * @borrows geo.gridFeature#mesh as geo.gridFeature#grid
 *
 * @param {geo.gridFeature.spec} arg
 * @returns {geo.gridFeature}
 */
var gridFeature = function (arg) {
  'use strict';
  if (!(this instanceof gridFeature)) {
    return new gridFeature(arg);
  }

  var $ = require('jquery');
  var util = require('./util');
  var meshUtil = require('./util/mesh');

  arg = arg || {};
  meshFeature.call(this, arg);

  /**
   * @private
   */
  var m_this = this,
      s_init = this._init;

  /**
   * Create a set of vertices and values and opacities inside triangles.
   * Create a set of triangles of indices into the vertex array.  Create a
   *  color and opacity map corresponding to the values.
   *
   * @returns {geo.gridFeature.gridInfo} An object with the grid
   *    information.
   */
  this._createGrids = function () {
    return meshUtil.createColoredMesh(m_this, true);
  };

  this.grid = m_this.mesh;

  /**
   * Initialize.
   *
   * @param {geo.gridFeature.spec} arg The grid feature specification.
   */
  this._init = function (arg) {
    s_init.call(m_this, arg);

    var defaultStyle = $.extend(
      {},
      {
        opacity: 1.0,
        value: function (d, i) {
          return util.isNonNullFinite(d) ? d : m_this.position()(d, i).z;
        },
        position: (d) => d || {x: 0, y: 0},
        origin: (p) => (p.length >= 3 ? [p[0], p[1], 0] : [0, 0, 0])
      },
      arg.style === undefined ? {} : arg.style
    );

    m_this.style(defaultStyle);

    m_this.grid($.extend({}, {
      minColor: 'black',
      minOpacity: 0,
      maxColor: 'black',
      maxOpacity: 0,
      /* 9-step based on paraview bwr colortable */
      colorRange: [
        {r: 0.07514311, g: 0.468049805, b: 1},
        {r: 0.468487184, g: 0.588057293, b: 1},
        {r: 0.656658579, g: 0.707001303, b: 1},
        {r: 0.821573924, g: 0.837809045, b: 1},
        {r: 0.943467973, g: 0.943498599, b: 0.943398095},
        {r: 1, g: 0.788626485, b: 0.750707739},
        {r: 1, g: 0.6289553, b: 0.568237474},
        {r: 1, g: 0.472800903, b: 0.404551679},
        {r: 0.916482116, g: 0.236630659, b: 0.209939162}
      ]
    }, arg.mesh || {}, arg.grid || {}));

    if (arg.mesh || arg.grid) {
      m_this.dataTime().modified();
    }
  };

  this._init(arg);
  return this;
};

inherit(gridFeature, meshFeature);
module.exports = gridFeature;
