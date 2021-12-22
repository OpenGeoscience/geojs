var inherit = require('./inherit');
var meshFeature = require('./meshFeature');
var registry = require('./registry');
var util = require('./util');

/**
 * Isoline feature specification.
 *
 * @typedef {geo.feature.spec} geo.isolineFeature.spec
 * @extend geo.feature.spec
 * @property {object[]} [data=[]] An array of arbitrary objects used to
 *    construct the feature.
 * @property {geo.isolineFeature.styleSpec} [style] An object that contains
 *    style values for the feature.
 * @property {geo.isolineFeature.isolineSpec} [isoline] The isoline
 *    specification for the feature.
 */

/**
 * Style specification for an isoline feature.  Extends
 * {@link geo.lineFeasture.styleSpec} and {@link geo.textFeasture.styleSpec}.
 *
 * @typedef {geo.feature.styleSpec} geo.isolineFeature.styleSpec
 * @extends geo.feature.styleSpec
 * @extends geo.textFeature.styleSpec
 * @extends geo.lineFeature.styleSpec
 * @property {geo.geoPosition|function} [position=data] The position of each
 *    data element.  This defaults to just using `x`, `y`, and `z` properties
 *    of the data element itself.  The position is in the feature's gcs
 *    coordinates.
 * @property {number|function} [value=data.z] The value of each data element.
 *    This defaults to the `z` property of the data elements.  If the value of
 *    a grid point is `null` or `undefined`, the point and elements that use
 *    that point won't be included in the results.
 * @property {geo.geoColor|function} [strokeColor='black'] Color to stroke each
 *    line.
 * @property {number|function} [strokeWidth] The weight of the line stroke in
 *    pixels.  This defaults to the line value's level + 0.5.
 * @property {boolean|function} [rotateWithMap=true] Rotate label text when the
 *    map rotates.
 * @property {number|function} [rotation] Text rotation in radians.  This
 *    defaults to the label oriented so that top of the text is toward the
 *    higher value.  There is a utility function that can be used for common
 *    rotation preferences.  See {@link geo.isolineFeature#rotationFunction}.
 *    For instance, `rotation=geo.isolineFeature.rotationFunction('map')`.
 * @property {string|function} [fontSize='12px'] The font size.
 * @property {geo.geoColor|function} [textStrokeColor='white'] Text
 *    stroke color.  This adds contrast between the label and the isoline.
 * @property {geo.geoColor|function} [textStrokeWidth=2] Text stroke width in
 *    pixels.
 */

/**
 * Isoline specification.  All of these properties can be functions, which get
 * passed the {@link geo.meshFeature.meshInfo} object.
 *
 * @typedef {geo.meshFeature.meshSpec} geo.isolineFeature.isolineSpec
 * @extends geo.meshFeature.meshSpec
 * @property {number} [min] Minimum isoline value.  If unspecified, taken from
 *    the computed minimum of the `value` style.
 * @property {number} [max] Maximum isoline value.  If unspecified, taken from
 *    the computed maximum of the `value` style.
 * @property {number} [count=15] Approximate number of isolines shown through
 *    the value range.  Used if `spacing` or `values` is not specified.
 * @property {boolean} [autofit=true] If `count` is used to determine the
 *    isolines, and this is truthy, the isoline values will be round numbers.
 *    If falsy, they will include the exact minimum and maximum values.
 * @property {number} [spacing] Distance in value units between isolines.
 *    Used if specified and `values` is not specified.
 * @property {number[]|geo.isolineFeature.valueEntry[]} [values] An array of
 *    explicit values for isolines.
 * @property {number[]} [levels=[5, 5]] If `values` is not used to explicitly
 *    set isoline levels, this determines the spacing of levels which can be
 *    used to style lines distinctly.  Most isolines will be level 0.  If
 *    `levels` is an array of [`n0`, `n1`, ...], every `n0`th line will be
 *    level 1, every `n0 * n1`th line will be level 2, etc.
 * @property {boolean|function} [label] Truthy if a label should be shown for a
 *    isoline value.  If a function, this is called with
 *    `(geo.isolineFeature.valueEntry, index)`.  This defaults to
 *    `valueEntry.level >= 1`.
 * @property {string|function} [labelText] Text for a label.  If a function,
 *    this is called with `(geo.isolineFeature.valueEntry, index)`.  This
 *    defaults to `valueEntry.value`.
 * @property {number|function} [labelSpacing=200] Minimum distance between
 *    labels on an isoline in screen pixels.  If a function, this is called
 *    with `(geo.isolineFeature.valueEntry, index)`.
 * @property {number|function} [labelOffset=0] Offset for labels along an
 *    isoline relative to where they would be placed by default on a scale of
 *    [-0.5, 0.5].  +/- 1 would move the text to the next repeated occurrence
 *    of the label.  If a function, this is called with
 *    `(geo.isolineFeature.valueEntry, index)`.
 * @property {number|function} [labelViewport=10000] If the main position of a
 *    label would be further than this many pixels from the current viewport,
 *    don't create it.  This prevents creating an excessive number of labels
 *    when zoomed in, but requires regenerating labels occasionally when
 *    panning.  If <= 0, all labels are generated regardless of location.
 * @property {boolean|function} [labelAutoUpdate=true] If truthy, when the map
 *    is panned (including zoom, rotation, etc.), periodically regenerate
 *    labels.  This uses an internal function that has a threshold based on a
 *    fixed change in zoom, size, and other parameters.  Set `labelAutoUpdate`
 *    to `false` and handle the {@link geo.event.pan} elsewhere.
 */

/**
 * Isoline value entry.
 *
 * @typedef {object} geo.isolineFeature.valueEntry
 * @property {number} value The value of the isoline.
 * @property {number} level The level of the isoline.
 * @property {number} [position] An index of the position of the isoline.  For
 *   evenly spaced or autofit values, this is the value modulo the spacing.
 *   Otherwise, this is the index position within the list of values.  This is
 *   computed when calculating isolines.
 * @property {string} [label] The label to display on this value.  This is
 *   computed from the `label` and `labelText` styles when calculating
 *   isolines.
 */

/**
 * Computed isoline information.
 *
 * @typedef {object} geo.isolineFeature.isolineInfo
 * @property {geo.isolineFeature.valueEntry[]} values The values used to
 *    produce the isolines.
 * @property {geo.meshFeature.meshInfo} mesh The normalized mesh.
 * @property {array[]} lines An array of arrays.  Each entry is a list of
 *    vertices that also have a `value` property with the appropriate entry in
 *    `values`.  If the line should show a label, it will  also have a `label`
 *    property with the text of the label.
 * @property {boolean} hasLabels `true` if there are any lines that have
 *    labels that need to be shown if there is enough resolution.
 */

/* This includes both the marching triangles and marching squares conditions.
 * The triangle pattern has three values, where 0 is less below the threshold
 * and 1 is above it.  The square pattern has four values in the order
 * ul-ur-ll-lr.  For each line a pattern produces, the line is created with a
 * low and high vertex from each of two edges.  Additionally, the create line
 * is such that the low value is outside of a clockwise winding.
 *
 * Performance note: Initially this table used string keys (e.g., '0001'), but
 * the string lookup was vastly slower than an integer lookup.
 */
var patternLineTable = {
  /* triangles with one high vertex */
  17 /* 001 */: [{l0: 1, h0: 2, l1: 0, h1: 2}],
  18 /* 010 */: [{l0: 0, h0: 1, l1: 2, h1: 1}],
  20 /* 100 */: [{l0: 2, h0: 0, l1: 1, h1: 0}],
  /* triangles with one low vertex */
  22 /* 110 */: [{l0: 2, h0: 0, l1: 2, h1: 1}],
  21 /* 101 */: [{l0: 1, h0: 2, l1: 1, h1: 0}],
  19 /* 011 */: [{l0: 0, h0: 1, l1: 0, h1: 2}],
  /* squares with one high vertex */
  1  /* 0001 */: [{l0: 2, h0: 3, l1: 1, h1: 3}],
  2  /* 0010 */: [{l0: 0, h0: 2, l1: 3, h1: 2}],
  4  /* 0100 */: [{l0: 3, h0: 1, l1: 0, h1: 1}],
  8  /* 1000 */: [{l0: 1, h0: 0, l1: 2, h1: 0}],
  /* squares with one low vertex */
  14 /* 1110 */: [{l0: 3, h0: 1, l1: 3, h1: 2}],
  13 /* 1101 */: [{l0: 2, h0: 3, l1: 2, h1: 0}],
  11 /* 1011 */: [{l0: 1, h0: 0, l1: 1, h1: 3}],
  7  /* 0111 */: [{l0: 0, h0: 2, l1: 0, h1: 1}],
  /* squares with two low vertices sharing a side */
  3  /* 0011 */: [{l0: 0, h0: 2, l1: 1, h1: 3}],
  10 /* 1010 */: [{l0: 1, h0: 0, l1: 3, h1: 2}],
  12 /* 1100 */: [{l0: 3, h0: 1, l1: 2, h1: 0}],
  5  /* 0101 */: [{l0: 2, h0: 3, l1: 0, h1: 1}],
  /* squares with two low vertices on opposite corners.  These could generate
   * a different pair of lines each. */
  6  /* 0110 */: [{l0: 0, h0: 2, l1: 0, h1: 1}, {l0: 3, h0: 1, l1: 3, h1: 2}],
  9  /* 1001 */: [{l0: 1, h0: 0, l1: 1, h1: 3}, {l0: 2, h0: 3, l1: 2, h1: 0}]
};

/**
 * Create a new instance of class isolineFeature.
 *
 * @class
 * @alias geo.isolineFeature
 * @extends geo.meshFeature
 *
 * @borrows geo.isolineFeature#mesh as geo.isolineFeature#contour
 * @borrows geo.isolineFeature#mesh as geo.isolineFeature#isoline
 *
 * @param {geo.isolineFeature.spec} arg
 * @returns {geo.isolineFeature}
 */
var isolineFeature = function (arg) {
  'use strict';
  if (!(this instanceof isolineFeature)) {
    return new isolineFeature(arg);
  }

  var $ = require('jquery');
  var transform = require('./transform');
  var geo_event = require('./event');
  var textFeature = require('./textFeature');

  arg = arg || {};
  meshFeature.call(this, arg);

  /**
   * @private
   */
  var m_this = this,
      m_isolines,
      m_lastLabelPositions,
      m_lineFeature,
      m_labelLayer,
      m_labelFeature,
      s_draw = this.draw,
      s_exit = this._exit,
      s_init = this._init,
      s_modified = this.modified,
      s_update = this._update;

  this.featureType = 'isoline';

  this.contour = m_this.mesh;
  this.isoline = m_this.mesh;

  /**
   * Create a set of isolines.  This is a set of lines that could be used for a
   * line feature and to inform a text feature.
   *
   * @returns {geo.isolineFeature.isolineInfo} An object with the isoline
   *    information.
   */
  this._createIsolines = function () {
    var valueFunc = m_this.style.get('value'),
        usedFunc = m_this.style('used') !== undefined ?
          m_this.style.get('used') :
          function (d, i) { return util.isNonNullFinite(valueFunc(d, i)); },
        values,
        hasLabels = false,
        lines = [];
    var mesh = m_this._createMesh({
      used: usedFunc,
      value: valueFunc
    });
    values = m_this._getValueList(mesh);
    if (!values.length) {
      return {};
    }
    values.forEach(function (value) {
      var valueLines = m_this._isolinesForValue(mesh, value);
      if (valueLines.length) {
        lines = lines.concat(valueLines);
        hasLabels = hasLabels || !!value.label;
      }
    });
    /* We may want to rdpSimplify the result to remove very small segments, but
     * if we do, it must NOT change the winding direction. */
    return {
      lines: lines,
      mesh: mesh,
      values: values,
      hasLabels: hasLabels
    };
  };

  /**
   * Generate an array of values for which isolines will be generated.
   *
   * @param {geo.meshFeature.meshInfo} mesh The normalized mesh.
   * @returns {geo.isolineFeature.valueEntry[]} The values in ascending order.
   */
  this._getValueList = function (mesh) {
    var isoline = m_this.isoline,
        values = isoline.get('values')(mesh),
        spacing = isoline.get('spacing')(mesh),
        count = isoline.get('count')(mesh),
        autofit = isoline.get('autofit')(mesh),
        levels = isoline.get('levels')(mesh),
        minmax, delta, step, steppow, steplog10, fixedDigits, i;
    if (!mesh.numVertices || !mesh.numElements) {
      return [];
    }
    minmax = util.getMinMaxValues(mesh.value, isoline.get('min')(mesh), isoline.get('max')(mesh), true);
    mesh.minValue = minmax.min;
    mesh.maxValue = minmax.max;
    delta = mesh.maxValue - mesh.minValue;
    if (delta <= 0) {
      return [];
    }
    /* Determine values for which we need to generate isolines. */
    if (Array.isArray(values)) {
      /* if the caller specified values, use them.  Each can either be a number
       * or an object with `value` and optionally `level`.  If it doesn't have
       * level, the position is just the index in the array. */
      values = values.map(function (val, idx) {
        return {
          value: val.value !== undefined ? val.value : val,
          position: idx,
          level: val.level
        };
      });
      /* Remove any values that are outside of the data range. */
      values = values.filter(function (val) {
        return val.value >= mesh.minValue && val.value <= mesh.maxValue;
      });
    } else if (!spacing && !autofit) {
      /* If no values or spacing are specified and autofit is falsy, then
       * use uniform spacing across the value range.  The max and min won't
       * produce contours (since they are exact values), so there range is
       * divided into `count + 1` sections to get `count` visible lines. */
      values = Array(count);
      for (i = 0; i < count; i += 1) {
        values[i] = {
          value: mesh.minValue + delta * (i + 1) / (count + 1),
          position: i + 1
        };
      }
    } else {
      if (!spacing) {
        /* If no spacing is specified, then this has a count with autofit.
         * Generate at least 2/3rds as many lines as the count, but it could be
         * 5/2 of that when adjusted to "nice values" (so between 2/3 and 5/3
         * of the specified count). */
        step = delta / (count * 2 / 3);
        steplog10 = Math.floor(Math.log10(step));
        fixedDigits = Math.max(0, -steplog10);
        steppow = Math.pow(10, steplog10);
        step /= steppow;  // will now be in range [1, 10)
        step = step >= 5 ? 5 : step >= 2 ? 2 : 1;  // now 1, 2, or 5
        spacing = step * steppow;
      }
      /* Generate the values based on a spacing.  The `position` is used for
       * figuring out level further on and is based so that 0 will be the
       * maximum level. */
      values = [];
      for (i = Math.ceil(mesh.minValue / spacing); i <= Math.floor(mesh.maxValue / spacing); i += 1) {
        values.push({value: i * spacing, position: i, fixedDigits: fixedDigits});
      }
    }
    /* Mark levels for each value.  These are intended for styling.  All values
     * will have a `value` and `position` attribute at this point. */
    if (levels.length) {
      values.forEach(function (val, idx) {
        if (val.level === undefined) {
          val.level = 0;
          for (var i = 0, basis = levels[0]; i < levels.length && !(val.position % basis); i += 1, basis *= levels[i]) {
            val.level = i + 1;
          }
        }
        if (isoline.get('label')(val, val.position)) {
          var label = isoline.get('labelText')(val, val.position);
          if (label === undefined) {
            if (val.fixedDigits !== undefined) {
              label = '' + parseFloat(val.value.toFixed(val.fixedDigits));
            } else {
              label = '' + val.value;
            }
          }
          if (label) {
            val.label = label;
          }
        }
      });
    }
    return values;
  };

  /**
   * Add a new segment to a list of chains.  Each chain is a list of vertices,
   * each of which is an array of two values with the low/high mesh vertices
   * for that chain vertex.  There are then three possibilities:  (a) The
   * segment forms a new chain that doesn't attach to an existing chain.  (b)
   * One endpoint of the segment matches the endpoint of an existing chain, and
   * it gets added to that chain.  (c) Both endpoints of the segment match
   * endpoints of two different chains, and those two chains are combined via
   * the segment.  A chain may represent a loop, in which case its two
   * endpoints will match.  This function does not join the loop.
   *
   * @param {array} chains An array of existing chains.
   * @param {array} first One endpoint of the new segment.  This is an array of
   *    two numbers defining the mesh vertices used for the endpoint.
   * @param {array} last The second endpoint of the new segment.
   * @returns {array} The modified chains array.
   */
  this._addSegment = function (chains, first, last) {
    var chain = [first, last],
        idx = chains.length,
        i, iter, check, checkFirst, checkLast, combine;
    /* Add the segment as a new chain by itself. */
    chains.push(chain);
    for (iter = 0; iter < 2; iter += 1) {
      /* Check if the new chain can attach to an existing chain */
      for (i = idx - 1; i >= 0; i -= 1) {
        check = chains[i];
        checkFirst = check[0];
        checkLast = check[check.length - 1];
        /* The segment can be inserted at the start of this chain */
        if (last[0] === checkFirst[0] && last[1] === checkFirst[1]) {
          combine = chain.concat(check.slice(1));
        /* The segment can be inserted at the end of this chain */
        } else if (first[0] === checkLast[0] && first[1] === checkLast[1]) {
          combine = check.concat(chain.slice(1));
        /* These two conditions should never be required, as we generate
         * segments with a consistent winding direction.
        } else if (first[0] === checkFirst[0] && first[1] === checkFirst[1]) {
          combine = chain.slice(1).reverse().concat(check);
        } else if (last[0] === checkLast[0] && last[1] === checkLast[1]) {
          combine = check.concat(chain.slice(0, chain.length - 1).reverse());
         */
        /* The segment doesn't match this chain, so keep scanning chains */
        } else {
          continue;
        }
        /* The segment matched and `combine` contains the chain it has been
         * merged with. */
        chains.splice(idx, 1);
        chains[i] = chain = combine;
        idx = i;
        first = chain[0];
        last = chain[chain.length - 1];
        break;
      }
      /* If we didn't combine the new chain to any existing chains, then don't
       * check if the other end also joins an existing chain. */
      if (i < 0) {
        break;
      }
    }
    return chains;
  };

  /**
   * Given a vertex of the form [low vertex index, high vertex index], compute
   * the coordinates of the vertex.
   *
   * @param {geo.meshFeature.meshInfo} mesh The normalized mesh.
   * @param {geo.isolineFeature.valueEntry} value The value for which to
   *    generate the vertex.
   * @param {number[]} vertex The low vertex index and high vertex index.
   * @returns {geo.geoPosition} The calculated coordinate.
   */
  this._chainVertex = function (mesh, value, vertex) {
    var v0 = vertex[0], v1 = vertex[1],
        v03 = v0 * 3, v13 = v1 * 3,
        f = (value.value - mesh.value[v0]) / (mesh.value[v1] - mesh.value[v0]),
        g = 1 - f;
    return {
      x: mesh.pos[v03] * g + mesh.pos[v13] * f,
      y: mesh.pos[v03 + 1] * g + mesh.pos[v13 + 1] * f,
      z: mesh.pos[v03 + 2] * g + mesh.pos[v13 + 2] * f
    };
  };

  /**
   * Generate the lines for associated with a particular value.  This performs
   * either marching triangles or marching squares.
   *
   * @param {geo.meshFeature.meshInfo} mesh The normalized mesh.
   * @param {geo.isolineFeature.valueEntry} value The value for which to
   *    generate the isolines.
   * @returns {geo.isolineFeature.line[]} An array of lines.
   */
  this._isolinesForValue = function (mesh, value) {
    var val = value.value,
        lowhigh = Array(mesh.value.length),
        chains = [],
        i, v, pattern, lines;
    /* Determine if each vertex is above or below the value.  It is faster to
     * use a for loop than map since it avoids function calls. */
    for (i = lowhigh.length - 1; i >= 0; i -= 1) {
      lowhigh[i] = mesh.value[i] <= val ? 0 : 1;
    }
    var vpe = mesh.verticesPerElement,
        square = mesh.shape === 'square',
        elem = mesh.elements,
        elemLen = elem.length;
    for (v = 0; v < elemLen; v += vpe) {
      if (square) {
        pattern = lowhigh[elem[v]] * 8 + lowhigh[elem[v + 1]] * 4 +
                  lowhigh[elem[v + 2]] * 2 + lowhigh[elem[v + 3]];
        if (pattern === 0 || pattern === 15) {
          continue;
        }
      } else {
        pattern = 16 + lowhigh[elem[v]] * 4 + lowhigh[elem[v + 1]] * 2 +
                  lowhigh[elem[v + 2]];
        if (pattern === 16 || pattern === 23) {
          continue;
        }
      }
      patternLineTable[pattern].forEach(function (lineEntry) {
        chains = m_this._addSegment(
          chains,
          [elem[v + lineEntry.l0], elem[v + lineEntry.h0]],
          [elem[v + lineEntry.l1], elem[v + lineEntry.h1]]
        );
      });
    }
    /* convert chains to lines */
    lines = chains.map(function (chain) {
      var line = [];
      chain.forEach(function (vertex) {
        var v = m_this._chainVertex(mesh, value, vertex);
        if (!line.length || v.x !== line[line.length - 1].x ||
            v.y !== line[line.length - 1].y) {
          line.push(v);
        }
      });
      line.closed = (line[0].x === line[line.length - 1].x &&
                     line[0].y === line[line.length - 1].y);
      /* Add value, level, position, and label information to the line. */
      line.value = value.value;
      line.level = value.level;
      line.position = value.position;
      line.label = value.label;
      return line;
    }).filter(function (line) { return line.length > 1; });
    return lines;
  };

  /**
   * Update the timestamp to the next global timestamp value.  Mark
   * sub-features as modified, too.
   *
   * @returns {object} The results of the superclass modified function.
   */
  this.modified = function () {
    var result = s_modified();
    if (m_lineFeature) {
      m_lineFeature.modified();
    }
    if (m_labelFeature) {
      m_labelFeature.modified();
    }
    return result;
  };

  /**
   * Compute the positions for labels on each line.  This can be called to
   * recompute label positions without needign to recompute isolines, for
   * instance when the zoom level changes.  Label positions are computed in the
   * map gcs coordinates, not interface gcs coordinates, since the interface
   * gcs may not be linear with the display space.
   *
   * @returns {this}
   */
  this.labelPositions = function () {
    if (m_this.dataTime().timestamp() >= m_this.buildTime().timestamp()) {
      m_this._build();
    }
    m_lastLabelPositions = null;
    if (!m_labelFeature) {
      return m_this;
    }
    if (!m_isolines || !m_isolines.hasLabels || !m_isolines.lines || !m_isolines.lines.length) {
      m_labelFeature.data([]);
      return m_this;
    }
    var isoline = m_this.isoline,
        spacingFunc = isoline.get('labelSpacing'),
        offsetFunc = isoline.get('labelOffset'),
        labelViewport = isoline.get('labelViewport')(m_isolines.mesh),
        gcs = m_this.gcs(),
        map = m_this.layer().map(),
        mapgcs = map.gcs(),
        mapRotation = map.rotation(),
        mapSize = map.size(),
        labelData = [],
        maxSpacing = 0;
    m_isolines.lines.forEach(function (line, idx) {
      if (!line.label) {
        return;
      }
      var spacing = spacingFunc(line.value, line.value.position),
          offset = offsetFunc(line.value, line.value.position) || 0,
          dispCoor = map.gcsToDisplay(line, gcs),
          totalDistance = 0,
          dist, count, localSpacing, next, lineDistance, i, i2, f, g, pos,
          mapCoor;
      if (spacing <= 0 || isNaN(spacing)) {
        return;
      }
      maxSpacing = Math.max(spacing, maxSpacing);
      /* make offset in the range of [0, 1) with the default at 0.5 */
      offset = (offset + 0.5) - Math.floor(offset + 0.5);
      dist = dispCoor.map(function (pt1, coorIdx) {
        if (!line.closed && coorIdx + 1 === dispCoor.length) {
          return 0;
        }
        var val = Math.sqrt(util.distance2dSquared(pt1, dispCoor[coorIdx + 1 < dispCoor.length ? coorIdx + 1 : 0]));
        totalDistance += val;
        return val;
      });
      count = Math.floor(totalDistance / spacing);
      if (!count) {
        return;
      }
      /* If we have any labels, compute map coordinates of the line and use
       * those for interpolating label positions */
      mapCoor = transform.transformCoordinates(gcs, mapgcs, line);
      localSpacing = totalDistance / count;
      next = localSpacing * offset;
      lineDistance = 0;
      for (i = 0; i < dispCoor.length; i += 1) {
        while (lineDistance + dist[i] >= next) {
          i2 = i + 1 === dispCoor.length ? 0 : i + 1;
          f = (next - lineDistance) / dist[i];
          g = 1 - f;
          next += localSpacing;
          if (labelViewport > 0) {
            pos = {
              x: dispCoor[i].x * g + dispCoor[i2].x * f,
              y: dispCoor[i].y * g + dispCoor[i2].y * f
            };
            if (pos.x < -labelViewport || pos.x > mapSize.width + labelViewport ||
                pos.y < -labelViewport || pos.y > mapSize.height + labelViewport) {
              continue;
            }
          }
          labelData.push({
            x: mapCoor[i].x * g + mapCoor[i2].x * f,
            y: mapCoor[i].y * g + mapCoor[i2].y * f,
            z: mapCoor[i].z * g + mapCoor[i2].z * f,
            line: line,
            rotation: Math.atan2(dispCoor[i].y - dispCoor[i2].y, dispCoor[i].x - dispCoor[i2].x) - mapRotation
          });
        }
        lineDistance += dist[i];
      }
    });
    m_labelFeature.gcs(mapgcs);
    m_labelFeature.data(labelData);
    m_labelFeature.style('renderThreshold', maxSpacing * 2);
    m_lastLabelPositions = {
      zoom: map.zoom(),
      center: map.center(),
      rotation: mapRotation,
      size: mapSize,
      labelViewport: labelViewport,
      maxSpacing: maxSpacing,
      labelAutoUpdate: isoline.get('labelAutoUpdate')(m_isolines.mesh)
    };
    return m_this;
  };

  /**
   * Get the last map position that was used for generating labels.
   *
   * @returns {object} An object with the map `zoom` and `center` and the
   *    `labelViewport` used in generating labels.  The object may have no
   *    properties if there are no labels.
   */
  this.lastLabelPositions = function () {
    return $.extend({}, m_lastLabelPositions);
  };

  /**
   * On a pan event, if labels exist and are set to autoupdate, recalculate
   * their positions and redraw them as needed.  Labels are redrawn if the
   * zoom level changes by at least 2 levels, or the map's center is moved
   * enough that there is a chance that the viewport is nearing the extent of
   * the generated labels.  The viewport calculation is conservative, as the
   * map could be rotated, changed size, or have other modifications.
   *
   * @returns {exit}
   */
  this._updateLabelPositions = function () {
    var last = m_lastLabelPositions;
    if (!last || !last.labelAutoUpdate) {
      return m_this;
    }
    var map = m_this.layer().map(),
        zoom = map.zoom(),
        mapSize = map.size(),
        update = !!(Math.abs(zoom - last.zoom) >= 2);
    if (!update && last.labelViewport > 0) {
      /* Distance in scaled pixels between the map's current center and the
       * center when the labels were computed. */
      var lastDelta = Math.sqrt(util.distance2dSquared(
        map.gcsToDisplay(map.center()), map.gcsToDisplay(last.center))) *
        Math.pow(2, last.zoom - zoom);
      /* Half the viewport, less twice the maxSpacing, less any expansion of
       * the map. */
      var threshold = last.labelViewport / 2 - last.maxSpacing * 2 - Math.max(
        mapSize.width - last.size.width, mapSize.height - last.size.height, 0);
      update = update || (lastDelta >= threshold);
    }
    if (update) {
      m_this.labelPositions().draw();
    }
    return m_this;
  };

  /**
   * Build.  Generate the isolines.  Create a line feature if necessary and
   * update it.
   *
   * @returns {this}
   */
  this._build = function () {
    m_isolines = m_this._createIsolines();
    if (m_isolines && m_isolines.lines && m_isolines.lines.length) {
      if (!m_lineFeature) {
        m_lineFeature = m_this.layer().createFeature('line', {
          selectionAPI: false,
          gcs: m_this.gcs(),
          visible: m_this.visible(undefined, true),
          style: {
            closed: function (d) { return d.closed; }
          }
        });
        m_this.dependentFeatures([m_lineFeature]);
      }
      var style = m_this.style();
      m_lineFeature.data(m_isolines.lines).style({
        antialiasing: style.antialiasing,
        lineCap: style.lineCap,
        lineJoin: style.lineJoin,
        miterLimit: style.miterLimit,
        strokeWidth: style.strokeWidth,
        strokeStyle: style.strokeStyle,
        strokeColor: style.strokeColor,
        strokeOffset: style.strokeOffset,
        strokeOpacity: style.strokeOpacity
      });
      if (m_isolines.hasLabels) {
        if (!m_labelFeature) {
          if (!(registry.registries.features[m_this.layer().rendererName()] || {}).text) {
            var renderer = registry.rendererForFeatures(['text']);
            m_labelLayer = registry.createLayer('feature', m_this.layer().map(), {renderer: renderer});
            m_this.layer().addChild(m_labelLayer);
            m_this.layer().node().append(m_labelLayer.node());
          }
          m_labelFeature = (m_labelLayer || m_this.layer()).createFeature('text', {
            selectionAPI: false,
            gcs: m_this.gcs(),
            visible: m_this.visible(undefined, true),
            style: {
              text: function (d) { return d.line.label; }
            }
          }).geoOn(geo_event.pan, m_this._updateLabelPositions);
        }
        textFeature.usedStyles.forEach(function (styleName) {
          if (styleName !== 'visible') {
            m_labelFeature.style(styleName, style[styleName]);
          }
        });
        m_this.dependentFeatures([m_lineFeature, m_labelFeature]);
      }
    } else if (m_lineFeature) {
      m_lineFeature.data([]);
    }
    m_this.buildTime().modified();
    /* Update label positions after setting the build time.  The labelPositions
     * method will build if necessary, and this prevents it from looping. */
    m_this.labelPositions();
    return m_this;
  };

  /**
   * Update.  Rebuild if necessary.
   *
   * @returns {this}
   */
  this._update = function () {
    s_update.call(m_this);

    if (m_this.dataTime().timestamp() >= m_this.buildTime().timestamp() ||
        m_this.updateTime().timestamp() <= m_this.timestamp()) {
      m_this._build();
    }
    m_this.updateTime().modified();
    return m_this;
  };

  /**
   * Redraw the object.
   *
   * @returns {object} The results of the superclass draw function.
   */
  this.draw = function () {
    var result = s_draw();
    if (m_lineFeature) {
      m_lineFeature.draw();
    }
    if (m_labelFeature) {
      m_labelFeature.draw();
    }
    return result;
  };

  /**
   * Destroy.
   */
  this._exit = function () {
    if (m_labelFeature) {
      if (m_labelLayer || m_this.layer()) {
        (m_labelLayer || m_this.layer()).deleteFeature(m_labelFeature);
      }
      if (m_labelLayer && m_this.layer()) {
        m_this.layer().removeChild(m_labelLayer);
      }
    }
    if (m_lineFeature && m_this.layer()) {
      m_this.layer().deleteFeature(m_lineFeature);
    }
    m_labelFeature = null;
    m_labelLayer = null;
    m_lineFeature = null;
    m_this.dependentFeatures([]);

    s_exit();
  };

  /**
   * Initialize.
   *
   * @param {geo.isolineFeature.spec} arg The isoline feature specification.
   */
  this._init = function (arg) {
    arg = arg || {};
    s_init.call(m_this, arg);

    var defaultStyle = $.extend(
      {},
      {
        opacity: 1.0,
        value: function (d, i) {
          return m_this.position()(d, i).z;
        },
        rotateWithMap: true,
        rotation: isolineFeature.rotationFunction(),
        strokeWidth: function (v, vi, d, di) { return d.level + 0.5; },
        strokeColor: {r: 0, g: 0, b: 0},
        textStrokeColor: {r: 1, g: 1, b: 1, a: 0.75},
        textStrokeWidth: 2,
        fontSize: '12px'
      },
      arg.style === undefined ? {} : arg.style
    );

    m_this.style(defaultStyle);

    m_this.isoline($.extend({}, {
      count: 15,
      autofit: true,
      levels: [5, 5],
      label: function (value) {
        return value.level >= 1;
      },
      labelSpacing: 200,
      labelViewport: 10000,
      labelAutoUpdate: true
    }, arg.mesh || {}, arg.contour || {}, arg.isoline || {}));

    if (arg.mesh || arg.contour || arg.isoline) {
      m_this.dataTime().modified();
    }
  };

  return this;
};

/**
 * Return a function that will rotate text labels in a specified orientation.
 * The results of this are intended to be used as the value of the `rotation`
 * style.
 *
 * @param {string} [mode='higher'] The rotation mode.  `higher` orients the top
 *   of the text to high values.  `lower` orients the top of the text to lower
 *   values.  `map` orients the top of the text so it is aligned to the isoline
 *   and biased toward the top of the map.  `screen` orients the top of the
 *   text so it is aligned to the isoline and biased toward the top of the
 *   display screen.
 * @param {geo.map} [map] The parent map.  Required for `screen` mode.
 * @returns {function} A function for the rotation style.
 */
isolineFeature.rotationFunction = function (mode, map) {
  var functionList = {
    higher: function (d) {
      return d.rotation;
    },
    lower: function (d) {
      return d.rotation + Math.PI;
    },
    map: function (d) {
      var r = d.rotation,
          rt = util.wrapAngle(r, true);
      if (rt > Math.PI / 2 || rt < -Math.PI / 2) {
        r += Math.PI;
      }
      return r;
    },
    screen: function (d) {
      var r = d.rotation,
          rt = util.wrapAngle(r + map.rotation(), true);
      if (rt > Math.PI / 2 || rt < -Math.PI / 2) {
        r += Math.PI;
      }
      return r;
    }
  };
  return functionList[mode] || functionList.higher;
};

inherit(isolineFeature, meshFeature);
module.exports = isolineFeature;
