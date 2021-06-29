/**
 * Computed colored mesh information.
 *
 * @typedef {geo.meshFeature.meshInfo} geo.meshFeature.meshColoredInfo
 * @extends geo.meshFeature.meshInfo
 * @property {number[]} value An array of values that have been normalized to a
 *    range of [0, steps].  There is one value per vertex or element.
 * @property {number[]} opacity An array of opacities per vertex or element.
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
 * @property {boolean} elementValues Truthy if the `value` and `opacity` are
 *    for elements, falsy for vertices.
 */

/**
 * Create a set of vertices, values at the vertices or elements, and opacities
 * at the vertices or elements.  Create a set of triangles of indices into the
 * vertex array.  Create a color and opacity map corresponding to the values.
 *
 * @param {geo.meshFeature} feature A mesh feature.
 * @param {boolean} elementValues Truthy to compute values and opacities at
 *    elements, falsy for vertices.
 * @returns {geo.meshFeature.meshColoredInfo} An object with the colored mesh
 *    information.
 */
function createColoredMesh(feature, elementValues) {
  var $ = require('jquery');
  var util = require('../util');

  var mesh = feature.mesh,
      valueFunc = feature.style.get('value'),
      usedFunc = feature.style('used') !== undefined ?
        feature.style.get('used') :
        function (d, i) { return util.isNonNullFinite(valueFunc(d, i)); },
      minmax, val, range, i, k;
  var meshParams = {
    used: usedFunc,
    opacity: feature.style.get('opacity'),
    value: valueFunc
  };
  var result = feature._createMesh(
    !elementValues ? meshParams : {},
    elementValues ? meshParams : {});
  result.elementValues = !!elementValues;
  if (!result.numVertices || !result.numElements) {
    return result;
  }
  var stepped = mesh.get('stepped')(result),
      opacityRange = mesh.get('opacityRange')(result),
      rangeValues = mesh.get('rangeValues')(result);
  result.stepped = stepped === undefined || stepped ? true : false;
  /* Create the min/max colors and the color array */
  result.colorMap = [];
  result.minColor = $.extend(
    {a: mesh.get('minOpacity')(result) || 0},
    util.convertColor(mesh.get('minColor')(result)));
  result.maxColor = $.extend(
    {a: mesh.get('maxOpacity')(result) || 0},
    util.convertColor(mesh.get('maxColor')(result)));
  mesh.get('colorRange')(result).forEach(function (clr, idx) {
    result.colorMap.push($.extend({
      a: opacityRange && opacityRange[idx] !== undefined ? opacityRange[idx] : 1
    }, util.convertColor(clr)));
  });
  /* Get min and max values */
  minmax = util.getMinMaxValues(result.value, mesh.get('min')(result), mesh.get('max')(result));
  result.minValue = minmax.min;
  result.maxValue = minmax.max;
  if (!rangeValues || !result.colorMap ||
      (rangeValues.length !== result.colorMap.length + 1 && (
        stepped || rangeValues.length !== result.colorMap.length))) {
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
  result.factor = (result.colorMap.length - (stepped ? 0 : 1)) / range;
  /* Scale values */
  for (i = 0; i < result.value.length; i += 1) {
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
}

module.exports = {
  createColoredMesh: createColoredMesh
};
