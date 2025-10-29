var inherit = require('./inherit');
var feature = require('./feature');

/**
 * Mesh feature specification.
 *
 * @typedef {geo.feature.spec} geo.meshFeature.spec
 * @extends geo.feature.spec
 * @property {object[]} [data=[]] An array of arbitrary objects used to
 *    construct the feature.
 * @property {geo.feature.styleSpec} [style] An object that contains style
 *    values for the feature.
 * @property {geo.meshFeature.meshSpec} [mesh] The mesh specification for the
 *    feature.
 */

/**
 * A mesh formed by a set of triangular or square elements or a
 * squarely-connected grid that is of rectangular extent.  The grid can be
 * regularly spaced or have arbitrary position coordinates for each node.  All
 * of these properties can be functions, which get passed `data`.
 *
 * @typedef {object} geo.meshFeature.meshSpec
 * @property {number[]|Array.<number[]>} [elements] If specified, a list of
 *      indices into the data array that form elements.  If this is an array of
 *      arrays, each subarray must have at least either 3 values for triangular
 *      elements or 4 values for square elements.  If this is a single array,
 *      the data indices are of all elements are packed one after another and
 *      the `elementPacking` property is used to determine element shape.  If
 *      this `null` or `undefined`, a rectangular grid of squares is used based
 *      on `gridWidth` and `gridHeight` or an implicit version of those
 *      parameters.
 * @property {string} [elementPacking='auto'] If `elements` is provided as a
 *      single array, this determines the shape of the elements.  It is one of
 *      `auto`, `triangle`, or `square`.  `triangle` uses triplets of values to
 *      define elements.  `square` uses quads of values.  `auto` is identical
 *      to `triangle` unless `elements`'s length is a multiple of 4 and *not* a
 *      multiple of 3, in which case it is the same as `square`.
 * @property {number} [gridWidth] The number of data columns in the grid.  If
 *      this is not specified and `gridHeight` is given, this is the number of
 *      data elements divided by `gridHeight`.  If neither `gridWidth` nor
 *      `gridHeight` are specified, the squareroot of the number of data
 *      elements is used.  If both are specified, some data could be unused.
 *      Ignored if `elements` is used.
 * @property {number} [gridHeight] The number of data rows in the grid.  If
 *      this is not specified and `gridWidth` is given, this is the number of
 *      data elements divided by `gridWidth`.  If neither `gridWidth` not
 *      `gridHeight` are specified, the squareroot of the number of data
 *      elements is used.  If both are specified, some data could be unused.
 *      Ignored if `elements` is used.
 * @property {number} [x0] The x coordinate of the 0th data point.  If `null`
 *      or `undefined`, the coordinate is taken from the `position` style.
 *      Ignored if `elements` is used.
 * @property {number} [y0] The y coordinate of the 0th data point.  If `null`
 *      or `undefined`, the coordinate is taken from the `position` style.
 *      Ignored if `elements` is used.
 * @property {number} [dx] The distance in the x direction between the 0th and
 *      1st data point.  This may be positive or negative.  If 0, `null`, or
 *      `undefined`, the coordinate is taken from the `position` style.
 *      Ignored if `elements` is used.
 * @property {number} [dy] The distance in the y direction between the 0th and
 *      `gridWidth`th data point.  This may be positive or negative.  If 0,
 *      `null`, or `undefined`, the coordinate is taken from the `position`
 *      style.  Ignored if `elements` is used.
 * @property {boolean} [wrapLongitude=true] If truthy and `position` is not
 *      used (`elements` is not used and `x0`, `y0`, `dx`, and `dy` are all set
 *      appropriately), assume the x coordinates are longitude and should be
 *      adjusted to be within -180 to 180.  If the data spans 180 degrees, the
 *      points or squares that straddle the meridian will be duplicated to
 *      ensure that the map is covered from -180 to 180 as appropriate.  Set
 *      this to `false` if using a non-longitude x coordinate.
 */

/**
 * A set of elements and their associated positions for a mesh.
 *
 * @typedef {object} geo.meshFeature.meshInfo
 * @property {string} shape One of `'triangle'` or `'square'`.  If `square`,
 *      each pair of elements is one square.  These elements have vertices v00,
 *      v01, v02, v10, v11, v12.  The square is formed via v00-v01-v10-v11-v00.
 *      For `triangle`, each element stands alone.
 * @property {number[]} elements A packed array of indices into the `pos` array
 *      defining the elements.  Each sequential three values forms a triangle.
 * @property {number[]} elementIndex An array that has one value for each
 *      triplet of values in the `elements` array.  The value is the 0-based
 *      index of the element that can be used to correspond it to element-based
 *      parameters.
 * @property {number[]} index An array that references which data index is
 *      associated with each vertex.
 * @property {number[]} pos A packed array of coordinates in the interface gcs
 *      for the vertices.  This is in the order x0, y0, z0, x1, y1, z2, x2, ...
 * @property {number} numberVertices the number of vertices in the mesh.
 * @property {number} numberElementsthe number of elements (squares or
 *      triangles) in the mesh.
 * @property {number} verticesPerElement 3 for triangles, 6 for squares.
 */

/**
 * Create a new instance of class meshFeature.  This should be the parent of a
 * more usable feature class.
 *
 * @class
 * @alias geo.meshFeature
 * @extends geo.feature
 *
 * @param {geo.meshFeature.spec} arg
 * @returns {this}
 */
var meshFeature = function (arg) {
  'use strict';
  if (!(this instanceof meshFeature)) {
    return new meshFeature(arg);
  }

  var util = require('./util');

  arg = arg || {};
  feature.call(this, arg);

  var m_this = this,
      s_init = this._init,
      m_mesh = {};

  this.featureType = 'mesh';

  /**
   * Get/Set mesh accessor.
   *
   * @param {string|geo.meshFeature.meshSpec} [specOrProperty] If `undefined`,
   *    return the current mesh specification.  If a string is specified,
   *    either get or set the named mesh property.  If an object is given, set
   *    or update the specification with the specified parameters.
   * @param {object} [value] If `specOrProperty` is a string, set that property
   *    to `value`.  If `undefined`, return the current value of the named
   *    property.
   * @returns {geo.meshFeature.meshSpec|object|this} The current mesh
   *    specification, the value of a named mesh property, or this mesh object.
   */
  this.mesh = function (specOrProperty, value) {
    if (specOrProperty === undefined) {
      return m_mesh;
    }
    if (typeof specOrProperty === 'string' && value === undefined) {
      return m_mesh[specOrProperty];
    }
    if (value === undefined) {
      var mesh = Object.assign(
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
          }
        },
        m_mesh,
        specOrProperty
      );
      m_mesh = mesh;
    } else {
      m_mesh[specOrProperty] = value;
    }
    m_this.modified();
    return m_this;
  };

  /**
   * A uniform getter that always returns a function even for constant values.
   * If undefined input, return all the mesh values as an object.
   *
   * @function mesh_DOT_get
   * @memberof geo.meshFeature
   * @instance
   * @param {string|undefined} key The name of the mesh key or `undefined` to
   *    return an object with all keys as functions.
   * @returns {object|Function} A function related to the key, or an object
   *    with all mesh keys, each of which is a function.
   */
  this.mesh.get = function (key) {
    if (key === undefined) {
      var all = {}, k;
      for (k in m_mesh) {
        if (m_mesh.hasOwnProperty(k)) {
          all[k] = m_this.mesh.get(k);
        }
      }
      return all;
    }
    return util.ensureFunction(m_mesh[key]);
  };

  /**
   * Get/Set position accessor.  This is identical to getting or setting the
   * `position` style.
   *
   * @param {array|Function} [val] If specified, set the position style.  If
   *    `undefined`, return the current value.
   * @returns {array|Function|this} Either the position style or this.
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
   * Create a set of vertices and elements from a mesh specification.
   *
   * This currently takes a set of `vertexValueFuncs` to determine which
   * vertices are used (shown) and values at those vertices.  It could be
   * extended with `elementValueFuncs`.
   *
   * @param {object} [vertexValueFuncs] A dictionary where the keys are the
   *    names of properties to include in the results and the values are
   *    functions that are evaluated at each vertex with the arguments
   *    `(data[idx], idx, position)`.  If a key is named `used`, then its
   *    function is passed `(data[idx], idx)` and if it returns a falsy value
   *    for a data point, the vertex associated with that data point is removed
   *    from the resultant mesh.
   * @param {object} [elementValueFuncs] A dictionary where the keys are the
   *    names of properties to include in the results and the values are
   *    functions that are evaluated at each element with the arguments
   *    `(data[idx], idx)`.  If a key is named `used`, then its function is
   *    passed `(data[idx], idx)` and if it returns a falsy value for a data
   *    point, the triangle or square associated with that data point is
   *    removed from the resultant mesh.
   * @returns {geo.meshFeature.meshInfo} An object with the mesh information.
   */
  this._createMesh = function (vertexValueFuncs, elementValueFuncs) {
    vertexValueFuncs = vertexValueFuncs || {};
    elementValueFuncs = elementValueFuncs || {};
    var i, i3, j, k, idx, numPts, usedPts, usePos, item, key,
        data = m_this.data(),
        posFunc = m_this.position(), posVal,
        elements = m_this.mesh.get('elements')(data),
        elementPacking = m_this.mesh.get('elementPacking')(data),
        gridW = m_this.mesh.get('gridWidth')(data),
        gridH = m_this.mesh.get('gridHeight')(data),
        wrapLongitude = m_this.mesh.get('wrapLongitude')(data),
        x0 = m_this.mesh.get('x0')(data),
        y0 = m_this.mesh.get('y0')(data),
        dx = m_this.mesh.get('dx')(data),
        dy = m_this.mesh.get('dy')(data),
        calcX, calcCol, skipColumn, x, origI, /* used for wrapping */
        gridWorig = gridW,  /* can be different when wrapping */
        result = {
          shape: 'square',
          elements: [],
          elementIndex: []
        };
    /* If we are using a grid, calculate the elements and positions. */
    if (!elements) {
      if (Object.keys(vertexValueFuncs).length) {
        if (gridW * gridH > data.length) {
          gridH = Math.floor(data.length / gridW);
        }
      } else if (Object.keys(elementValueFuncs).length) {
        if ((gridW - 1) * (gridH - 1) > data.length) {
          gridH = Math.floor(data.length / (gridW - 1)) + 1;
        }
      }
      /* If we are not using the position values (we are using x0, y0, dx, dy),
       * and wrapLongitude is turned on, and the position spans 180 degrees,
       * duplicate one or two columns of points at opposite ends of the map. */
      usePos = (x0 === null || x0 === undefined || y0 === null ||
          y0 === undefined || !dx || !dy);
      wrapLongitude = !!(wrapLongitude === undefined || wrapLongitude);
      if (!usePos && wrapLongitude && (x0 < -180 || x0 > 180 ||
          x0 + dx * (gridW - 1) < -180 || x0 + dx * (gridW - 1) > 180) &&
          dx > -180 && dx < 180 && dx * (gridW - 1) < 360 + 1e-4) {
        calcX = [];
        calcCol = [];
        for (i = 0; i < gridW; i += 1) {
          x = x0 + i * dx;
          while (x < -180) { x += 360; }
          while (x > 180) { x -= 360; }
          if (i && Math.abs(x - calcX[calcX.length - 1]) > 180) {
            if (x > calcX[calcX.length - 1]) {
              calcX.push(x - 360);
              calcX.push(calcX[calcX.length - 2] + 360);
              calcCol.push(i);
              calcCol.push(i + 1);
            } else {
              calcX.push(x + 360);
              calcX.push(calcX[calcX.length - 2] - 360);
              calcCol.push(i);
              calcCol.push(i + 1);
            }
            skipColumn = i;
          }
          calcX.push(x);
          calcCol.push(i);
        }
        gridW += 2;
        if (Math.abs(Math.abs(gridWorig * dx) - 360) < 0.01) {
          gridW += 1;
          x = x0 + gridWorig * dx;
          while (x < -180) { x += 360; }
          while (x > 180) { x -= 360; }
          calcX.push(x);
          calcCol.push(0);
        }
      }
      /* Calculate the value for point */
      numPts = gridW * gridH;
      if (skipColumn !== undefined) {
        result.index = new Array(numPts);
        for (i = 0; i < numPts; i += 1) {
          j = Math.floor(i / gridW);
          origI = i - j * gridW;
          origI += (origI > skipColumn ? -2 : 0);
          if (origI >= gridWorig) {
            origI -= gridWorig;
          }
          origI += j * gridWorig;
          result.index[i] = origI;
        }
      }
      /* Create triangles */
      for (j = idx = 0; j < gridH - 1; j += 1, idx += 1) {
        for (i = 0; i < gridW - 1; i += 1, idx += 1) {
          if (i !== skipColumn) {
            result.elements.push(idx);
            result.elements.push(idx + 1);
            result.elements.push(idx + gridW);
            result.elements.push(idx + gridW + 1);
            result.elements.push(idx + gridW);
            result.elements.push(idx + 1);
            result.elementIndex.push(j * (gridW - 1) + (calcCol ? calcCol[i] : i));
            result.elementIndex.push(j * (gridW - 1) + (calcCol ? calcCol[i] : i));
          }
        }
      }
    } else {
      /* use defined elements */
      var hasSubArray = elements.length && Array.isArray(elements[0]);
      if (elementPacking === 'square' || (elementPacking !== 'triangle' &&
          ((!hasSubArray && !(elements.length % 4) && (elements.length % 3)) ||
          (hasSubArray && elements[0].length === 4)))) {
        result.shape = 'square';
        if (hasSubArray) {
          for (i = 0; i < elements.length; i += 1) {
            result.elements.push(elements[i][0]);
            result.elements.push(elements[i][1]);
            result.elements.push(elements[i][3]);
            result.elements.push(elements[i][2]);
            result.elements.push(elements[i][3]);
            result.elements.push(elements[i][1]);
            result.elementIndex.push(i);
            result.elementIndex.push(i);
          }
        } else {
          for (i = j = 0; i < elements.length - 3; i += 4, j += 1) {
            result.elements.push(elements[i]);
            result.elements.push(elements[i + 1]);
            result.elements.push(elements[i + 3]);
            result.elements.push(elements[i + 2]);
            result.elements.push(elements[i + 3]);
            result.elements.push(elements[i + 1]);
            result.elementIndex.push(j);
            result.elementIndex.push(j);
          }
        }
      } else {
        result.shape = 'triangle';
        if (hasSubArray) {
          for (i = 0; i < elements.length; i += 1) {
            result.elements.push(elements[i][0]);
            result.elements.push(elements[i][1]);
            result.elements.push(elements[i][2]);
            result.elementIndex.push(i);
          }
        } else {
          result.elements = elements.slice(0, elements.length - (elements.length % 3));
          for (i = j = 0; i < elements.length - 2; i += 3, j += 1) {
            result.elementIndex.push(j);
          }
        }
      }
      numPts = data.length;
      usePos = true;
    }
    /* If we have an `elementValueFuncs.used` function, remove any unused
     * elements.  Unused vertices are removed later. */
    result.verticesPerElement = result.shape === 'triangle' ? 3 : 6;
    var vpe = result.verticesPerElement;
    if (elementValueFuncs.used) {
      var used = new Array(result.elementIndex[result.elementIndex.length - 1] + 1);
      for (i = 0; i < used.length; i += 1) {
        used[i] = elementValueFuncs.used(data[i], i);
      }
      for (i = 0; i < result.elementIndex.length; i += 1) {
        if (!used[result.elementIndex[i]]) {
          break;
        }
      }
      if (i < result.elementIndex.length) {
        for (j = i; i < result.elementIndex.length; i += 1) {
          if (used[result.elementIndex[i]]) {
            result.elementIndex[j] = result.elementIndex[i];
            for (k = 0; k < 3; k += 1) {
              result.elements[j * 3 + k] = result.elements[i * 3 + k];
            }
            j += 1;
          }
        }
        result.elements.splice(j * 3);
        result.elementIndex.splice(j);
      }
    }
    /* If we have a `vertexValueFuncs.used` function, remove any unused
     * vertices.  Then, remove any elements that have a vertex that can't be
     * used.  This could leave vertices that are unused by any element, but
     * they are removed later. */
    if (vertexValueFuncs.used) {
      for (i = 0; i < numPts; i += 1) {
        idx = result.index ? result.index[i] : i;
        if (!vertexValueFuncs.used(data[idx], idx)) {
          break;
        }
      }
      if (i !== numPts) {
        usedPts = i;
        var remap = new Array(numPts);
        for (j = 0; j < usedPts; j += 1) {
          remap[j] = j;
        }
        remap[usedPts] = -1;
        if (!result.index) {
          result.index = new Array(data.length);
          for (j = 0; j < data.length; j += 1) {
            result.index[j] = j;
          }
        }
        for (i = usedPts + 1; i < numPts; i += 1) {
          idx = result.index[i];
          if (vertexValueFuncs.used(data[idx], idx)) {
            remap[i] = usedPts;
            result.index[usedPts] = result.index[i];
            usedPts += 1;
          } else {
            remap[i] = -1;
          }
        }
        result.index.splice(usedPts);
        for (i = k = 0; i < result.elements.length; i += vpe) {
          for (j = 0; j < vpe; j += 1) {
            if (remap[result.elements[i + j]] < 0) {
              break;
            }
            result.elements[k + j] = remap[result.elements[i + j]];
          }
          if (j === vpe) {
            result.elementIndex[Math.floor(k / 3)] = result.elementIndex[Math.floor(i / 3)];
            if (vpe === 6) {
              result.elementIndex[Math.floor(k / 3) + 1] = result.elementIndex[Math.floor(i / 3) + 1];
            }
            k += vpe;
          }
        }
        result.elements.splice(k);
        result.elementIndex.splice(Math.floor(k / 3));
        numPts = usedPts;
      }
    }
    /* Remove unused vertices -- this could be disabled to save time.  It
     * cannot be applied if skipColumn is defined, as in that case some
     * vertices are used multiple times but with different coordinates.  We
     * could also do this when vertexValueFuncs.used is used, but that usually
     * has a much smaller reduction in values and isn't worth the time. */
    if (elementValueFuncs.used && skipColumn === undefined) {
      var vertexMap = new Array(numPts);
      var oldindex = result.index;
      result.index = [];
      for (i = 0; i < result.elements.length; i += 1) {
        k = result.elements[i];
        if (vertexMap[k] === undefined) {
          vertexMap[k] = result.index.length;
          result.index.push(oldindex ? oldindex[k] : k);
        }
        result.elements[i] = vertexMap[k];
      }
      numPts = result.index.length;
    }
    /* Get point locations and store them in a packed array */
    result.pos = new Array(numPts * 3);
    for (key in vertexValueFuncs) {
      if (key !== 'used' && vertexValueFuncs.hasOwnProperty(key)) {
        result[key] = new Array(numPts);
      }
    }
    for (i = i3 = 0; i < numPts; i += 1, i3 += 3) {
      idx = result.index ? result.index[i] : i;
      item = data[idx];
      if (usePos) {
        posVal = posFunc(item, idx);
        result.pos[i3] = posVal.x;
        result.pos[i3 + 1] = posVal.y;
        result.pos[i3 + 2] = posVal.z || 0;
      } else {
        if (skipColumn === undefined) {
          result.pos[i3] = x0 + dx * (idx % gridW);
        } else {
          result.pos[i3] = calcX[i % gridW];
        }
        result.pos[i3 + 1] = y0 + dy * Math.floor(idx / gridW);
        result.pos[i3 + 2] = 0;
        posVal = {x: result.pos[i3], y: result.pos[i3 + 1], z: result.pos[i3 + 2]};
      }
      for (key in vertexValueFuncs) {
        if (key !== 'used' && vertexValueFuncs.hasOwnProperty(key)) {
          result[key][i] = vertexValueFuncs[key](item, idx, posVal);
        }
      }
    }
    for (key in elementValueFuncs) {
      if (key !== 'used' && elementValueFuncs.hasOwnProperty(key)) {
        var func = elementValueFuncs[key];
        result[key] = new Array(result.elementIndex.length);
        for (i = 0; i < result.elementIndex.length; i += 1) {
          idx = result.elementIndex[i];
          item = data[idx];
          result[key][i] = func(item, idx);
        }
      }
    }
    result.numVertices = numPts;
    result.numElements = result.elements.length / result.verticesPerElement;
    return result;
  };

  /**
   * Initialize.
   *
   * @param {geo.meshFeature.spec} arg The mesh feature specification.
   */
  this._init = function (arg) {
    s_init.call(m_this, arg);

    /* Initialize from arguments */
    arg = arg || {};
    var style = Object.assign({}, {
      position: (d) => Array.isArray(d) ? {x: d[0], y: d[1], z: d[2] || 0} : d
    }, arg.style || {});

    m_this.mesh(arg.mesh || {});
    m_this.style(style);
  };

  return this;
};

inherit(meshFeature, feature);

module.exports = meshFeature;
