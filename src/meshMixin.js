/**
 * A mesh formed by a set of triangular or square elements or a
 * squarely-connected grid that is of rectangular extent.  The gird can be
 * regularly spaced or have arbitrary position coordinates for each node.
 *
 * @typedef {object} geo.meshMixin.meshSpec
 * @property {number[]|array.<number[]>} [elements] If specified, a list of
 *      indices into the data array that form elements.  If this is an array of
 *      arrays, each subarray must be the same length and must have either 3
 *      values for triangular elements or 4 values for square elements.  If
 *      this is a single array, the data indices are of all elements are packed
 *      one after another and the `elementPacking` property is used to
 *      determine element shape.  If this `null` or `undefined`, a rectangular
 *      grid of squares is used based on `gridWidth` and `gridHeight` or an
 *      implicit version of those parameters.
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
 * @property {boolean} [wrapLongitude] If truthy and `position` is not used
 *      (`elements` is not used and `x0`, `y0`, `dx`, and `dy` are all set
 *      appropriately), assume the x coordinates is longitude and should be
 *      adjusted to be within -180 to 180.  If the data spans 180 degrees, the
 *      points or squares that straddle the meridian will be duplicated to
 *      ensure that the map is covered from -180 to 180 as appropriate.  Set
 *      this to `false` if using a non-longitude x coordinate.
 */
/**
 * A set of triangular elements and their associated positions for a mesh.
 *
 * @typedef {object} geo.meshMixin.meshInfo
 * @property {string} shape One of `'triangle'` or `'square'`.  If `square`,
 *      each pair of elements is one square.  These elements have vertices v00,
 *      v01, v02, v10, v11, v12.  The square is formed via v00-v01-v10-v11-v00.
 *      For `triangle`, each element stands alone.
 * @property {number[]} elements A packed array of indices into the `pos` array
 *      defining the elements.  Each sequential three values forms a triangle.
 * @property {number[]} index An array that references which data index is
 *      associated with each vertex.
 * @property {number[]} pos A packed array of coordinates in the interface gcs
 *      for the vertices.  This is in the order x0, y0, z0, x1, y1, z2, x2, ...
 * @property {number} numberVertices the number of vertices in the mesh.
 * @property {number} numberElementsthe number of elements (squares or
 *      triangles) in the mesh.
 * @property {number} verticesPerElement 3 for triangles, 6 for squares.
 */

var meshMixin = function (arg) {
  var $ = require('jquery');
  var util = require('./util');

  var m_this = this,
      m_mesh = {};

  /**
   * Get/Set mesh accessor.
   *
   * @param {string|geo.meshObject.meshSpecc} [specOrProperty] If `undefined`,
   *    return the current mesh specification.  If a string is specified,
   *    either get or set the named mesh property.  If an object is given, set
   *    or update the specification with the specified parameters.
   * @param {object} [value] If `specOrProperty` is a string, set that property
   *    to `value`.  If `undefined`, return the current value of the named
   *    property.
   * @returns {geo.meshObject.meshSpec|object|this} The current mesh
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
      var mesh = $.extend(
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
   * @param {string|undefined} key The name of the mesh key or `undefined` to
   *    return an object with all keys as functions.
   * @returns {function|object} A function related to the key, or an object
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
   * Create a set of vertices and elements from a mesh specification.
   *
   * This currently takes a set of `vertexValueFuncs` to detemrine which
   * vertices are used (shown) and values at those vertices.  It could be
   * extended with `elementValueFuncs`.
   *
   * @param {object} [vertexValueFuncs] A dictionary where the keys are the
   *    names of properties to include in the results and the values are
   *    functions that are evaluated at each vertex with the arguments
   *    (data[idx], idx).  If a key is named `used`, then if its function
   *    returns a falsy value for a data point, the vertex associated with that
   *    data point is removed from the resultant mesh.
   * @returns {geo.meshMixin.meshInfo} An object with the mesh information.
   */
  this.createMesh = function (vertexValueFuncs) {
    vertexValueFuncs = vertexValueFuncs || {};
    var i, i3, j, k, idx, numPts, usedPts, usePos, item, key,
        data = m_this.data(),
        posFunc = m_this.position(), posVal,
        elements = m_this.mesh.get('elements')(),
        elementPacking = m_this.mesh.get('elementPacking')(),
        gridW = m_this.mesh.get('gridWidth')(),
        gridH = m_this.mesh.get('gridHeight')(),
        wrapLongitude = m_this.mesh.get('wrapLongitude')(),
        x0 = m_this.mesh.get('x0')(),
        y0 = m_this.mesh.get('y0')(),
        dx = m_this.mesh.get('dx')(),
        dy = m_this.mesh.get('dy')(),
        calcX, skipColumn, x, origI, /* used for wrapping */
        gridWorig = gridW,  /* can be different when wrapping */
        result = {
          shape: 'square',
          elements: []
        };
    /* If we are using a grid, calculate the elements and positions. */
    if (!elements) {
      if (gridW * gridH > data.length) {
        gridH = Math.floor(data.length / gridW);
      }
      /* If we are not using the position values (we are using x0, y0, dx, dy),
       * and wrapLongitude is turned on, and the position spans 180 degrees,
       * duplicate one or two columns of points at opposite ends of the map. */
      usePos = (elements || x0 === null || x0 === undefined || y0 === null ||
          y0 === undefined || !dx || !dy);
      wrapLongitude = !!(wrapLongitude === undefined || wrapLongitude);
      if (!usePos && wrapLongitude && (x0 < -180 || x0 > 180 ||
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
      result.index = new Array(numPts);
      for (i = 0; i < numPts; i += 1) {
        origI = i;
        if (skipColumn !== undefined) {
          j = Math.floor(i / gridW);
          origI = i - j * gridW;
          origI += (origI > skipColumn ? -2 : 0);
          if (origI >= gridWorig) {
            origI -= gridWorig;
          }
          origI += j * gridWorig;
        }
        result.index[i] = origI;
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
          }
        }
      }
    } else {
      /* use defined elements */
      if (elementPacking === 'square' ||
          (elementPacking !== 'triangle' && !(elements.length % 4) && (elements.length % 3)) ||
          (Array.isArray(elements[0]) && elements[0].length === 4)) {
        result.shape = 'square';
        if (Array.isArray(elements[0])) {
          for (i = 0; i < elements.length; i += 1) {
            result.elements.push(elements[i][0]);
            result.elements.push(elements[i][1]);
            result.elements.push(elements[i][3]);
            result.elements.push(elements[i][2]);
            result.elements.push(elements[i][3]);
            result.elements.push(elements[i][1]);
          }
        } else {
          for (i = 0; i < elements.length - 3; i += 4) {
            result.elements.push(elements[i]);
            result.elements.push(elements[i + 1]);
            result.elements.push(elements[i + 3]);
            result.elements.push(elements[i + 2]);
            result.elements.push(elements[i + 3]);
            result.elements.push(elements[i + 1]);
          }
        }
      } else {
        result.shape = 'triangle';
        if (Array.isArray(elements[0])) {
          for (i = 0; i < elements.length; i += 1) {
            result.elements.push(elements[i][0]);
            result.elements.push(elements[i][1]);
            result.elements.push(elements[i][2]);
          }
        } else {
          result.elements = elements.slice();
        }
      }
      result.index = new Array(data.length);
      for (i = 0; i < data.length; i += 1) {
        result.index[i] = i;
      }
      numPts = data.length;
      usePos = true;
    }
    result.verticesPerElement = result.shape === 'triangle' ? 3 : 6;
    /* If we have a `vertexValueFuncs.used` function, remove any unused
     * vertices.  Then, remove any elements that have a vertex that can't be
     * used.  This could leave vertices that are unused by any element, but
     * removing those is expensive so it is not done. */
    if (vertexValueFuncs.used) {
      var remap = new Array(numPts),
          vpe = result.verticesPerElement;
      for (i = usedPts = 0; i < numPts; i += 1) {
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
      if (usedPts !== numPts) {
        for (i = k = 0; i < result.elements.length; i += vpe) {
          for (j = 0; j < vpe; j += 1) {
            if (remap[result.elements[i + j]] < 0) {
              break;
            }
            result.elements[k + j] = remap[result.elements[i + j]];
          }
          if (j === vpe) {
            k += vpe;
          }
        }
        result.elements.splice(k);
      }
      numPts = usedPts;
    }
    /* Get point locations and store them in a packed array */
    result.pos = new Array(numPts * 3);
    for (key in vertexValueFuncs) {
      if (key !== 'used' && vertexValueFuncs.hasOwnProperty(key)) {
        result[key] = new Array(numPts);
      }
    }
    for (i = i3 = 0; i < numPts; i += 1, i3 += 3) {
      idx = result.index[i];
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
      }
      for (key in vertexValueFuncs) {
        if (key !== 'used' && vertexValueFuncs.hasOwnProperty(key)) {
          result[key][i] = vertexValueFuncs[key](item, idx);
        }
      }
    }
    result.numVertices = numPts;
    result.numElements = result.elements.length / result.verticesPerElement;
    return result;
  };

  /* Initialize from arguments */
  arg = arg || {};
  var style = $.extend({}, {
    position: function (d) {
      /* We could construct a new object and return
       *  {x: d.x, y: d.y, z: d.z};
       * but that isn't necessary. */
      return d;
    }
  }, arg.style || {});

  this.mesh(arg.mesh || {});
  this.style(style);
};

module.exports = meshMixin;
