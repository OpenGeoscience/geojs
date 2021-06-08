var $ = require('jquery');
var proj4 = require('proj4');
proj4 = proj4.__esModule ? proj4.default : proj4;

var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

var svgForeignObject = '<svg xmlns="http://www.w3.org/2000/svg">' +
  '<foreignObject width="100%" height="100%">' +
  '</foreignObject>' +
  '</svg>';

var m_timingData = {},
    m_timingKeepRecent = 200,
    m_threshold = 15,
    m_originalRequestAnimationFrame,
    m_htmlToImageSupport;

/**
 * Takes a variable number of arguments and returns the first numeric value
 * it finds.
 *
 * @param {...*} var_args Any number of arguments.
 * @returns {number} The first numeric argument, or `undefined` if there are no
 *      numeric arguments.
 * @private
 */
function setNumeric() {
  var i;
  for (i = 0; i < arguments.length; i += 1) {
    if (isFinite(arguments[i])) {
      return arguments[i];
    }
  }
}

/**
 * Contains utility classes and methods used by geojs.
 * @namespace geo.util
 */
var util = {
  /**
   * Check if a point is inside of a polygon.  The point and polygon must be in
   * the same coordinate system.  A point exactly on the edge is not considered
   * inside.
   *
   * @param {geo.point2D} point The test point.
   * @param {geo.point2D[]|geo.polygonObject} outer The outer boundary of the
   *    polygon or a polygon object that has both the inner and outer
   *    boundaries.
   * @param {Array.<geo.point2D[]>} [inner] A list of inner boundaries
   *    (holes).
   * @param {object} [range] If specified, this is the extent of the outer
   *    polygon and is used for early detection.
   * @param {geo.point2D} range.min The minimum value of coordinates in
   *    the outer polygon.
   * @param {geo.point2D} range.max The maximum value of coordinates in
   *    the outer polygon.
   * @returns {boolean} `true` if the point is inside or on the border of the
   *    polygon.
   * @memberof geo.util
   */
  pointInPolygon: function (point, outer, inner, range) {
    if (outer.outer) {
      inner = outer.inner;
      outer = outer.outer;
    }
    if (outer.length < 3) {
      // we need 3 coordinates for this to make sense
      return false;
    }
    if (range && range.min && range.max) {
      if (point.x < range.min.x || point.y < range.min.y ||
          point.x > range.max.x || point.y > range.max.y) {
        return false;
      }
    }
    return util.distanceToPolygon2d(point, inner ? {outer: outer, inner: inner} : outer, true) > 0;
  },

  /**
   * Return a point in the basis of the triangle.  If the point is located on
   * a vertex of the triangle, it will be at `vert0`: (0, 0), `vert1`:
   * (1, 0), `vert2`: (0, 1).  If it is within the triangle, its coordinates
   * will be 0 <= x <= 1, 0 <= y <= 1, x + y <= 1.  The point and vertices
   * must be in the same coordinate system.
   *
   * @param {geo.point2D} point The point to convert.
   * @param {geo.point2D} vert0 Vertex 0 of the triangle.
   * @param {geo.point2D} vert1 Vertex 1 (x direction) of the triangle.
   * @param {geo.point2D} vert2 Vertex 2 (y direction) of the triangle.
   * @returns {geo.point2D} The point in the triangle basis, or `undefined`
   *    if the triangle is degenerate.
   * @memberof geo.util
   */
  pointToTriangleBasis2d: function (point, vert0, vert1, vert2) {
    var a = vert1.x - vert0.x,
        b = vert2.x - vert0.x,
        c = vert1.y - vert0.y,
        d = vert2.y - vert0.y,
        x = point.x - vert0.x,
        y = point.y - vert0.y,
        det = a * d - b * c;
    if (det) {
      return {x: (x * d - y * b) / det, y: (x * -c + y * a) / det};
    }
  },

  /**
   * Check if an object an HTML Image element that is fully loaded.
   *
   * @param {object} img An object that might be an HTML Image element.
   * @param {boolean} [allowFailedImage] If `true`, an image element that has
   *     a source and has failed to load is also considered 'ready' in the
   *     sense that it isn't expected to change to a better state.
   * @returns {boolean} `true` if this is an image that is ready.
   * @memberof geo.util
   */
  isReadyImage: function (img, allowFailedImage) {
    if (img instanceof Image && img.complete && img.src) {
      if ((img.naturalWidth && img.naturalHeight) || allowFailedImage) {
        return true;
      }
    }
    return false;
  },

  /**
   * Check if an object an HTMLVideoElement element that is loaded.
   *
   * @param {object} vid An object that might be an HTMLVideoElement.
   * @param {boolean} [allowFailedVideo] If `true`, an viedo element that has
   *     a source and has failed to load is also considered 'ready' in the
   *     sense that it isn't expected to change to a better state.
   * @returns {boolean} `true` if this is a video that is ready.
   * @memberof geo.util
   */
  isReadyVideo: function (vid, allowFailedVideo) {
    if (vid instanceof HTMLVideoElement && vid.src &&
        vid.HAVE_CURRENT_DATA !== undefined) {
      if ((vid.videoWidth && vid.videoHeight && vid.readyState >= vid.HAVE_CURRENT_DATA) ||
          (allowFailedVideo && vid.error)) {
        return true;
      }
    }
    return false;
  },

  /**
   * Test if an object is a function.
   *
   * @param {object} f An object that might be a function.
   * @returns {boolean} `true` if the object is a function.
   * @memberof geo.util
   */
  isFunction: function (f) {
    return typeof f === 'function';
  },

  /**
   * Return a function.  If the supplied object is a function, return it.
   * Otherwise, return a function that returns the argument.
   *
   * @param {object} f An object that might be a function.
   * @returns {function} A function.  Either `f` or a function that returns
   *    `f`.
   * @memberof geo.util
   */
  ensureFunction: function (f) {
    if (util.isFunction(f)) {
      return f;
    } else {
      return function () { return f; };
    }
  },

  /**
   * Check if a value coerces to a number that is finite, not a NaN, and not
   * `null`, `false`, or the empty string.
   *
   * @param {object} val The value to check.
   * @returns {boolean} True if `val` is a non-null, non-false, finite number.
   */
  isNonNullFinite: function (val) {
    return isFinite(val) && val !== null && val !== false && val !== '';
  },

  /**
   * Return a random string of length n || 8.  The string consists of
   * mixed-case ASCII alphanumerics.
   *
   * @param {number} [n=8] The length of the string to return.
   * @returns {string} A string of random characters.
   * @memberof geo.util
   */
  randomString: function (n) {
    var s, i, r;
    n = n || 8;
    s = '';
    for (i = 0; i < n; i += 1) {
      r = Math.floor(Math.random() * chars.length);
      s += chars.substring(r, r + 1);
    }
    return s;
  },

  /**
   * Normalize a coordinate object into {@link geo.geoPosition} form.  The
   * input can be a 2 or 3 element array or an object with a variety of
   * properties.
   *
   * @param {object|array} p The point to convert.
   * @returns {geo.geoPosition} The point as an object with `x`, `y`, and `z`
   *    properties.
   * @memberof geo.util
   */
  normalizeCoordinates: function (p) {
    p = p || {};
    if (Array.isArray(p)) {
      return {
        x: p[0],
        y: p[1],
        z: p[2] || 0
      };
    }
    return {
      x: setNumeric(
        p.x,
        p.longitude,
        p.lng,
        p.lon,
        0
      ),
      y: setNumeric(
        p.y,
        p.latitude,
        p.lat,
        0
      ),
      z: setNumeric(
        p.z,
        p.elevation,
        p.elev,
        p.height,
        0
      )
    };
  },

  /**
   * Create an integer array contains elements from one integer to another
   * integer.
   *
   * @param {number} start The start integer.
   * @param {number} end The end integer.
   * @param {number} [step=1] The step.
   * @returns {number[]} An array of integers.
   * @memberof geo.util
   */
  range: function (start, end, step) {
    step = step || 1;
    var results = [];
    for (var i = start; i <= end; i += step) {
      results.push(i);
    }
    return results;
  },

  /**
   * Compare two arrays and return if their contents are equal.
   * @param {array} a1 First array to compare.
   * @param {array} a2 Second array to compare.
   * @returns {boolean} `true` if the contents of the arrays are equal.
   * @memberof geo.util
   */
  compareArrays: function (a1, a2) {
    return (a1.length === a2.length && a1.every(function (el, idx) {
      return el === a2[idx];
    }));
  },

  /**
   * Create a `vec3` that is always an array.  This should only be used if it
   * will not be used in a WebGL context.  Plain arrays usually use 64-bit
   * float values, whereas `vec3` defaults to 32-bit floats.
   *
   * @returns {array} Zeroed-out vec3 compatible array.
   * @memberof geo.util
   */
  vec3AsArray: function () {
    return [0, 0, 0];
  },

  /**
   * Create a `mat3` that is always an array.  This should only be used if it
   * will not be used in a WebGL context.  Plain arrays usually use 64-bit
   * float values, whereas `mat3` defaults to 32-bit floats.
   *
   * @returns {array} Identity `mat3` compatible array.
   * @memberof geo.util
   */
  mat3AsArray: function () {
    return [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ];
  },

  /**
   * Create a `mat4` that is always an array.  This should only be used if it
   * will not be used in a WebGL context.  Plain arrays usually use 64-bit
   * float values, whereas `mat4` defaults to 32-bit floats.
   *
   * @returns {array} Identity `mat4` compatible array.
   * @memberof geo.util
   */
  mat4AsArray: function () {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  },

  /**
   * Get a buffer for a vgl geometry source.  If a buffer already exists and
   * is the correct size, return it.  Otherwise, allocate a new buffer; any
   * data in an old buffer is discarded.
   *
   * @param {vgl.geometryData} geom The geometry to reference and modify.
   * @param {string} srcName The name of the source.
   * @param {number} len The number of elements for the array.
   * @param {number} [allowLarger=0.2] If the existing buffer is larger than
   *    requested, don't reallocate it unless it exceeds the size of
   *    `len * (1 + allowLarger)`.
   * @param {number} [allocateLarger=0.1] If reallocating an existing buffer,
   *    allocate `len * (1 + allocateLarger)` to reduce the need to reallocate
   *    on subsequent calls.  If this is the first allocation (the previous
   *    size was 0), `len` is allocated.
   * @returns {Float32Array} A buffer for the named source.
   * @memberof geo.util
   */
  getGeomBuffer: function (geom, srcName, len, allowLarger, allocateLarger) {
    allowLarger = allowLarger === undefined ? 0.2 : allowLarger;
    allocateLarger = allocateLarger === undefined ? 0.1 : allocateLarger;
    var src = geom.sourceByName(srcName),
        data = src.data(),
        allow = Math.floor((allowLarger + 1) * len);

    data = src.data();
    /* If the current buffer is either the length we want or no larger than a
     * factor of allowBigger more in size, just return it. */
    if (data instanceof Float32Array && (data.length === len || (data.length >= len && data.length <= allow))) {
      return data;
    }
    /* If we need to allocate a new buffer (smaller or larger), and we have an
     * existing, non-zero-length buffer, allocate a larger than needed buffer.
     * Add an extra factor of allocateLarger. */
    var allocate = len;
    if (data instanceof Float32Array && data.length && len && allocateLarger > 0) {
      allocate = Math.floor((allocateLarger + 1) * len);
    }
    data = new Float32Array(allocate);
    src.setData(data);
    return data;
  },

  /**
   * Ensure that the input and modifiers properties of all actions are
   * objects, not plain strings.
   *
   * @param {geo.actionRecord[]} actions An array of actions to adjust as
   *    needed.
   * @memberof geo.util
   */
  adjustActions: function (actions) {
    var action, i;
    for (i = 0; i < actions.length; i += 1) {
      action = actions[i];
      if ($.type(action.input) === 'string') {
        var actionEvents = {};
        actionEvents[action.input] = true;
        action.input = actionEvents;
      }
      if (!action.modifiers) {
        action.modifiers = {};
      }
      if ($.type(action.modifiers) === 'string') {
        var actionModifiers = {};
        actionModifiers[action.modifiers] = true;
        action.modifiers = actionModifiers;
      }
    }
  },

  /**
   * Add an action to the list of handled actions.
   *
   * @param {geo.actionRecord[]} actions An array of actions to adjust as
   *    needed.
   * @param {geo.actionRecord} action An object defining the action.  Use
   *    `action`, `name`, and `owner` to make this entry distinct if it will
   *    need to be removed later.
   * @param {boolean} toEnd The action is added at the beginning of the
   *    actions list unless `toEnd` is `true`.  Earlier actions prevent later
   *    actions with the similar input and modifiers.
   * @memberof geo.util
   */
  addAction: function (actions, action, toEnd) {
    if (toEnd) {
      actions.push(action);
    } else {
      actions.unshift(action);
    }
    util.adjustActions(actions);
  },

  /**
   * Check if an action is in the actions list.  An action matches if the
   * `action`, `name`, and `owner` match.  A `null` or `undefined` value will
   * match all actions.  If using a {@link geo.actionRecord} object, this is
   * the same as passing (`action.action`, `action.name`, `action.owner`).
   *
   * @param {geo.actionRecord[]} actions An array of actions to search.
   * @param {geo.actionRecord|string} action Either an action object or the
   *    name of an action.
   * @param {string} [name] Optional name associated with the action.
   * @param {string} [owner] Optional owner associated with the action.
   * @returns {geo.actionRecord?} The first matching action or `null`.
   * @memberof geo.util
   */
  hasAction: function (actions, action, name, owner) {
    if (action && action.action) {
      name = action.name;
      owner = action.owner;
      action = action.action;
    }
    for (var i = 0; i < actions.length; i += 1) {
      if ((!action || actions[i].action === action) &&
          (!name || actions[i].name === name) &&
          (!owner || actions[i].owner === owner)) {
        return actions[i];
      }
    }
    return null;
  },

  /**
   * Remove all matching actions.  Actions are matched as with `hasAction`.
   *
   * @param {geo.actionRecord[]} actions An array of actions to adjust as
   *    needed.
   * @param {geo.actionRecord|string} action Either an action object or the
   *    name of an action.
   * @param {string} [name] Optional name associated with the action.
   * @param {string} [owner] Optional owner associated with the action.
   * @returns {number} The number of actions that were removed.
   * @memberof geo.util
   */
  removeAction: function (actions, action, name, owner) {
    var found, removed = 0;

    do {
      found = util.hasAction(actions, action, name, owner);
      if (found) {
        actions.splice($.inArray(found, actions), 1);
        removed += 1;
      }
    } while (found);
    return removed;
  },

  /**
   * Determine if the current inputs and modifiers match a known action.
   *
   * @param {object} inputs Aan object where each input that is currently
   *    active is truthy.  Common inputs are `left`, `right`, `middle`,
   *    `wheel`, `pan`, `rotate`.
   * @param {object} modifiers An object where each currently applied
   *    modifier is truthy.  Common modifiers are `shift`, `ctrl`, `alt`,
   *    `meta`.
   * @param {geo.actionRecord[]} actions A list of actions to compare to the
   *    inputs and modifiers.  The first action that matches will be
   *    returned.
   * @returns {geo.actionRecord} A matching action or `undefined`.
   * @memberof geo.util
   */
  actionMatch: function (inputs, modifiers, actions) {
    var matched;

    /* actions must have already been processed by adjustActions */
    if (actions.some(function (action) {
      for (var input in action.input) {
        if (action.input.hasOwnProperty(input)) {
          if ((action.input[input] === false && inputs[input]) ||
              (action.input[input] && !inputs[input])) {
            return false;
          }
        }
      }
      for (var modifier in action.modifiers) {
        if (action.modifiers.hasOwnProperty(modifier)) {
          if ((action.modifiers[modifier] === false && modifiers[modifier]) ||
              (action.modifiers[modifier] && !modifiers[modifier])) {
            return false;
          }
        }
      }
      matched = action;
      return true;
    })) {
      return matched;
    }
  },

  /**
   * Return recommended defaults for map parameters and osm or tile layer
   * parameters where the expected intent is to use the map in pixel
   * coordinates (upper left is (0, 0), lower right is (`width`, `height`).
   *
   * @example <caption>The returned objects can be modified or
   *    extended.</caption>
   * var results = pixelCoordinateParams('#map', 10000, 9000);
   * var map = geo.map($.extend(results.map, {clampZoom: false}));
   * map.createLayer('osm', results.layer);
   *
   * @param {string} [node] DOM selector for the map container.
   * @param {number} width Width of the whole map contents in pixels.
   * @param {number} height Height of the whole map contents in pixels.
   * @param {number} [tileWidth] If an osm or tile layer is going to be used,
   *    the width of a tile.
   * @param {number} [tileHeight] If an osm or tile layer is going to be used,
   *    the height of a tile.
   * @returns {object} An object with `map` and `layer` properties.  `map` is
   *    an object that can be passed to {@link geo.map}, and `layer` is an
   *    object that can be passed to `map.createLayer`.
   * @memberof geo.util
   */
  pixelCoordinateParams: function (node, width, height, tileWidth, tileHeight) {
    var mapW, mapH, tiled;
    if (node) {
      node = $(node);
      mapW = node.innerWidth();
      mapH = node.innerHeight();
    }
    tileWidth = tileWidth || width;
    tileHeight = tileHeight || height;
    tiled = (tileWidth !== width || tileHeight !== height);
    var minLevel = Math.min(0, Math.floor(Math.log(Math.min(
          (mapW || tileWidth) / tileWidth,
          (mapH || tileHeight) / tileHeight)) / Math.log(2))),
        maxLevel = Math.ceil(Math.log(Math.max(
          width / tileWidth,
          height / tileHeight)) / Math.log(2));
    var mapParams = {
      node: node,
      ingcs: '+proj=longlat +axis=esu',
      gcs: '+proj=longlat +axis=enu',
      maxBounds: {left: 0, top: 0, right: width, bottom: height},
      unitsPerPixel: Math.pow(2, maxLevel),
      center: {x: width / 2, y: height / 2},
      min: minLevel,
      max: maxLevel,
      zoom: minLevel,
      clampBoundsX: true,
      clampBoundsY: true,
      clampZoom: true
    };
    var layerParams = {
      maxLevel: maxLevel,
      wrapX: false,
      wrapY: false,
      tileOffset: function () {
        return {x: 0, y: 0};
      },
      attribution: '',
      tileWidth: tileWidth,
      tileHeight: tileHeight,
      tileRounding: Math.ceil,
      tilesAtZoom: tiled ? function (level) {
        var scale = Math.pow(2, maxLevel - level);
        return {
          x: Math.ceil(width / tileWidth / scale),
          y: Math.ceil(height / tileHeight / scale)
        };
      } : undefined,
      tilesMaxBounds: tiled ? function (level) {
        var scale = Math.pow(2, maxLevel - level);
        return {
          x: Math.floor(width / scale),
          y: Math.floor(height / scale)
        };
      } : undefined
    };
    return {map: mapParams, layer: layerParams};
  },

  /**
   * Return the coordinate associated with the center of the perimeter formed
   * from a list of points.  This averages all of the vertices in the perimeter
   * weighted by the line length on either side of each point.  Functionally,
   * this is the same as the average of all the points of the lines of the
   * perimeter.
   *
   * @param {geo.geoPosition[]} coor An array of coordinates.
   * @returns {geo.geoPosition|undefined} The position for the center, or
   *    `undefined` if no such position exists.
   * @memberof geo.util
   */
  centerFromPerimeter: function (coor) {
    var position, p0, p1, w, sumw, i;
    if (!coor || !coor.length) {
      return;
    }
    if (coor.length === 1) {
      return {x: coor[0].x, y: coor[0].y};
    }
    position = {x: 0, y: 0};
    sumw = 0;
    p0 = coor[coor.length - 1];
    for (i = 0; i < coor.length; i += 1) {
      p1 = p0;
      p0 = coor[i];
      w = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
      position.x += (p0.x + p1.x) * w;
      position.y += (p0.y + p1.y) * w;
      sumw += 2 * w;
    }
    position.x /= sumw;
    position.y /= sumw;
    // return a copy of p0 if all points are the same
    return sumw ? position : {x: p0.x, y: p0.y};
  },

  /**
   * Get the square of the Euclidean 2D distance between two points.
   *
   * @param {geo.geoPosition} pt1 The first point.
   * @param {geo.geoPosition} pt2 The second point.
   * @returns {number} The distance squared.
   */
  distance2dSquared: function (pt1, pt2) {
    var dx = pt1.x - pt2.x,
        dy = pt1.y - pt2.y;
    return dx * dx + dy * dy;
  },

  /**
   * Get the square of the Euclidean 2D distance between a point and a line
   * segment.
   *
   * @param {geo.geoPosition} pt The point.
   * @param {geo.geoPosition} line1 One end of the line.
   * @param {geo.geoPosition} line2 The other end of the line.
   * @returns {number} The distance squared.
   * @memberof geo.util
   */
  distance2dToLineSquared: function (pt, line1, line2) {
    var dx = line2.x - line1.x,
        dy = line2.y - line1.y,
        // we could get the line length from the distance2dSquared function,
        // but since we need dx and dy in this function, it is faster to just
        // compute it here.
        lengthSquared = dx * dx + dy * dy,
        t = 0;
    if (lengthSquared) {
      t = ((pt.x - line1.x) * dx + (pt.y - line1.y) * dy) / lengthSquared;
      t = Math.max(0, Math.min(1, t));
    }
    return util.distance2dSquared(pt, {
      x: line1.x + t * dx,
      y: line1.y + t * dy
    });
  },

  /**
   * Get the signed Euclidean 2D distance between a point and a polygon.  The
   * distance is positive if the point is inside of the polygon.
   *
   * @param {geo.geoPosition} pt The point.
   * @param {geo.polygonObject} poly The polygon.
   * @param {boolean} [onlySign] If truthy, only the sign of the answer is
   *    significant.
   * @returns {number} The signed distance.
   * @memberof geo.util
   */
  distanceToPolygon2d: function (pt, poly, onlySign) {
    let outer = poly.outer || poly;
    let inside = false,
        minDistSq, distSq, dist;
    for (let i = 0, len = outer.length, j = len - 1; i < len; j = i, i += 1) {
      let p0 = outer[i],
          p1 = outer[j];
      if (((p0.y > pt.y) !== (p1.y > pt.y)) && (pt.x < (p1.x - p0.x) * (pt.y - p0.y) / (p1.y - p0.y) + p0.x)) {
        inside = !inside;
      }
      distSq = onlySign ? 1 : util.distance2dToLineSquared(pt, p0, p1);
      if (minDistSq === undefined || distSq < minDistSq) {
        minDistSq = distSq;
      }
    }
    if (poly.inner) {
      poly.inner.forEach(inner => {
        let innerDist = util.distanceToPolygon2d(pt, inner, onlySign);
        if (innerDist * innerDist < minDistSq) {
          minDistSq = innerDist * innerDist;
        }
        if (innerDist > 0) {
          inside = !inside;
        }
      });
    }
    dist = (inside ? 1 : -1) * Math.sqrt(minDistSq);
    return dist;
  },

  /**
   * Get twice the signed area of a 2d triangle.
   *
   * @param {geo.geoPosition} pt1 A vertex.
   * @param {geo.geoPosition} pt2 A vertex.
   * @param {geo.geoPosition} pt3 A vertex.
   * @returns {number} Twice the signed area.
   * @memberof geo.util
   */
  triangleTwiceSignedArea2d: function (pt1, pt2, pt3) {
    return (pt2.y - pt1.y) * (pt3.x - pt2.x) - (pt2.x - pt1.x) * (pt3.y - pt2.y);
  },

  /**
   * Determine if a line segment crosses any line segments of a polygon.
   *
   * @param {geo.geoPosition} pt1 One endpoint of the line.
   * @param {geo.geoPosition} pt2 The other endpoint of the line.
   * @param {geo.polygonObject} poly The polygon.
   * @returns {boolean} True if the segment cross any segment of the polygon.
   * @memberof geo.util
   */
  crossedLineSegmentPolygon2d: function (pt1, pt2, poly) {
    let outer = poly.outer || poly,
        len = outer.length, i, j;
    for (i = 0, j = len - 1; i < len; j = i, i += 1) {
      if (util.crossedLineSegments2d(pt1, pt2, outer[i], outer[j])) {
        return true;
      }
    }
    if (poly.inner) {
      for (i = 0; i < poly.inner.length; i += 1) {
        if (util.crossedLineSegmentPolygon2d(pt1, pt2, poly.inner[i])) {
          return true;
        }
      }
    }
    return false;
  },

  /**
   * Determine if two line segments cross.  They are not considered crossing if
   * they share a vertex.  They are crossing if either of one segment's
   * vertices are colinear with the other segment.
   *
   * @param {geo.geoPosition} seg1pt1 One endpoint of the first segment.
   * @param {geo.geoPosition} seg1pt2 The other endpoint of the first segment.
   * @param {geo.geoPosition} seg2pt1 One endpoint of the second segment.
   * @param {geo.geoPosition} seg2pt2 The other endpoint of the second segment.
   * @returns {boolean} True if the segments cross.
   * @memberof geo.util
   */
  crossedLineSegments2d: function (seg1pt1, seg1pt2, seg2pt1, seg2pt2) {
    /* If the segments don't have any overlap in x or y, they can't cross */
    if ((seg1pt1.x > seg2pt1.x && seg1pt1.x > seg2pt2.x &&
         seg1pt2.x > seg2pt1.x && seg1pt2.x > seg2pt2.x) ||
        (seg1pt1.x < seg2pt1.x && seg1pt1.x < seg2pt2.x &&
         seg1pt2.x < seg2pt1.x && seg1pt2.x < seg2pt2.x) ||
        (seg1pt1.y > seg2pt1.y && seg1pt1.y > seg2pt2.y &&
         seg1pt2.y > seg2pt1.y && seg1pt2.y > seg2pt2.y) ||
        (seg1pt1.y < seg2pt1.y && seg1pt1.y < seg2pt2.y &&
         seg1pt2.y < seg2pt1.y && seg1pt2.y < seg2pt2.y)) {
      return false;
    }
    /* If any vertex is in common, it is not considered crossing */
    if ((seg1pt1.x === seg2pt1.x && seg1pt1.y === seg2pt1.y) ||
        (seg1pt1.x === seg2pt2.x && seg1pt1.y === seg2pt2.y) ||
        (seg1pt2.x === seg2pt1.x && seg1pt2.y === seg2pt1.y) ||
        (seg1pt2.x === seg2pt2.x && seg1pt2.y === seg2pt2.y)) {
      return false;
    }
    /* If the lines cross, the signed area of the triangles formed between one
     * segment and the other's vertices will have different signs.  By using
     * > 0, colinear points are crossing. */
    if (util.triangleTwiceSignedArea2d(seg1pt1, seg1pt2, seg2pt1) *
        util.triangleTwiceSignedArea2d(seg1pt1, seg1pt2, seg2pt2) > 0 ||
        util.triangleTwiceSignedArea2d(seg2pt1, seg2pt2, seg1pt1) *
        util.triangleTwiceSignedArea2d(seg2pt1, seg2pt2, seg1pt2) > 0) {
      return false;
    }
    return true;
  },

  /**
   * Check if a line segment crosses any segment from a list of lines.  The
   * segment is considered crossing it it touches a line segment, unless that
   * line segment shares a vertex with the segment.
   *
   * @param {geo.geoPosition} pt1 One end of the line segment.
   * @param {geo.geoPosition} pt2 The other end of the line segment.
   * @param {Array.<geo.geoPosition[]>} lineList A list of open lines.  Each
   *    line is a list of vertices.  The line segment is checked against each
   *    segment of each line in this list.
   * @returns {boolean} True if the segment crosses any line segment.
   * @memberof geo.util
   */
  segmentCrossesLineList2d: function (pt1, pt2, lineList) {
    var result = lineList.some(function (line) {
      return line.some(function (linePt, idx) {
        if (idx) {
          return util.crossedLineSegments2d(pt1, pt2, line[idx - 1], linePt);
        }
      });
    });
    return result;
  },

  /**
   * Remove vertices from a chain of 2d line segments so that it is simpler but
   * is close to the original overall shape within some tolerance limit.  This
   * is the Ramer–Douglas–Peucker algorithm.  The first and last points will
   * always remain the same for open lines.  For closed lines (polygons), this
   * picks an point that likely to be significant and then reduces it, possibly
   * returning a single point.
   *
   * @param {geo.geoPosition[]} pts A list of points forming the line or
   *    polygon.
   * @param {number} tolerance The maximum variation allowed.  A value of zero
   *    will only remove perfectly colinear points.
   * @param {boolean} [closed] If true, this is a polygon rather than an open
   *    line.  In this case, it is possible to get back a single point.
   * @param {Array.<geo.geoPosition[]>?} [noCrossLines] A falsy value to allow
   *    the resultant line to cross itself, an empty array (`[]`) to prevent
   *    self-crossing, or an array of line segments to prevent self-crossing
   *    and disallow crossing any line segment in the list.  Each entry in the
   *    list is an open line (with one segment less than the number of
   *    vertices).  If self-crossing is prohibited, the resultant point set
   *    might not be as simplified as it could be.
   * @returns {geo.geoPosition[]} The new point set.
   * @memberof geo.util
   */
  rdpLineSimplify: function (pts, tolerance, closed, noCrossLines) {
    if (pts.length <= 2 || tolerance < 0) {
      return pts;
    }
    var i, distSq, maxDistSq = -1, index, toleranceSq = tolerance * tolerance;
    if (closed) {
      /* If this is closed, find the point that is furthest from the first
       * point.  ideally, one would find a point that is guaranteed to be on
       * the diameter of the convex hull, but doing so is an O(n^2) operation,
       * whereas this is sufficient and only O(n).  The chosen point is
       * duplicated at the start and end of the chain. */
      for (i = 1; i < pts.length; i += 1) {
        distSq = util.distance2dSquared(pts[0], pts[i]);
        if (distSq > maxDistSq) {
          maxDistSq = distSq;
          index = i;
        }
      }
      /* Points could be on any side of the start point, so if all points are
       * within 1/2 of the tolerance of the start point, we know all points are
       * within the tolerance of each other and therefore this polygon or
       * closed line can be simplified to a point. */
      if (maxDistSq * 4 <= toleranceSq) {
        return pts.slice(index, index + 1);
      }
      pts = pts.slice(index).concat(pts.slice(0, index + 1));
      pts = util.rdpLineSimplify(pts, tolerance, false, noCrossLines);
      /* Removed the duplicated first point */
      pts.splice(pts.length - 1);
      return pts;
    }
    for (i = 1; i < pts.length - 1; i += 1) {
      distSq = util.distance2dToLineSquared(pts[i], pts[0], pts[pts.length - 1]);
      if (distSq > maxDistSq) {
        maxDistSq = distSq;
        index = i;
      }
    }
    /* We can collapse this to a single line if it is within the tolerance and
     * we are either allowed to self-cross or it does not self-cross the rest
     * of the line. */
    if (maxDistSq <= toleranceSq && (!noCrossLines || !util.segmentCrossesLineList2d(
      pts[0], pts[pts.length - 1], noCrossLines))) {
      return [pts[0], pts[pts.length - 1]];
    }
    var left = pts.slice(0, index + 1),
        right = pts.slice(index),
        leftSide = util.rdpLineSimplify(
          left, tolerance, false,
          noCrossLines ? noCrossLines.concat([right]) : null),
        rightSide = util.rdpLineSimplify(
          right, tolerance, false,
          noCrossLines ? noCrossLines.concat([left]) : null);
    return leftSide.slice(0, leftSide.length - 1).concat(rightSide);
  },

  /**
   * Given an array, return the minimum and maximum values within the array.
   * If a numeric value is specified for one or the other, return that instead.
   *
   * @param {number[]} values An array of numeric values.
   * @param {number} [min] If specified, use this instead of calculating the
   *    minimum.
   * @param {number} [max] If specified, use this instead of calculating the
   *    maximum.
   * @param {boolean} [limit=false] If truthy, if `min` is specified, the
   *    returned `min` will be the larger of the specified value and the
   *    computed value, and if `max` is specified, the returned value will
   *    be the smaller of the specified value and the computed value.
   * @returns {object} An object with `min` and `max`, both numbers.  If the
   *    array is empty, `undefined` may be returned for the `min` and `max`.
   * @memberof geo.util
   */
  getMinMaxValues: function (values, min, max, limit) {
    if (values.length && (limit || !$.isNumeric(min) || !$.isNumeric(max))) {
      var minValue = values[0],
          maxValue = values[0],
          value, i;
      for (i = values.length - 1; i > 0; i -= 1) {
        value = values[i];
        if (value < minValue) { minValue = value; }
        if (value > maxValue) { maxValue = value; }
      }
      if (!$.isNumeric(min) || (limit && minValue > min)) {
        min = minValue;
      }
      if (!$.isNumeric(max) || (limit && maxValue < max)) {
        max = maxValue;
      }
    }
    return {min: min, max: max};
  },

  /**
   * Given a value in radians, return a value wrapped to the range [-PI, PI).
   *
   * @param {number} value A value in radians.
   * @returns {number} The wrapped value.
   * @memberof geo.util
   */
  wrapAngle: function (value) {
    /* Module will only ensure that this is between [-2 PI, 2 PI). */
    value = value % (Math.PI * 2);
    if (value < -Math.PI) {
      value += Math.PI * 2;
    } else if (value >= Math.PI) {
      value -= Math.PI * 2;
    }
    return value;
  },

  /**
   * Escape any character in a string that has a code point >= 127.
   *
   * @param {string} text The string to escape.
   * @returns {string} The escaped string.
   * @memberof geo.util
   */
  escapeUnicodeHTML: function (text) {
    return text.replace(/./g, function (k) {
      var code = k.charCodeAt();
      if (code < 127) {
        return k;
      }
      return '&#' + code.toString(10) + ';';
    });
  },

  /**
   * Check svg image and html img tags.  If the source is set, load images
   * explicitly and convert them to local data:image references.
   *
   * @param {jQuery.selector} elem A jQuery selector or element set that may
   *    contain images.
   * @returns {jQuery.Deferred[]} A list of deferred objects that resolve
   *    when images are dereferenced.
   * @memberof geo.util
   */
  dereferenceElements: function (elem) {
    var deferList = [];

    $('img,image', elem).each(function () {
      var src = $(this);
      var key = src.is('image') ? 'href' : 'src';
      if (src.attr(key)) {
        var img = new Image();
        if (src.attr(key).substr(0, 4) === 'http' || src[0].crossOrigin) {
          img.crossOrigin = src[0].crossOrigin || 'anonymous';
        }
        var defer = $.Deferred();
        img.onload = function () {
          var cvs = document.createElement('canvas');
          cvs.width = img.naturalWidth;
          cvs.height = img.naturalHeight;
          cvs.getContext('2d').drawImage(img, 0, 0);
          src.attr(key, cvs.toDataURL('image/png'));
          if (src.attr(key).substr(0, 10) !== 'data:image') {
            src.remove();
          }
          defer.resolve();
        };
        img.onerror = function () {
          src.remove();
          defer.resolve();
        };
        img.src = src.attr(key);
        deferList.push(defer);
      }
    });
    return deferList;
  },

  dereferenceCssUrlsRegex: /url\(["']?(http[^)"']+|[^:)"']+)["']?\)/g,

  /**
   * Check css text.  Any url(http[s]...) references are dereferenced and
   * stored as local base64 urls.
   *
   * @param {string} css The css to parse for urls.
   * @param {jQuery.selector|DOMElement} styleElem The element that receivs
   *    the css text after dereferencing or the DOM element that has style
   *    that will be updated.
   * @param {jQuery.Deferred} styleDefer A Deferred to resolve once
   *    dereferencing is complete.
   * @param {string} [styleKey] If unset, styleElem is a header element.  If
   *    set, styleElem is a DOM element and the named style will be updated.
   * @param {string} [baseUrl] If present, this is the base for relative urls.
   * @memberof geo.util
   */
  dereferenceCssUrls: function (css, styleElem, styleDefer, styleKey, baseUrl) {
    var deferList = [],
        results = [];

    /* Remove comments to avoid dereferencing commented out sections.
     * To match across lines, use [^\0] rather than . */
    css = css.replace(/\/\*[^\0]*?\*\//g, '');
    /* reduce whitespace to make the css shorter */
    css = css.replace(/\r/g, '\n').replace(/\s+\n/g, '\n')
             .replace(/\n\s+/g, '\n').replace(/\n\n+/g, '\n');
    if (baseUrl) {
      var match = /(^[^?#]*)\/[^?#/]*([?#]|$)/g.exec(baseUrl);
      baseUrl = match && match[1] ? match[1] + '/' : null;
    }
    css.replace(util.dereferenceCssUrlsRegex, function (match, url) {
      var idx = deferList.length,
          defer = $.Deferred(),
          xhr = new XMLHttpRequest();
      deferList.push(defer);
      results.push('');

      if (/^[^/:][^:]*(\/|$)/g.exec(url) && baseUrl) {
        url = baseUrl + url;
      }
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function () {
        if (this.status === 200) {
          var response = new Uint8Array(this.response),
              data = new Array(response.length),
              i;
          for (i = 0; i < response.length; i += 1) {
            data[i] = String.fromCharCode(response[i]);
          }
          data = data.join('');
          results[idx] = 'url(data:' + xhr.getResponseHeader('content-type') + ';base64,' + btoa(data) + ')';
        }
        // resolve regardless of what response we get
        defer.resolve();
      };
      // if this fails, resolve anyway
      xhr.onerror = defer.resolve;
      xhr.send();
      return match;
    });
    $.when.apply($, deferList).then(function () {
      var idx = 0;
      css = css.replace(util.dereferenceCssUrlsRegex, function (match, url) {
        idx += 1;
        return results[idx - 1];
      });
      if (styleKey === undefined) {
        styleElem.text(css);
      } else {
        styleElem.style[styleKey] = css;
      }
      styleDefer.resolve();
    });
  },

  /**
   * Check if the current browser supports covnerting html to an image via an
   * svg foreignObject and canvas.  If this has not been checked before, it
   * returns a Deferred that resolves to a boolean (never rejects).  If the
   * check has been done before, it returns a boolean.
   *
   * @returns {boolean|jQuery.Deferred}
   * @memberof geo.util
   */
  htmlToImageSupported: function () {
    if (m_htmlToImageSupport === undefined) {
      var defer = $.Deferred();
      var svg = $(svgForeignObject);
      svg.attr({
        width: '10px',
        height: '10px',
        'text-rendering': 'optimizeLegibility'
      });
      $('foreignObject', svg).append('<div/>');
      var img = new Image();
      img.onload = img.onerror = function () {
        var canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        var context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);
        try {
          canvas.toDataURL();
          m_htmlToImageSupport = true;
        } catch (err) {
          console.warn(
            'This browser does not support converting HTML to an image via ' +
            'SVG foreignObject.  Some functionality will be limited.', err);
          m_htmlToImageSupport = false;
        }
        defer.resolve(m_htmlToImageSupport);
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(util.escapeUnicodeHTML(
        new XMLSerializer().serializeToString(svg[0])));
      return defer;
    }
    return m_htmlToImageSupport;
  },

  /**
   * Convert an html element to an image.  This attempts to localize any
   * images within the element.  If there are other external references, the
   * image may not work due to security considerations.
   *
   * @param {jQuery.selector} elem Either a jquery selector or an HTML
   *    element.  This may contain multiple elements.  The direct parent and
   *    grandparent of the element are used for class information.
   * @param {number} [parents] Number of layers up to travel to get class
   *    information.
   * @returns {jQuery.Deferred} A jquery deferred object which receives an
   *    HTML Image element when resolved.
   * @memberof geo.util
   */
  htmlToImage: function (elem, parents) {
    var defer = $.Deferred(),
        deferList = [util.htmlToImageSupported()],
        container;

    var parent = $(elem);
    elem = $(elem).clone();
    while (parents && parents > 0) {
      parent = parent.parent();
      if (parent.is('div')) {
        /* Create a containing div with the parent's class and id (so css
         * will be used), but override size and background. */
        container = $('<div>').attr({
          'class': parent.attr('class'),
          id: parent.attr('id')
        }).css({
          width: '100%',
          height: '100%',
          background: 'none',
          margin: 0
        });
        container.append(elem);
        elem = container;
      }
      parents -= 1;
    }
    // canvas elements won't render properly here.
    $('canvas', elem).remove();
    /* Walk through all of the children of elem and check if any explicitly set
     * css property needs to be dereferenced. */
    $('*', elem).addBack().each(function () {
      var style = this.style;
      for (var idx = 0; idx < style.length; idx += 1) {
        var key = this.style[idx];
        if (this.style[key].match(util.dereferenceCssUrlsRegex)) {
          var styleDefer = $.Deferred();
          util.dereferenceCssUrls(this.style[key], this, styleDefer, key);
          deferList.push(styleDefer);
        }
      }
    });
    container = $('<div xmlns="http://www.w3.org/1999/xhtml">');
    container.css({
      width: parent.width() + 'px',
      height: parent.height() + 'px'
    });
    container.append($('<head>'));
    var body = $('<body>');
    container.append(body);
    /* We must specify the new body as having no background, or we'll clobber
     * other layers. */
    body.css({
      width: parent.width() + 'px',
      height: parent.height() + 'px',
      background: 'none',
      margin: 0
    });
    body.append(elem);
    deferList = deferList.concat(util.dereferenceElements(elem));
    /* Get styles and links in order, as order matters in css */
    $('style,link[rel="stylesheet"]').each(function () {
      var styleElem = $('<style type="text/css">'),
          styleDefer = $.Deferred();
      if ($(this).is('style')) {
        var css = $(this).text();
        util.dereferenceCssUrls(css, styleElem, styleDefer);
      } else {
        var href = $(this).attr('href');
        $.get(href).done(function (css) {
          util.dereferenceCssUrls(css, styleElem, styleDefer, undefined, href);
        }).fail(function (xhr, status, err) {
          console.warn('Failed to dereference ' + href, status, err);
          styleElem.remove();
          styleDefer.resolve();
        });
      }
      deferList.push(styleDefer);
      $('head', container).append(styleElem);
    });

    $.when.apply($, deferList).then(function () {
      var svg = $(svgForeignObject);
      svg.attr({
        width: parent.width() + 'px',
        height: parent.height() + 'px',
        // Adding this via the attr call works in Firefox headless, whereas if
        // it is part of the svgForeignObject string, it does not.
        'text-rendering': 'optimizeLegibility'
      });
      $('foreignObject', svg).append(container);

      var img = new Image();
      if (!util.htmlToImageSupported()) {
        defer.resolve(img);
      } else {
        img.onload = function () {
          defer.resolve(img);
        };
        img.onerror = function () {
          console.warn('Failed to render html to image');
          defer.reject();
        };
        // Firefox requires the HTML to be base64 encoded.  Chrome doesn't, but
        // doing so does no harm.
        img.src = 'data:image/svg+xml;base64,' + btoa(util.escapeUnicodeHTML(
          new XMLSerializer().serializeToString(svg[0])));
      }
    });
    return defer;
  },

  /**
   * Report on one or all of the tracked timings.
   *
   * @param {string} [name] A name to report on, or `undefined` to report all.
   * @returns {object} An object with timing information, or an object with
   *    properties for all tracked timings, each of which contains timing
   *    information.
   * @memberof geo.util
   */
  timeReport: function (name) {
    $.each(m_timingData, function (key, item) {
      /* calculate the standard deviation of each item. */
      if (item.count) {
        item.stddev = Math.sqrt(Math.abs((
          item.sum2 - item.sum * item.sum / item.count) / item.count));
        item.average = item.sum / item.count;
      } else {
        item.stddev = 0;
        item.average = 0;
      }
    });
    if (name) {
      return m_timingData[name];
    }
    return m_timingData;
  },

  /**
   * Note the start time of a function (or any other section of code).  This
   * should be paired with `timeFunctionStop`, which will collect statistics on
   * the amount of time spent in a function.
   *
   * @param {string} name Name to use for tracking the timing.
   * @param {boolean} reset If `true`, clear old tracking data for this named
   *    tracker.
   * @memberof geo.util
   */
  timeFunctionStart: function (name, reset) {
    if (!m_timingData[name] || reset) {
      m_timingData[name] = {
        count: 0, sum: 0, sum2: 0, max: 0, recent: []
      };
    }
    m_timingData[name].start = window.performance.now();
  },

  /**
   * Note the stop time of a function (or any other section of code).  This
   * should be paired with `timeFunctionStart`.
   *
   * @param {string} name Name to use for tracking the timing.
   * @memberof geo.util
   */
  timeFunctionStop: function (name) {
    if (!m_timingData[name] || !m_timingData[name].start) {
      return;
    }
    var duration = window.performance.now() - m_timingData[name].start;
    m_timingData[name].start = null;
    m_timingData[name].sum += duration;
    m_timingData[name].sum2 += duration * duration;
    m_timingData[name].count += 1;
    m_timingData[name].max = Math.max(
      m_timingData[name].max, duration);
    m_timingData[name].recent.push(duration);
    if (m_timingData[name].recent.length > m_timingKeepRecent) {
      m_timingData[name].recent.splice(
        0, m_timingData[name].recent.length - m_timingKeepRecent);
    }
  },

  /**
   * Start or stop tracking the time spent in `requestAnimationFrame`.  If
   * tracked, the results can be fetched via
   * `timeFunctionReport('requestAnimationFrame')`.
   *
   * @param {boolean} [stop] Falsy to start tracking, truthy to start tracking.
   * @param {boolean} [reset] If truthy, reset the statistics.
   * @param {number} [threshold=15] If present, set the threshold in
   *    milliseconds used in tracking slow callbacks.
   * @param {number} [keep=200] If present, set the number of recent frame
   *    times to track.
   * @memberof geo.util
   */
  timeRequestAnimationFrame: function (stop, reset, threshold, keep) {
    if (!m_timingData.requestAnimationFrame || reset) {
      m_timingData.requestAnimationFrame = {
        count: 0,
        sum: 0,
        sum2: 0,
        max: 0,
        above_threshold: 0,
        recent: [],
        recentsub: []
      };
    }
    if (threshold) {
      m_threshold = threshold;
    }
    if (keep) {
      m_timingKeepRecent = keep;
    }
    if (stop && m_originalRequestAnimationFrame) {
      window.requestAnimationFrame = m_originalRequestAnimationFrame;
      m_originalRequestAnimationFrame = null;
    } else if (!stop && !m_originalRequestAnimationFrame) {
      m_originalRequestAnimationFrame = window.requestAnimationFrame;
      window.requestAnimationFrame = function (callback) {
        return m_originalRequestAnimationFrame.call(window, function (timestamp) {
          var track = m_timingData.requestAnimationFrame, recent;
          /* Some environments have unsynchronized performance and time
           * counters.  The nowDelta factor compensates for this.  For
           * instance, our test environment has performance.now() values on
           * the order of ~3000 and timestamps approximating epoch. */
          if (track.timestamp !== timestamp) {
            track.nowDelta = window.performance.now() - timestamp;
            if (Math.abs(track.nowDelta) < 1000) {
              track.nowDelta = 0;
            }
            track.timestamp = timestamp;
            track.subcalls = track.subcalls || 0;
            track.start = {
              sum: track.sum,
              sum2: track.sum2,
              count: track.count,
              max: track.max,
              above_threshold: track.above_threshold
            };
            track.recent.push([0]);
            track.recentsub.push([]);
            if (track.recent.length > m_timingKeepRecent) {
              track.recent.splice(
                0, track.recent.length - m_timingKeepRecent);
              track.recentsub.splice(
                0, track.recentsub.length - m_timingKeepRecent);
            }
          }
          track.subcalls += 1;
          callback.apply(this, arguments);
          var duration = window.performance.now() - timestamp;
          duration -= track.nowDelta;
          track.sum = track.start.sum + duration;
          track.sum2 = track.start.sum2 + duration * duration;
          track.count = track.start.count + 1;
          track.max = Math.max(track.max, duration);
          track.above_threshold = track.start.above_threshold + (
            duration >= m_threshold ? 1 : 0);
          track.recent[track.recent.length - 1] = duration;
          recent = track.recentsub[track.recent.length - 1];
          recent.push({
            total_duration: duration,
            duration: duration - (recent.length ?
              recent[recent.length - 1].total_duration : 0),
            callback: callback.name || callback
          });
        });
      };
    }
  },

  /**
   * Test if an item is an object.  This uses typeof not instanceof, since
   * instanceof will return false for some things that we expect to be objects.
   *
   * @param {*} value The item to test.
   * @returns {boolean} True if the tested item is an object.
   * @memberof geo.util
   */
  isObject: function (value) {
    var type = typeof value;
    return value !== null && value !== undefined && (type === 'object' || type === 'function');
  },

  ///////////////////////////////////////////////////////////////////////////
  /*
   * Utility member properties.
   */
  ///////////////////////////////////////////////////////////////////////////

  /**
   * Radius of the earth in meters, from the equatorial radius of SRID 4326.
   * @memberof geo.util
   */
  radiusEarth: proj4.WGS84.a
};

module.exports = util;
