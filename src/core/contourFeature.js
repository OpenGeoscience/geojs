//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class contourFeature
 *
 * @class
 * @extends geo.feature
 * @returns {geo.contourFeature}
 *
 */
//////////////////////////////////////////////////////////////////////////////
geo.contourFeature = function (arg) {
  'use strict';
  if (!(this instanceof geo.contourFeature)) {
    return new geo.contourFeature(arg);
  }
  arg = arg || {};
  geo.feature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      m_contour = {},
      s_init = this._init,
      s_data = this.data;

  if (arg.contour === undefined) {
    m_contour = function (d) {
      return d;
    };
  } else {
    m_contour = arg.contour;
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Override the parent data method to keep track of changes to the
   * internal coordinates.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.data = function (arg) {
    var ret = s_data(arg);
    return ret;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set contour accessor
   *
   * @returns {geo.pointFeature}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.contour = function (arg1, arg2) {
    if (arg1 === undefined) {
      return m_contour;
    }
    if (typeof arg1 === 'string' && arg2 === undefined) {
      return m_contour[arg1];
    }
    if (arg2 === undefined) {
      var contour = $.extend(
        {},
        {
          gridWidth: function () {
            if (arg1.gridHeight) {
              return Math.floor(m_this.data().length / arg1.gridHeight);
            }
            return Math.floor(Math.sqrt(m_this.data().length));
          },
          gridHeight: function () {
            if (arg1.gridWidth) {
              return Math.floor(m_this.data().length / arg1.gridWidth);
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
        arg1
      );
      m_contour = contour;
    } else {
      m_contour[arg1] = arg2;
    }
    m_this.modified();
    return m_this;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * A uniform getter that always returns a function even for constant values.
   * If undefined input, return all the contour values as an object.
   *
   * @param {string|undefined} key
   * @return {function}
   */
  ////////////////////////////////////////////////////////////////////////////
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
    return geo.util.ensureFunction(m_contour[key]);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set position accessor
   *
   * @returns {geo.pointFeature}
   */
  ////////////////////////////////////////////////////////////////////////////
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create a set of vertices, values at the vertices, and opacities at the
   * vertices.  Create a set of triangles of indices into the vertex array.
   * Create a color and opacity map corresponding to the values.
   *
   * @returns: an object with pos, value, opacity, elements, minValue,
   *           maxValue, minColor, maxColor, colorMap, factor.  If there is no
   *           contour data that can be used, only elements is guaranteed to
   *           exist, and it will be a zero-length array.
   */
  ////////////////////////////////////////////////////////////////////////////
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
        result = {
          minValue: contour.get('min')(),
          maxValue: contour.get('max')(),
          stepped: stepped === undefined || stepped ? true : false,
          colorMap: [],
          elements: []
        };
    /* Create the min/max colors and the color array */
    result.minColor = $.extend({a: contour.get('minOpacity')() || 0},
        geo.util.convertColor(contour.get('minColor')()));
    result.maxColor = $.extend({a: contour.get('maxOpacity')() || 0},
        geo.util.convertColor(contour.get('maxColor')()));
    contour.get('colorRange')().forEach(function (clr, idx) {
      result.colorMap.push($.extend(
          {a: opacityRange && opacityRange[idx] !== undefined ?
          opacityRange[idx] : 1}, geo.util.convertColor(clr)));
    });
    /* Determine which values are usable */
    if (gridW * gridH > data.length) {
      gridH = Math.floor(data.length) / gridW;
    }
    numPts = gridW * gridH;
    for (i = 0; i < numPts; i += 1) {
      val = parseFloat(valueFunc(data[i]));
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
            values[idx + gridW] !== null && values[idx + gridW + 1] !== null) {
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
    usePos = (x0 === null || x0 === undefined || y0 === null ||
        y0 === undefined || !dx || !dy);
    for (j = i = i3 = 0; j < numPts; j += 1) {
      val = values[j];
      if (val !== null) {
        item = data[j];
        if (usePos) {
          posVal = posFunc(item);
          result.pos[i3]     = posVal.x;
          result.pos[i3 + 1] = posVal.y;
          result.pos[i3 + 2] = posVal.z || 0;
        } else {
          result.pos[i3]     = x0 + dx * (j % gridW);
          result.pos[i3 + 1] = y0 + dy * Math.floor(j / gridW);
          result.pos[i3 + 2] = 0;
        }
        result.opacity[i] = opacityFunc(item);
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    s_init.call(m_this, arg);

    var defaultStyle = $.extend(
      {},
      {
        opacity: 1.0,
        position: function (d) {
          return {x: d.x, y: d.y, z: d.z};
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

inherit(geo.contourFeature, geo.feature);

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

Notes:
* The position array is only used for position if not all of x0, y0, dx, and dy
    are specified (not null or undefined).  If a value array is not specified,
    the position array could still be used for the value.
* If the value() of a grid point is null or undefined, that point will not be
    included in the contour display.  Since the values are on a grid, if this
    point is in the interior of the grid, this can remove up to four squares.
* Only one of gridWidth and gridHeight needs to be specified.  If both are
    specified and gridWidth * gridHeight < data().length, not all the data will
    be used.  If neither are specified, floor(sqrt(data().length)) is used for
    both.
 */
