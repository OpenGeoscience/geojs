var $ = require('jquery');
var proj4 = require('proj4');

var throttle = require('./throttle');
var mockVGL = require('./mockVGL');
var DistanceGrid = require('./distanceGrid.js');
var ClusterGroup = require('./clustering.js');

var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

var m_timingData = {},
    m_timingKeepRecent = 200,
    m_threshold = 15,
    m_originalRequestAnimationFrame;

/**
 * @typedef {object} geo.util.cssColorConversionRecord
 * @property {string} name The name of the color conversion.
 * @property {RegEx} regex A regex that, if it matches the color string, will
 *      cause the process function to be invoked.
 * @property {function} process A function that takes (`color`, `match`) with
 *      the original color string and the results of matching the regex using
 *      the regex's `exec` function.  It outputs a {@link geo.geoColorObject}
 *      color object or the original color string if there is still a parsing
 *      failure.
 */

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
var util = module.exports = {
  DistanceGrid: DistanceGrid,
  ClusterGroup: ClusterGroup,

  /**
   * Check if a point is inside of a polygon.
   * Algorithm description:
   *   http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
   * The point and polygon must be in the same coordinate system.
   *
   * @param {geo.point2D} point The test point.
   * @param {geo.point2D[]} outer The outer boundary of the polygon.
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
    var inside = false, n = outer.length, i, j;

    if (range && range.min && range.max) {
      if (point.x < range.min.x || point.y < range.min.y ||
          point.x > range.max.x || point.y > range.max.y) {
        return;
      }
    }

    if (n < 3) {
      // we need 3 coordinates for this to make sense
      return false;
    }

    for (i = 0, j = n - 1; i < n; j = i, i += 1) {
      if (((outer[i].y > point.y) !== (outer[j].y > point.y)) &&
          (point.x < (outer[j].x - outer[i].x) *
          (point.y - outer[i].y) / (outer[j].y - outer[i].y) + outer[i].x)) {
        inside = !inside;
      }
    }

    if (inner && inside) {
      (inner || []).forEach(function (hole) {
        inside = inside && !util.pointInPolygon(point, hole);
      });
    }

    return inside;
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
  pointTo2DTriangleBasis: function (point, vert0, vert1, vert2) {
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
   * Convert a color to a standard rgb object.  Allowed inputs:
   *   - rgb object with optional 'a' (alpha) value.
   *   - css color name
   *   - #rrggbb, #rrggbbaa, #rgb, #rgba hexadecimal colors
   *   - rgb(), rgba(), hsl(), and hsla() css colors
   *   - transparent
   * The output object always contains r, g, b on a scale of [0-1].  If an
   * alpha value is specified, the output will also contain an 'a' value on a
   * scale of [0-1].  Objects already in rgb format are not checked to make
   * sure that all parameters are in the range of [0-1], but string inputs
   * are so validated.
   *
   * @param {geo.geoColor} color Any valid color input.
   * @returns {geo.geoColorObject} An rgb color object, possibly with an 'a'
   *    value.  If the input cannot be converted to a valid color, the input
   *    value is returned.
   * @memberof geo.util
   */
  convertColor: function (color) {
    if (color === undefined || color === null || (color.r !== undefined &&
        color.g !== undefined && color.b !== undefined)) {
      return color;
    }
    var opacity;
    if (typeof color === 'string') {
      var lowerColor = color.toLowerCase();
      if (util.cssColors.hasOwnProperty(lowerColor)) {
        color = util.cssColors[lowerColor];
      } else if (color.charAt(0) === '#') {
        if (color.length === 4 || color.length === 5) {
          /* interpret values of the form #rgb as #rrggbb and #rgba as
           * #rrggbbaa */
          if (color.length === 5) {
            opacity = parseInt(color.slice(4), 16) / 0xf;
          }
          color = parseInt(color.slice(1, 4), 16);
          color = (color & 0xf00) * 0x1100 + (color & 0xf0) * 0x110 + (color & 0xf) * 0x11;
        } else if (color.length === 7 || color.length === 9) {
          if (color.length === 9) {
            opacity = parseInt(color.slice(7), 16) / 0xff;
          }
          color = parseInt(color.slice(1, 7), 16);
        }
      } else if (lowerColor === 'transparent') {
        opacity = color = 0;
      } else if (lowerColor.indexOf('(') >= 0) {
        for (var idx = 0; idx < util.cssColorConversions.length; idx += 1) {
          var match = util.cssColorConversions[idx].regex.exec(lowerColor);
          if (match) {
            return util.cssColorConversions[idx].process(lowerColor, match);
          }
        }
      }
    }
    if (isFinite(color)) {
      color = {
        r: ((color & 0xff0000) >> 16) / 255,
        g: ((color & 0xff00) >> 8) / 255,
        b: ((color & 0xff)) / 255
      };
    }
    if (opacity !== undefined && color && color.r !== undefined) {
      color.a = opacity;
    }
    return color;
  },

  /**
   * Convert a color (possibly with opacity) and an optional opacity value to
   * a color object that always has opacity.  The opacity is guaranteed to be
   * within [0-1].  A valid color object is always returned.
   *
   * @param {geo.geoColor} [color] Any valid color input.  If an invalid value
   *    or no value is supplied, the `defaultColor` is used.
   * @param {number} [opacity=1] A value from [0-1].  This is multipled with
   *    the opacity from `color`.
   * @param {geo.geoColorObject} [defaultColor={r: 0, g: 0, b: 0}] The color
   *    to use if an invalid color is supplied.
   * @returns {geo.geoColorObject} An rgba color object.
   * @memberof geo.util
   */
  convertColorAndOpacity: function (color, opacity, defaultColor) {
    color = util.convertColor(color);
    if (!color || color.r === undefined || color.g === undefined || color.b === undefined) {
      color = util.convertColor(defaultColor || {r: 0, g: 0, b: 0});
    }
    if (!color || color.r === undefined || color.g === undefined || color.b === undefined) {
      color = {r: 0, g: 0, b: 0};
    }
    color = {
      r: isFinite(color.r) && color.r >= 0 ? (color.r <= 1 ? +color.r : 1) : 0,
      g: isFinite(color.g) && color.g >= 0 ? (color.g <= 1 ? +color.g : 1) : 0,
      b: isFinite(color.b) && color.b >= 0 ? (color.b <= 1 ? +color.b : 1) : 0,
      a: util.isNonNullFinite(color.a) && color.a >= 0 && color.a < 1 ? +color.a : 1
    };
    if (util.isNonNullFinite(opacity) && opacity < 1) {
      color.a = opacity <= 0 ? 0 : color.a * opacity;
    }
    return color;
  },

  /**
   * Convert a color to a six or eight digit hex value prefixed with #.
   *
   * @param {geo.geoColorObject} color The color object to convert.
   * @param {boolean} [allowAlpha] If truthy and `color` has a defined `a`
   *    value, include the alpha channel in the output.  If `'needed'`, only
   *    include the alpha channel if it is set and not 1.
   * @returns {string} A color string.
   * @memberof geo.util
   */
  convertColorToHex: function (color, allowAlpha) {
    var rgb = util.convertColor(color), value;
    if (!rgb.r && !rgb.g && !rgb.b) {
      value = '#000000';
    } else {
      value = '#' + ((1 << 24) + (Math.round(rgb.r * 255) << 16) +
                     (Math.round(rgb.g * 255) << 8) +
                      Math.round(rgb.b * 255)).toString(16).slice(1);
    }
    if (rgb.a !== undefined && allowAlpha && (rgb.a < 1 || allowAlpha !== 'needed')) {
      value += (256 + Math.round(rgb.a * 255)).toString(16).slice(1);
    }
    return value;
  },
  /**
   * Convert a color to a css rgba() value.
   *
   * @param {geo.geoColorObject} color The color object to convert.
   * @returns {string} A color string.
   * @memberof geo.util
   */
  convertColorToRGBA: function (color) {
    var rgb = util.convertColor(color);
    if (!rgb) {
      rgb = {r: 0, g: 0, b: 0};
    }
    if (!util.isNonNullFinite(rgb.a) || rgb.a > 1) {
      rgb.a = 1;
    }
    return 'rgba(' + Math.round(rgb.r * 255) + ', ' + Math.round(rgb.g * 255) +
           ', ' + Math.round(rgb.b * 255) + ', ' + +((+rgb.a).toFixed(5)) + ')';
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
   * @returns {Float32Array} A buffer for the named source.
   * @memberof geo.util
   */
  getGeomBuffer: function (geom, srcName, len) {
    var src = geom.sourceByName(srcName), data;

    data = src.data();
    if (data instanceof Float32Array && data.length === len) {
      return data;
    }
    data = new Float32Array(len);
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
   * paramaters where the expected intent is to use the map in pixel
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
   * Get twice the signed area of a 2d triangle.
   *
   * @param {geo.geoPosition} pt1 A vertex.
   * @param {geo.geoPosition} pt2 A vertex.
   * @param {geo.geoPosition} pt3 A vertex.
   * @returns {number} Twice the signed area.
   */
  triangleTwiceSignedArea2d: function (pt1, pt2, pt3) {
    return (pt2.y - pt1.y) * (pt3.x - pt2.x) - (pt2.x - pt1.x) * (pt3.y - pt2.y);
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
          defer.resolve();
        }
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
    var defer = $.Deferred(), container, deferList = [];

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
        });
      }
      deferList.push(styleDefer);
      $('head', container).append(styleElem);
    });

    $.when.apply($, deferList).then(function () {
      var svg = $('<svg xmlns="http://www.w3.org/2000/svg">' +
                  '<foreignObject width="100%" height="100%">' +
                  '</foreignObject></svg>');
      svg.attr({
        width: parent.width() + 'px',
        height: parent.height() + 'px',
        'text-rendering': 'optimizeLegibility'
      });
      $('foreignObject', svg).append(container);

      var img = new Image();
      img.onload = function () {
        defer.resolve(img);
      };
      img.onerror = function () {
        defer.reject();
      };
      img.src = 'data:image/svg+xml;base64,' +
          btoa(util.escapeUnicodeHTML(
              new XMLSerializer().serializeToString(svg[0])));
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
           * instance, our test enviornment has performance.now() values on
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
  radiusEarth: proj4.WGS84.a,

  /**
   * A regular expression string that will parse a number (integer or floating
   * point) for CSS properties.
   * @memberof geo.util
   */
  cssNumberRegex: '[+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][+-]?\\d+)?',

  /**
   * A dictionary of conversion factors for angular CSS measurements.
   * @memberof geo.util
   */
  cssAngleUnitsBase: {deg: 360, grad: 400, rad: 2 * Math.PI, turn: 1},

  /**
   * The predefined CSS colors.  See
   * {@link https://drafts.csswg.org/css-color}.
   *
   * @memberof geo.util
   */
  cssColors: {
    aliceblue: 0xf0f8ff,
    antiquewhite: 0xfaebd7,
    aqua: 0x00ffff,
    aquamarine: 0x7fffd4,
    azure: 0xf0ffff,
    beige: 0xf5f5dc,
    bisque: 0xffe4c4,
    black: 0x000000,
    blanchedalmond: 0xffebcd,
    blue: 0x0000ff,
    blueviolet: 0x8a2be2,
    brown: 0xa52a2a,
    burlywood: 0xdeb887,
    cadetblue: 0x5f9ea0,
    chartreuse: 0x7fff00,
    chocolate: 0xd2691e,
    coral: 0xff7f50,
    cornflowerblue: 0x6495ed,
    cornsilk: 0xfff8dc,
    crimson: 0xdc143c,
    cyan: 0x00ffff,
    darkblue: 0x00008b,
    darkcyan: 0x008b8b,
    darkgoldenrod: 0xb8860b,
    darkgray: 0xa9a9a9,
    darkgreen: 0x006400,
    darkgrey: 0xa9a9a9,
    darkkhaki: 0xbdb76b,
    darkmagenta: 0x8b008b,
    darkolivegreen: 0x556b2f,
    darkorange: 0xff8c00,
    darkorchid: 0x9932cc,
    darkred: 0x8b0000,
    darksalmon: 0xe9967a,
    darkseagreen: 0x8fbc8f,
    darkslateblue: 0x483d8b,
    darkslategray: 0x2f4f4f,
    darkslategrey: 0x2f4f4f,
    darkturquoise: 0x00ced1,
    darkviolet: 0x9400d3,
    deeppink: 0xff1493,
    deepskyblue: 0x00bfff,
    dimgray: 0x696969,
    dimgrey: 0x696969,
    dodgerblue: 0x1e90ff,
    firebrick: 0xb22222,
    floralwhite: 0xfffaf0,
    forestgreen: 0x228b22,
    fuchsia: 0xff00ff,
    gainsboro: 0xdcdcdc,
    ghostwhite: 0xf8f8ff,
    gold: 0xffd700,
    goldenrod: 0xdaa520,
    gray: 0x808080,
    green: 0x008000,
    greenyellow: 0xadff2f,
    grey: 0x808080,
    honeydew: 0xf0fff0,
    hotpink: 0xff69b4,
    indianred: 0xcd5c5c,
    indigo: 0x4b0082,
    ivory: 0xfffff0,
    khaki: 0xf0e68c,
    lavender: 0xe6e6fa,
    lavenderblush: 0xfff0f5,
    lawngreen: 0x7cfc00,
    lemonchiffon: 0xfffacd,
    lightblue: 0xadd8e6,
    lightcoral: 0xf08080,
    lightcyan: 0xe0ffff,
    lightgoldenrodyellow: 0xfafad2,
    lightgray: 0xd3d3d3,
    lightgreen: 0x90ee90,
    lightgrey: 0xd3d3d3,
    lightpink: 0xffb6c1,
    lightsalmon: 0xffa07a,
    lightseagreen: 0x20b2aa,
    lightskyblue: 0x87cefa,
    lightslategray: 0x778899,
    lightslategrey: 0x778899,
    lightsteelblue: 0xb0c4de,
    lightyellow: 0xffffe0,
    lime: 0x00ff00,
    limegreen: 0x32cd32,
    linen: 0xfaf0e6,
    magenta: 0xff00ff,
    maroon: 0x800000,
    mediumaquamarine: 0x66cdaa,
    mediumblue: 0x0000cd,
    mediumorchid: 0xba55d3,
    mediumpurple: 0x9370db,
    mediumseagreen: 0x3cb371,
    mediumslateblue: 0x7b68ee,
    mediumspringgreen: 0x00fa9a,
    mediumturquoise: 0x48d1cc,
    mediumvioletred: 0xc71585,
    midnightblue: 0x191970,
    mintcream: 0xf5fffa,
    mistyrose: 0xffe4e1,
    moccasin: 0xffe4b5,
    navajowhite: 0xffdead,
    navy: 0x000080,
    oldlace: 0xfdf5e6,
    olive: 0x808000,
    olivedrab: 0x6b8e23,
    orange: 0xffa500,
    orangered: 0xff4500,
    orchid: 0xda70d6,
    palegoldenrod: 0xeee8aa,
    palegreen: 0x98fb98,
    paleturquoise: 0xafeeee,
    palevioletred: 0xdb7093,
    papayawhip: 0xffefd5,
    peachpuff: 0xffdab9,
    peru: 0xcd853f,
    pink: 0xffc0cb,
    plum: 0xdda0dd,
    powderblue: 0xb0e0e6,
    purple: 0x800080,
    rebeccapurple: 0x663399,
    red: 0xff0000,
    rosybrown: 0xbc8f8f,
    royalblue: 0x4169e1,
    saddlebrown: 0x8b4513,
    salmon: 0xfa8072,
    sandybrown: 0xf4a460,
    seagreen: 0x2e8b57,
    seashell: 0xfff5ee,
    sienna: 0xa0522d,
    silver: 0xc0c0c0,
    skyblue: 0x87ceeb,
    slateblue: 0x6a5acd,
    slategray: 0x708090,
    slategrey: 0x708090,
    snow: 0xfffafa,
    springgreen: 0x00ff7f,
    steelblue: 0x4682b4,
    tan: 0xd2b48c,
    teal: 0x008080,
    thistle: 0xd8bfd8,
    tomato: 0xff6347,
    turquoise: 0x40e0d0,
    violet: 0xee82ee,
    wheat: 0xf5deb3,
    white: 0xffffff,
    whitesmoke: 0xf5f5f5,
    yellow: 0xffff00,
    yellowgreen: 0x9acd32
  }
};

///////////////////////////////////////////////////////////////////////////
/*
 * Utility member properties that need to refer to util functions and
 * properties.
 */
///////////////////////////////////////////////////////////////////////////

/**
 * A list of regex and processing functions for color conversions to rgb
 * objects.  Each entry is a {@link geo.util.cssColorConversionRecord}.  In
 * general, these conversions are somewhat more forgiving than the css
 * specification (see https://drafts.csswg.org/css-color/) in that
 * percentages may be mixed with numbers, and that floating point values are
 * accepted for all numbers.  Commas are optional.  As per the latest draft
 * standard, `rgb` and `rgba` are aliases of each other, as are `hsl` and
 * `hsla`.
 * @alias cssColorConversions
 * @memberof geo.util
 */
util.cssColorConversions = [{
  name: 'rgb',
  regex: new RegExp(
    '^\\s*rgba?' +
    '\\(\\s*(' + util.cssNumberRegex + ')\\s*(%?)\\s*' +
    ',?\\s*(' + util.cssNumberRegex + ')\\s*(%?)\\s*' +
    ',?\\s*(' + util.cssNumberRegex + ')\\s*(%?)\\s*' +
    '([/,]?\\s*(' + util.cssNumberRegex + ')\\s*(%?)\\s*)?' +
    '\\)\\s*$'),
  process: function (color, match) {
    color = {
      r: Math.min(1, Math.max(0, +match[1] / (match[2] ? 100 : 255))),
      g: Math.min(1, Math.max(0, +match[3] / (match[4] ? 100 : 255))),
      b: Math.min(1, Math.max(0, +match[5] / (match[6] ? 100 : 255)))
    };
    if (match[7]) {
      color.a = Math.min(1, Math.max(0, +match[8] / (match[9] ? 100 : 1)));
    }
    return color;
  }
}, {
  name: 'hsl',
  regex: new RegExp(
    '^\\s*hsla?' +
    '\\(\\s*(' + util.cssNumberRegex + ')\\s*(deg|grad|rad|turn)?\\s*' +
    ',?\\s*(' + util.cssNumberRegex + ')\\s*%\\s*' +
    ',?\\s*(' + util.cssNumberRegex + ')\\s*%\\s*' +
    '([/,]?\\s*(' + util.cssNumberRegex + ')\\s*(%?)\\s*)?' +
    '\\)\\s*$'),
  process: function (color, match) {
    /* Conversion from https://www.w3.org/TR/2011/REC-css3-color-20110607
     */
    var hue_to_rgb = function (m1, m2, h) {
      h = h - Math.floor(h);
      if (h * 6 < 1) {
        return m1 + (m2 - m1) * h * 6;
      }
      if (h * 6 < 3) {
        return m2;
      }
      if (h * 6 < 4) {
        return m1 + (m2 - m1) * (2 / 3 - h) * 6;
      }
      return m1;
    };

    var h = +match[1] / (util.cssAngleUnitsBase[match[2]] || 360),
        s = Math.min(1, Math.max(0, +match[3] / 100)),
        l = Math.min(1, Math.max(0, +match[4] / 100)),
        m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s,
        m1 = l * 2 - m2;
    color = {
      r: hue_to_rgb(m1, m2, h + 1 / 3),
      g: hue_to_rgb(m1, m2, h),
      b: hue_to_rgb(m1, m2, h - 1 / 3)
    };
    if (match[5]) {
      color.a = Math.min(1, Math.max(0, +match[6] / (match[7] ? 100 : 1)));
    }
    return color;
  }
}];

/* Add additional utilities to the main object. */
$.extend(util, throttle, mockVGL);
