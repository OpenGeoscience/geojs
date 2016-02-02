
(function () {
  'use strict';

  var geo = {util: {}};
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  var m_timingData = {},
      m_timingKeepRecent = 200,
      m_threshold = 15,
      m_originalRequestAnimationFrame;

  /**
   * Takes a variable number of arguments and returns the first numeric value
   * it finds.
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

  //////////////////////////////////////////////////////////////////////////////
  /**
   * Contains utility classes and methods used by geojs.
   * @namespace
   */
  //////////////////////////////////////////////////////////////////////////////
  geo.util = {
    /**
     * Returns true if the given point lies in the given polygon.
     * Algorithm description:
     *   http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
     * @param {geo.screenPosition} point The test point
     * @param {geo.screenPosition[]} outer The outer boundary of the polygon
     * @param {geo.screenPosition[][]?} inner Inner boundaries (holes)
     */
    pointInPolygon: function (point, outer, inner) {
      var inside = false, n = outer.length;

      if (n < 3) {
        // we need 3 coordinates for this to make sense
        return false;
      }

      outer.forEach(function (vert, i) {
        var j = (n + i - 1) % n;
        var intersect = (
          ((outer[i].y > point.y) !== (outer[j].y > point.y)) &&
          (point.x < (outer[j].x - outer[i].x) *
                     (point.y - outer[i].y) /
                     (outer[j].y - outer[i].y) + outer[i].x)
        );
        if (intersect) {
          inside = !inside;
        }
      });

      (inner || []).forEach(function (hole) {
        inside = inside && !geo.util.pointInPolygon(point, hole);
      });

      return inside;
    },

    /**
     * Returns true if the argument is a function.
     */
    isFunction: function (f) {
      return typeof f === 'function';
    },

    /**
     * Returns the argument if it is function, otherwise returns a function
     * that returns the argument.
     */
    ensureFunction: function (f) {
      if (geo.util.isFunction(f)) {
        return f;
      } else {
        return function () { return f; };
      }
    },

    /**
     * Return a random string of length n || 8.
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
     * Convert a color from hex value or css name to rgb objects
     */
    convertColor: function (color) {
      if (color.r !== undefined && color.g !== undefined &&
          color.b !== undefined) {
        return color;
      }
      if (typeof color === 'string') {
        if (geo.util.cssColors.hasOwnProperty(color)) {
          color = geo.util.cssColors[color];
        } else if (color.charAt(0) === '#') {
          color = parseInt(color.slice(1), 16);
        }
      }
      if (isFinite(color)) {
        color = {
          r: ((color & 0xff0000) >> 16) / 255,
          g: ((color & 0xff00) >> 8) / 255,
          b: ((color & 0xff)) / 255
        };
      }
      return color;
    },

    /**
     * Normalize a coordinate object into {x: ..., y: ..., z: ... } form.
     * Accepts 2-3d arrays,
     * latitude -> lat -> y
     * longitude -> lon -> lng -> x
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
     * Radius of the earth in meters, from the equatorial radius of SRID 4326.
     */
    radiusEarth: 6378137,

    /**
     * Linearly combine two "coordinate-like" objects in a uniform way.
     * Coordinate like objects have ``x``, ``y``, and optionally a ``z``
     * key.  The first object is mutated.
     *
     *   a <= ca * a + cb * b
     *
     * @param {number} ca
     * @param {object} a
     * @param {number} [a.x=0]
     * @param {number} [a.y=0]
     * @param {number} [a.z=0]
     * @param {number} cb
     * @param {object} b
     * @param {number} [b.x=0]
     * @param {number} [b.y=0]
     * @param {number} [b.z=0]
     * @returns {object} ca * a + cb * b
     */
    lincomb: function (ca, a, cb, b) {
      a.x = ca * (a.x || 0) + cb * (b.x || 0);
      a.y = ca * (a.y || 0) + cb * (b.y || 0);
      a.z = ca * (a.x || 0) + cb * (b.x || 0);
      return a;
    },

    /**
     * Element-wise product of two coordinate-like object.  Mutates
     * the first object.  Note the default values for ``b``, which
     * are intended to used as a anisotropic scaling factors.
     *
     *   a <= a * b^pow
     *
     * @param {object} a
     * @param {number} [a.x=0]
     * @param {number} [a.y=0]
     * @param {number} [a.z=0]
     * @param {object} b
     * @param {number} [b.x=1]
     * @param {number} [b.y=1]
     * @param {number} [b.z=1]
     * @param {number} [pow=1]
     * @returns {object} a * b^pow
     */
    scale: function (a, b, pow) {
      a.x = (a.x || 0) * Math.pow(b.x || 1, pow);
      a.y = (a.y || 0) * Math.pow(b.y || 1, pow);
      a.z = (a.z || 0) * Math.pow(b.z || 1, pow);
      return a;
    },

    /**
     * Compare two arrays and return if their contents are equal.
     * @param {array} a1 first array to compare
     * @param {array} a2 second array to compare
     * @returns {boolean} true if the contents of the arrays are equal.
     */
    compareArrays: function (a1, a2) {
      return (a1.length === a2.length && a1.every(function (el, idx) {
        return el === a2[idx];
      }));
    },

    /**
     * Create a vec3 that is always an array.  This should only be used if it
     * will not be used in a WebGL context.  Plain arrays usually use 64-bit
     * float values, whereas vec3 defaults to 32-bit floats.
     *
     * @returns {Array} zeroed-out vec3 compatible array.
     */
    vec3AsArray: function () {
      return [0, 0, 0];
    },

    /**
     * Create a mat4 that is always an array.  This should only be used if it
     * will not be used in a WebGL context.  Plain arrays usually use 64-bit
     * float values, whereas mat4 defaults to 32-bit floats.
     *
     * @returns {Array} identity mat4 compatible array.
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
     * @param geom: the geometry to reference and modify.
     * @param srcName: the name of the source.
     * @param len: the number of elements for the array.
     * @returns {Float32Array}
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
     * Report on one or all of the tracked timings.
     *
     * @param {string} name name to report on, or undefined to report all.
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
     * should be paired with timeFunctionStop, which will collect statistics on
     * the amount of time spent in a function.
     *
     * @param {string} name name to use for tracking the timing.
     * @param {boolean} reset if true, clear old tracking data.
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
     * should be paired with timeFunctionStart.
     *
     * @param {string} name name to use for tracking the timing.
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
     * Start or stop tracking the time spent in requestAnimationFrame.  If
     * tracked, the results can be fetched via
     * timeFunctionReport('requestAnimationFrame').
     *
     * @param {boolean} stop falsy to start tracking, truthy to start tracking.
     * @param {boolean} reset if true, reset the statistics.
     * @param {number} threshold if present, set the threshold used in tracking
     *   slow callbacks.
     * @param {number} keep if present, set the number of recent frame times
     *   to track.
     */
    timeRequestAnimationFrame: function (stop, reset, threshold, keep) {
      if (!m_timingData.requestAnimationFrame || reset) {
        m_timingData.requestAnimationFrame = {
          count: 0, sum: 0, sum2: 0, max: 0, above_threshold: 0,
          recent: [], recentsub: []
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
          m_originalRequestAnimationFrame.call(window, function (timestamp) {
            var track = m_timingData.requestAnimationFrame, recent;
            if (track.timestamp !== timestamp) {
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
    }
  };

  geo.util.cssColors = {
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
  };

  module.exports = geo.util;
}());
