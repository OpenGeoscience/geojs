var inherit = require('./inherit');
var feature = require('./feature');

/**
 * Contour feature specification.
 *
 * @typedef {geo.feature.spec} geo.contourFeature.spec
 * @property {object[]} [data=[]] An array of arbitrary objects used to
 *  construct the feature.
 * @property {object} [style] An object that contains style values for the
 *      feature.
 * @property {function|number} [style.opacity=1] The opacity on a scale of 0 to
 *      1.
 * @property {function|geo.geoPosition} [style.position=data] The position of
 *      each data element.  This defaults to just using `x`, `y`, and `z`
 *      properties of the data element itself.  The position is in the
 *      feature's gcs coordinates.
 * @property {function|number} [style.value=data.z] The contour value of each
 *      data element.  This defaults `z` properties of the data element.  If
 *      the value of a grid point is `null` or `undefined`, that point will not
 *      be included in the contour display.  Since the values are on a grid, if
 *      this point is in the interior of the grid, this can remove up to four
 *      squares.
 * @property {geo.contourFeature.contourSpec} [contour] The contour
 *      specification for the feature.
 */

/**
 * Contour specification.
 *
 * @typedef {object} geo.contourFeature.contourSpec
 * @property {function|number} [gridWidth] The number of data columns in the
 *      grid.  If this is not specified and `gridHeight` is given, this is the
 *      number of data elements divided by `gridHeight`.  If neither
 *      `gridWidth` not `gridHeight` are specified,  the square root of the
 *      number of data elements is used.  If both are specified, some data
 *      could be unused.
 * @property {function|number} [gridHeight] The number of data rows in the
 *      grid.  If this is not specified and `gridWidth` is given, this is the
 *      number of data elements divided by `gridWidth`.  If neither
 *      `gridWidth` not `gridHeight` are specified,  the square root of the
 *      number of data elements is used.  If both are specified, some data
 *      could be unused.
 * @property {function|number} [x0] The x coordinate of the 0th point in the
 *      `value` array.  If `null` or `undefined`, the coordinate is taken from
 *      the `position` style.
 * @property {function|number} [y0] The y coordinate of the 0th point in the
 *      `value` array.  If `null` or `undefined`, the coordinate is taken from
 *      the `position` style.
 * @property {function|number} [dx] The distance in the x direction between the
 *      0th and 1st point in the `value` array.  This may be positive or
 *      negative.  If 0, `null`, or `undefined`, the coordinate is taken from
 *      the `position` style.
 * @property {function|number} [dy] The distance in the y direction between the
 *      0th and `gridWidth`th point in the `value` array.  This may be positive
 *      or negative.  If 0, `null`, or `undefined`, the coordinate is taken
 *      from the `position` style.
 * @property {function|boolean} [wrapLongitude] If truthy and `position` is not
 *      used (`x0`, `y0`, `dx`, and `dy` are all set appropriately), assume the
 *      x coordinates is longitude and should be adjusted to be within -180 to
 *      180.  If the data spans 180 degrees, the points or squares that
 *      straddle the meridian will be duplicated to ensure that
 *      the map is covered from -180 to 180 as appropriate.  Set this to
 *      `false` if using a non-longitude x coordinate.  This is ignored if
 *      `position` is used.
 * @property {function|number} [min] Minimum contour value.  If unspecified,
 *      taken from the computed minimum of the `value` style.
 * @property {function|number} [max] Maximum contour value.  If unspecified,
 *      taken from the computed maxi,um of the `value` style.
 * @property {function|geo.geoColor} [minColor='black'] Color used for any
 *      value below the minimum.
 * @property {function|number} [minOpacity=0] Opacity used for any value below
 *      the minimum.
 * @property {function|geo.geoColor} [maxColor='black'] Color used for any
 *      value above the maximum.
 * @property {function|number} [maxOpacity=0] Opacity used for any value above
 *      the maximum.
 * @property {function|boolean} [stepped] If falsy but not `undefined`, smooth
 *      transitions between colors.
 * @property {function|geo.geoColor[]} [colorRange=<color table>] An array of
 *      colors used to show the range of values.  The default is a 9-step color
 *      table.
 * @property {function|number[]} [opacityRange] An array of opacities used to
 *      show the range of values.  If unspecified, the opacity is 1.  If this
 *      is a shorter list than the `colorRange`, an opacity of 1 is used for
 *      the entries near the end of the color range.
 * @property {function|number[]} [rangeValues] An array used to map values to
 *      the `colorRange`.  By default, values are spaced linearly.  If
 *      specified, the entries must be increasing weakly monotonic, and there
 *      must be one more entry then the length of `colorRange`.
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
 * @extends geo.feature
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
  feature.call(this, arg);

  /**
   * @private
   */
  var m_this = this,
      m_contour = {},
      s_init = this._init;

  if (arg.contour === undefined) {
    m_contour = function (d) {
      return d;
    };
  } else {
    m_contour = arg.contour;
  }

  /**
   * Get/Set contour accessor.
   *
   * @param {string|geo.contourFeature.contourSpec} [specOrProperty] If
   *    `undefined`, return the current contour specification.  If a string is
   *    specified, either get or set the named contour property.  If an object
   *    is given, set or update the contour specification with the specified
   *    parameters.
   * @param {object} [value] If `specOrProperty` is a string, set that property
   *    to `value`.  If `undefined`, return the current value of the named
   *    property.
   * @returns {geo.contourFeature.contourSpec|object|this} The current contour
   *    specification, the value of a named contour property, or this contour
   *    feature.
   */
  this.contour = function (specOrProperty, value) {
    if (specOrProperty === undefined) {
      return m_contour;
    }
    if (typeof specOrProperty === 'string' && value === undefined) {
      return m_contour[specOrProperty];
    }
    if (value === undefined) {
      var contour = $.extend(
        {},
        {
          gridWidth: function () {
            if (specOrProperty.gridHeight) {
              return Math.floor(m_this.data().length / specOrProperty.gridHeight);
            }
            return Math.floor(Math.sqrt(m_this.data().length));
          },
          gridHeight: function () {
            if (specOrProperty.gridWidth) {
              return Math.floor(m_this.data().length / specOrProperty.gridWidth);
            }
            return Math.floor(Math.sqrt(m_this.data().length));
          },
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
        },
        m_contour,
        specOrProperty
      );
      m_contour = contour;
    } else {
      m_contour[specOrProperty] = value;
    }
    m_this.modified();
    return m_this;
  };

  /**
   * A uniform getter that always returns a function even for constant values.
   * If undefined input, return all the contour values as an object.
   *
   * @param {string|undefined} key The name of the contour key or `undefined`
   *    to return an object with all keys as functions.
   * @returns {function|object} A function related to the key, or an object
   *    with all contour keys, each of which is a function.
   */
  this.contour.get = function (key) {
    if (key === undefined) {
      var all = {}, k;
      for (k in m_contour) {
        if (m_contour.hasOwnProperty(k)) {
          all[k] = m_this.contour.get(k);
        }
      }
      return all;
    }
    return util.ensureFunction(m_contour[key]);
  };

  /**
   * Get/Set position accessor.  This is identical to getting or setting the
   * `position` style.
   *
   * @param {function|array} [val] If specified, set the position style.  If
   *    `undefined`, return the current value.
   * @returns {function|array|this} Either the position style or this.
   */
  this.position = function (val) {
    if (val === undefined) {
      return m_this.style('position');
    } else {
      m_this.style('position', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Create a set of vertices, values at the vertices, and opacities at the
   * vertices.  Create a set of triangles of indices into the vertex array.
   * Create a color and opacity map corresponding to the values.
   *
   * @returns {geo.contourFeature.contourInfo} An object with the contour
   *    information.
   */
  this.createContours = function () {
    var i, i3, j, idx, k, val, numPts, usedPts = 0, usePos, item,
        idxMap = {},
        minval, maxval, range,
        contour = m_this.contour,
        data = m_this.data(),
        posFunc = m_this.position(), posVal,
        gridW = contour.get('gridWidth')(),
        gridH = contour.get('gridHeight')(),
        x0 = contour.get('x0')(),
        y0 = contour.get('y0')(),
        dx = contour.get('dx')(),
        dy = contour.get('dy')(),
        opacityFunc = m_this.style.get('opacity'),
        opacityRange = contour.get('opacityRange')(),
        rangeValues = contour.get('rangeValues')(),
        valueFunc = m_this.style.get('value'), values = [],
        stepped = contour.get('stepped')(),
        wrapLong = contour.get('wrapLongitude')(),
        calcX, skipColumn, x, origI, /* used for wrapping */
        gridWorig = gridW,  /* can be different when wrapping */
        result = {
          minValue: contour.get('min')(),
          maxValue: contour.get('max')(),
          stepped: stepped === undefined || stepped ? true : false,
          wrapLongitude: wrapLong === undefined || wrapLong ? true : false,
          colorMap: [],
          elements: []
        };
    /* Create the min/max colors and the color array */
    result.minColor = $.extend({a: contour.get('minOpacity')() || 0},
        util.convertColor(contour.get('minColor')()));
    result.maxColor = $.extend({a: contour.get('maxOpacity')() || 0},
        util.convertColor(contour.get('maxColor')()));
    contour.get('colorRange')().forEach(function (clr, idx) {
      result.colorMap.push($.extend({
        a: opacityRange && opacityRange[idx] !== undefined ? opacityRange[idx] : 1
      }, util.convertColor(clr)));
    });
    /* Determine which values are usable */
    if (gridW * gridH > data.length) {
      gridH = Math.floor(data.length) / gridW;
    }
    /* If we are not using the position values (we are using x0, y0, dx, dy),
     * and wrapLongitude is turned on, and the position spans 180 degrees,
     * duplicate one or two columns of points at opposite ends of the map. */
    usePos = (x0 === null || x0 === undefined || y0 === null ||
        y0 === undefined || !dx || !dy);
    if (!usePos && result.wrapLongitude && (x0 < -180 || x0 > 180 ||
        x0 + dx * (gridW - 1) < -180 || x0 + dx * (gridW - 1) > 180) &&
        dx > -180 && dx < 180) {
      calcX = [];
      for (i = 0; i < gridW; i += 1) {
        x = x0 + i * dx;
        while (x < -180) { x += 360; }
        while (x > 180) { x -= 360; }
        if (i && Math.abs(x - calcX[calcX.length - 1]) > 180) {
          if (x > calcX[calcX.length - 1]) {
            calcX.push(x - 360);
            calcX.push(calcX[calcX.length - 2] + 360);
          } else {
            calcX.push(x + 360);
            calcX.push(calcX[calcX.length - 2] - 360);
          }
          skipColumn = i;
        }
        calcX.push(x);
      }
      gridW += 2;
      if (Math.abs(Math.abs(gridWorig * dx) - 360) < 0.01) {
        gridW += 1;
        x = x0 + gridWorig * dx;
        while (x < -180) { x += 360; }
        while (x > 180) { x -= 360; }
        calcX.push(x);
      }
    }
    /* Calculate the value for point */
    numPts = gridW * gridH;
    for (i = 0; i < numPts; i += 1) {
      if (skipColumn === undefined) {
        val = parseFloat(valueFunc(data[i], i));
      } else {
        j = Math.floor(i / gridW);
        origI = i - j * gridW;
        origI += (origI > skipColumn ? -2 : 0);
        if (origI >= gridWorig) {
          origI -= gridWorig;
        }
        origI += j * gridWorig;
        val = parseFloat(valueFunc(data[origI], origI));
      }
      values[i] = isNaN(val) ? null : val;
      if (values[i] !== null) {
        idxMap[i] = usedPts;
        usedPts += 1;
        if (minval === undefined) {
          minval = maxval = values[i];
        }
        if (values[i] < minval) {
          minval = values[i];
        }
        if (values[i] > maxval) {
          maxval = values[i];
        }
      }
    }
    if (!usedPts) {
      return result;
    }
    if (!$.isNumeric(result.minValue)) {
      result.minValue = minval;
    }
    if (!$.isNumeric(result.maxValue)) {
      result.maxValue = maxval;
    }
    if (!rangeValues || rangeValues.length !== result.colorMap.length + 1) {
      rangeValues = null;
    }
    if (rangeValues) {  /* ensure increasing monotonicity */
      for (k = 1; k < rangeValues.length; k += 1) {
        if (rangeValues[k] > rangeValues[k + 1]) {
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
    /* Create triangles */
    for (j = idx = 0; j < gridH - 1; j += 1, idx += 1) {
      for (i = 0; i < gridW - 1; i += 1, idx += 1) {
        if (values[idx] !== null && values[idx + 1] !== null &&
            values[idx + gridW] !== null &&
            values[idx + gridW + 1] !== null && i !== skipColumn) {
          result.elements.push(idxMap[idx]);
          result.elements.push(idxMap[idx + 1]);
          result.elements.push(idxMap[idx + gridW]);
          result.elements.push(idxMap[idx + gridW + 1]);
          result.elements.push(idxMap[idx + gridW]);
          result.elements.push(idxMap[idx + 1]);
        }
      }
    }
    /* Only locate the points that are in use. */
    result.pos = new Array(usedPts * 3);
    result.value = new Array(usedPts);
    result.opacity = new Array(usedPts);
    for (j = i = i3 = 0; j < numPts; j += 1) {
      val = values[j];
      if (val !== null) {
        item = data[j];
        if (usePos) {
          posVal = posFunc(item);
          result.pos[i3] = posVal.x;
          result.pos[i3 + 1] = posVal.y;
          result.pos[i3 + 2] = posVal.z || 0;
        } else {
          if (skipColumn === undefined) {
            result.pos[i3] = x0 + dx * (j % gridW);
          } else {
            result.pos[i3] = calcX[j % gridW];
          }
          result.pos[i3 + 1] = y0 + dy * Math.floor(j / gridW);
          result.pos[i3 + 2] = 0;
        }
        result.opacity[i] = opacityFunc(item, j);
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
        i += 1;
        i3 += 3;
      }
    }
    return result;
  };

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
        position: function (d) {
          /* We could construct a new object and return
           *  {x: d.x, y: d.y, z: d.z};
           * but that isn't necessary. */
          return d;
        },
        value: function (d) {
          return m_this.position()(d).z;
        }
      },
      arg.style === undefined ? {} : arg.style
    );

    m_this.style(defaultStyle);

    if (m_contour) {
      m_this.dataTime().modified();
    }
  };

  this._init(arg);
  return this;
};

inherit(contourFeature, feature);
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
