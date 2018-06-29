var inherit = require('./inherit');
var meshFeature = require('./meshFeature');

/**
 * Contour feature specification.
 *
 * @typedef {geo.feature.spec} geo.contourFeature.spec
 * @property {object[]} [data=[]] An array of arbitrary objects used to
 *    construct the feature.
 * @property {object} [style] An object that contains style values for the
 *    feature.
 * @property {number|function} [style.opacity=1] The opacity on a scale of 0 to
 *    1.
 * @property {geo.geoPosition|function} [style.position=data] The position of
 *    each data element.  This defaults to just using `x`, `y`, and `z`
 *    properties of the data element itself.  The position is in the feature's
 *    gcs coordinates.
 * @property {number|function} [style.value=data.z] The value of each data
 *    element.  This defaults `z` properties of the data element.  If the value
 *    of a grid point is `null` or `undefined`, that point and elements that
 *    use that point won't be included in the results.
 * @property {geo.contourFeature.contourSpec} [contour] The contour
 *    specification for the feature.
 */

/**
 * Contour specification.
 *
 * @typedef {geo.meshFeature.meshSpec} geo.contourFeature.contourSpec
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
 *    entry then the length of `colorRange`.
 */

/**
 * Computed contour information.
 *
 * @typedef {object} geo.contourFeature.contourInfo
 * @property {number[]} elements An array of 0-based indices into the values
 *    array.  Each set of the three values forms a triangle that should be
 *    rendered.  If no contour data can be used, this will be a zero-length
 *    array and other properties may not be set.
 * @property {number[]} pos An flat array of coordinates for the vertices in
 *    the triangular mesh.  The array is in the order x0, y0, z0, x1, y1, z1,
 *    x2, ..., and is always three times as long as the number of vertices.
 * @property {number[]} value An array of values that have been normalized to a
 *    range of [0, steps].  There is one value per vertex.
 * @property {number[]} opacity An array of opacities per vertex.
 * @property {number} minValue the minimum value used for the contour.  If
 *    `rangeValues` was specified, this is the first entry of that array.
 * @property {number} maxValue the maximum value used for the contour.  If
 *    `rangeValues` was specified, this is the last entry of that array.
 * @property {number} factor If linear value scaling is used, this is the
 *    number of color values divided by the difference between the maximum and
 *    minimum values.  It is ignored if non-linear value scaling is used.
 * @property {geo.geoColorObject} minColor The color used for values below
 *    minValue.  Includes opacity.
 * @property {geo.geoColorObject} maxColor The color used for values above
 *    maxValue.  Includes opacity.
 * @property {geo.geoColorObject[]} colorMap The specified `colorRange` and
 *    `opacityRange` converted into objects that include opacity.
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

  var $ = require('jquery');
  var util = require('./util');

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
    var contour = m_this.contour,
        valueFunc = m_this.style.get('value'),
        stepped = contour.get('stepped')(),
        opacityRange = contour.get('opacityRange')(),
        rangeValues = contour.get('rangeValues')(),
        minValue, maxValue, val, range, i, k;
    var result = this._createMesh({
      used: function (d, i) {
        return util.isNonNullFinite(valueFunc(d, i));
      },
      opacity: m_this.style.get('opacity'),
      value: valueFunc
    });
    if (!result.numVertices || !result.numElements) {
      return result;
    }
    result.stepped = stepped === undefined || stepped ? true : false;
    /* Create the min/max colors and the color array */
    result.colorMap = [];
    result.minColor = $.extend({a: contour.get('minOpacity')() || 0},
        util.convertColor(contour.get('minColor')()));
    result.maxColor = $.extend({a: contour.get('maxOpacity')() || 0},
        util.convertColor(contour.get('maxColor')()));
    contour.get('colorRange')().forEach(function (clr, idx) {
      result.colorMap.push($.extend({
        a: opacityRange && opacityRange[idx] !== undefined ? opacityRange[idx] : 1
      }, util.convertColor(clr)));
    });
    /* Get min and max values */
    result.minValue = contour.get('min')();
    result.maxValue = contour.get('max')();
    if (!$.isNumeric(result.minValue) || !$.isNumeric(result.maxValue)) {
      minValue = maxValue = result.value[0];
      for (i = 1; i < result.numVertices; i += 1) {
        minValue = Math.min(minValue, result.value[i]);
        maxValue = Math.max(maxValue, result.value[i]);
      }
      if (!$.isNumeric(result.minValue)) {
        result.minValue = minValue;
      }
      if (!$.isNumeric(result.maxValue)) {
        result.maxValue = maxValue;
      }
    }
    if (!rangeValues || rangeValues.length !== result.colorMap.length + 1) {
      rangeValues = null;
    }
    if (rangeValues) {  /* ensure increasing monotonicity */
      for (k = 1; k < rangeValues.length; k += 1) {
        if (rangeValues[k - 1] > rangeValues[k]) {
          rangeValues = null;
          break;
        }
      }
    }
    if (rangeValues) {
      result.minValue = rangeValues[0];
      result.maxValue = rangeValues[rangeValues.length - 1];
    }
    range = result.maxValue - result.minValue;
    if (!range) {
      result.colorMap = result.colorMap.slice(0, 1);
      range = 1;
      rangeValues = null;
    }
    result.rangeValues = rangeValues;
    result.factor = result.colorMap.length / range;
    /* Scale values */
    for (i = 0; i < result.numVertices; i += 1) {
      val = result.value[i];
      if (rangeValues && val >= result.minValue && val <= result.maxValue) {
        for (k = 1; k < rangeValues.length; k += 1) {
          if (val <= rangeValues[k]) {
            result.value[i] = k - 1 + (val - rangeValues[k - 1]) /
                (rangeValues[k] - rangeValues[k - 1]);
            break;
          }
        }
      } else {
        result.value[i] = (val - result.minValue) * result.factor;
      }
    }
    return result;
  };

  this.contour = m_this.mesh;

  /**
   * Initialize.
   *
   * @param {geo.contourFeature.spec} arg The contour feature specification.
   */
  this._init = function (arg) {
    s_init.call(m_this, arg);

    var defaultStyle = $.extend(
      {},
      {
        opacity: 1.0,
        value: function (d, i) {
          return m_this.position()(d, i).z;
        }
      },
      arg.style === undefined ? {} : arg.style
    );

    m_this.style(defaultStyle);

    m_this.contour($.extend({}, {
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
