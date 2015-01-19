
(function () {
  "use strict";

  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var cssColors;

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
      return typeof f === "function";
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
      s = "";
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
      if (typeof color === "string") {
        if (cssColors.hasOwnProperty(color)) {
          color = cssColors[color];
        } else if (color.charAt(0) === "#") {
          color = parseInt(color.slice(1), 16);
        }
      }
      // jshint -W016
      if (isFinite(color)) {
        color = {
          r: ((color & 0xff0000) >> 16) / 255,
          g: ((color & 0xff00) >> 8) / 255,
          b: ((color & 0xff)) / 255
        };
      }
      // jshint +W016
      return color;
    },

    /**
     * Normalize a coordinate object into {x: ..., y: ..., z: ... } form.
     * Accepts 2-3d arrays,
     * latlng objects
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
      if (p instanceof geo.latlng) {
        return {
          x: p.lng(),
          y: p.lat(),
          z: 0
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
    }
  };

  cssColors = {
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
}());
