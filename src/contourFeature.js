var inherit = require('./inherit');
var meshFeature = require('./meshFeature');

/**
 * Contour feature specification.
 *
 * @typedef {geo.feature.spec} geo.contourFeature.spec
 * @extends geo.feature.spec
 * @property {object[]} [data=[]] An array of arbitrary objects used to
 *    construct the feature.
 * @property {geo.contourFeature.styleSpec} [style] An object that contains
 *    style values for the feature.
 * @property {geo.contourFeature.contourSpec} [contour] The contour
 *    specification for the feature.
 */

/**
 * Style specification for a contour feature.
 *
 * @typedef {geo.feature.styleSpec} geo.contourFeature.styleSpec
 * @extends geo.feature.styleSpec
 * @property {geo.geoPosition|Function} [position=data] The position of each
 *    data element.  This defaults to just using `x`, `y`, and `z` properties
 *    of the data element itself.  The position is in the feature's gcs
 *    coordinates.
 * @property {number|Function} [value=data.z] The value of each data element.
 *    This defaults to the `z` property of the data elements.  If the value of
 *    a grid point is `null` or `undefined`, the point and elements that use
 *    that point won't be included in the results.
 * @property {number|Function} [opacity=1] The opacity for the whole feature on
 *    a scale of 0 to 1.
 * @property {number[]|Function} [origin] Origin in map gcs coordinates used
 *   for to ensure high precision drawing in this location.  When called as a
 *   function, this is passed the vertex positions as a single continuous array
 *   in map gcs coordinates.  It defaults to the first vertex used in the
 *   contour.
 */

/**
 * Contour specification.  All of these properties can be functions, which get
 * passed the {@link geo.meshFeature.meshInfo} object.
 *
 * @typedef {geo.meshFeature.meshSpec} geo.contourFeature.contourSpec
 * @extends geo.meshFeature.meshSpec
 * @property {number} [min] Minimum contour value.  If unspecified, taken from
 *    the computed minimum of the `value` style.
 * @property {number} [max] Maximum contour value.  If unspecified, taken from
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
 *    entry then the length of `colorRange` if the contour is stepped, or the
 *    same length as the `colorRange` if unstepped.
 */

/**
 * Computed contour information.
 *
 * @typedef {geo.meshFeature.meshColoredInfo} geo.contourFeature.contourInfo
 * @extends geo.meshFeature.meshColoredInfo
 */

/**
 * Create a new instance of class contourFeature.
 *
 * @class
 * @alias geo.contourFeature
 * @extends geo.meshFeature
 *
 * @borrows geo.contourFeature#mesh as geo.contourFeature#contour
 *
 * @param {geo.contourFeature.spec} arg
 * @returns {geo.contourFeature}
 */
var contourFeature = function (arg) {
  'use strict';
  if (!(this instanceof contourFeature)) {
    return new contourFeature(arg);
  }

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
   * Create a set of vertices, values at the vertices, and opacities at the
   * vertices.  Create a set of triangles of indices into the vertex array.
   * Create a color and opacity map corresponding to the values.
   *
   * @returns {geo.contourFeature.contourInfo} An object with the contour
   *    information.
   */
  this._createContours = function () {
    return meshUtil.createColoredMesh(m_this, false);
  };

  this.contour = m_this.mesh;

  /**
   * Initialize.
   *
   * @param {geo.contourFeature.spec} arg The contour feature specification.
   */
  this._init = function (arg) {
    s_init.call(m_this, arg);

    var defaultStyle = Object.assign(
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

    m_this.contour(Object.assign({}, {
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
    }, arg.mesh || {}, arg.contour || {}));

    if (arg.mesh || arg.contour) {
      m_this.dataTime().modified();
    }
  };

  this._init(arg);
  return this;
};

inherit(contourFeature, meshFeature);
module.exports = contourFeature;

/* Example:

layer.createFeature('contour', {
})
.data(<array with w x h elements>)
.position(function (d) {
  return { x: <longitude>, y: <latitude>, z: <altitude>};
})
.style({
  opacity: function (d) {
    return <opacity of grid point>;
  },
  value: function (d) {            // defaults to position().z
    return <contour value>;
  }
})
.contour({
  gridWidth: <width of grid>,
  gridHeight: <height of grid>,
  x0: <the x coordinate of the 0th point in the value array>,
  y0: <the y coordinate of the 0th point in the value array>,
  dx: <the distance in the x direction between the 0th and 1st point in the
    value array>,
  dy: <the distance in the y direction between the 0th and (gridWidth)th point
    in the value array>,
  wrapLongitude: <boolean (default true).  If true, AND the position array is
    not used, assume the x coordinates is longitude and should be adjusted to
    be within -180 to 180.  If the data spans 180 degrees, the points or
    squares will be duplicated to ensure that the map is covered from -180 to
    180 as appropriate.  Set this to false if using a non longitude x
    coordinate.  This is ignored if the position array is used.>,
  min: <optional minimum contour value, otherwise taken from style.value>,
  max: <optional maximum contour value, otherwise taken from style.value>,
  minColor: <color for any value below the minimum>,
  minOpacity: <opacity for any value below the minimum>,
  maxColor: <color for any value above the maximum>,
  maxOpacity: <opacity for any value above the maximum>,
  stepped: <boolean (default true).  If false, smooth transitions between
    colors>,
  colorRange: [<array of colors used for the contour>],
  opacityRange: [<optional array of opacities used for the contour, expected to
    be the same length as colorRange>],
  rangeValues: [<if specified, instead of spacing the colors linearly, use this
    spacing.  Must be increasing monotonic and one value longer than the length
    of colorRange>]
})
 */
