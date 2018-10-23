/* Utility functions related to color */

var util = require('./common');
var colorName = require('color-name');

/**
 * A color value.  Although opacity can be specified, it is not always used.
 * When a string is specified, any of the following forms can be used:
 *   - CSS color name
 *   - `#rrggbb` The color specified in hexadecmial with each channel on a
 *     scale between 0 and 255 (`ff`).  Case insensitive.
 *   - `#rrggbbaa` The color and opacity specified in hexadecmial with each
 *     channel on a scale between 0 and 255 (`ff`).  Case insensitive.
 *   - `#rgb` The color specified in hexadecmial with each channel on a scale
 *     between 0 and 15 (`f`).  Case insensitive.
 *   - `#rgba` The color and opacity specified in hexadecmial with each channel
 *      on a scale between 0 and 15 (`f`).  Case insensitive.
 *   - `rgb(R, G, B)`, `rgb(R, G, B, A)`, `rgba(R, G, B)`, `rgba(R, G, B, A)`
 *     The color with the values of each color channel specified as numeric
 *     values between 0 and 255 or as percent (between 0 and 100) if a percent
 *     `%` follows the number.  The alpha (opacity) channel is optional and can
 *     either be a number between 0 and 1 or a percent.  White space may appear
 *     before and after numbers, and between the number and a percent symbol.
 *     Commas are not required.  A slash may be used as a separator before the
 *     alpha value instead of a comma.  The numbers conform to the CSS number
 *     specification, and can be signed floating-point values, possibly with
 *     exponents.
 *   - `hsl(H, S, L)`, `hsl(H, S, L, A)`, `hsla(H, S, L)`, `hsla(H, S, L, A)`
 *     Hue, saturation, and lightness with optional alpha (opacity).  Hue is a
 *     number between 0 and 360 and is interpretted as degrees unless an angle
 *     unit is specified.  CSS units of `deg`, `grad`, `rad`, and `turn` are
 *     supported.  Saturation and lightness are percentages between 0 and 100
 *     and *must* be followed by a percent `%` symbol.  The alpha (opacity)
 *     channel is optional and is specified as with `rgba(R, G, B, A)`.
 *   - `transparent` Black with 0 opacity.
 *
 * When a number, this is an integer of the form `0xrrggbb` or its decimal
 * equivalent.  For example, 0xff0000 or 16711680 are both solid red.
 *
 * See {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value} for
 * more details on CSS color values.
 *
 * @typedef geo.geoColor
 * @type {geo.geoColorObject|string|number}
 */

/**
 * A color value represented as an object.  Although opacity can be specified,
 * it is not always used.
 *
 * @typedef {object} geo.geoColorObject
 * @property {number} r The red intensity on a scale of [0-1].
 * @property {number} g The green intensity on a scale of [0-1].
 * @property {number} b The blue intensity on a scale of [0-1].
 * @property {number} [a] The opacity on a scale of [0-1].  If unspecified and
 *      used, it should be treated as 1.
 */

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

var m_memoizeConvertColor = {maxCount: 1000, count: 0, memo: {}};

/**
 * Store the results of convertColor in dictionary for so repeated requests can
 * be returned quickly.  If the memoization table gets over a certain size,
 * just reset it.
 *
 * @param {geo.geoColor} origColor The origial color specification.
 * @param {geo.geoColorObject} resultColor The result of the conversion.
 * @returns {geo.geoColorObject} The `resultColor`.
 */
function memoizeConvertColor(origColor, resultColor) {
  m_memoizeConvertColor.count += 1;
  if (m_memoizeConvertColor.count >= m_memoizeConvertColor.maxCount) {
    m_memoizeConvertColor.memo = {};
    m_memoizeConvertColor.count = 0;
  }
  m_memoizeConvertColor.memo[origColor] = resultColor;
  return resultColor;
}

var colorUtils = {
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
    if (m_memoizeConvertColor.memo[color] !== undefined) {
      return m_memoizeConvertColor.memo[color];
    }
    var opacity, origColor = color;
    if (typeof color === 'string') {
      var lowerColor = color.toLowerCase();
      if (colorName.hasOwnProperty(lowerColor)) {
        color = {
          r: colorName[lowerColor][0] / 255,
          g: colorName[lowerColor][1] / 255,
          b: colorName[lowerColor][2] / 255
        };
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
        for (var idx = 0; idx < colorUtils.cssColorConversions.length; idx += 1) {
          var match = colorUtils.cssColorConversions[idx].regex.exec(lowerColor);
          if (match) {
            color = colorUtils.cssColorConversions[idx].process(lowerColor, match);
            return memoizeConvertColor(origColor, color);
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
    return memoizeConvertColor(origColor, color);
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
    color = colorUtils.convertColor(color);
    if (!color || color.r === undefined || color.g === undefined || color.b === undefined) {
      color = colorUtils.convertColor(defaultColor || {r: 0, g: 0, b: 0});
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
    var rgb = colorUtils.convertColor(color), value;
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
    var rgb = colorUtils.convertColor(color);
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
   * A dictionary of conversion factors for angular CSS measurements.
   * @memberof geo.util
   */
  cssAngleUnitsBase: {deg: 360, grad: 400, rad: 2 * Math.PI, turn: 1},

  /**
   * A regular expression string that will parse a number (integer or floating
   * point) for CSS properties.
   * @memberof geo.util
   */
  cssNumberRegex: '[+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][+-]?\\d+)?'
};

/**
 * A list of regex and processing functions for color conversions to rgb
 * objects.  Each entry is a {@link geo.util.cssColorConversionRecord}.  In
 * general, these conversions are somewhat more forgiving than the css
 * specification (see {@link https://drafts.csswg.org/css-color/}) in that
 * percentages may be mixed with numbers, and that floating point values are
 * accepted for all numbers.  Commas are optional.  As per the latest draft
 * standard, `rgb` and `rgba` are aliases of each other, as are `hsl` and
 * `hsla`.
 * @name cssColorConversions
 * @property cssColorConversions
 * @memberof geo.util
 */
colorUtils.cssColorConversions = [{
  name: 'rgb',
  regex: new RegExp(
    '^\\s*rgba?' +
    '\\(\\s*(' + colorUtils.cssNumberRegex + ')\\s*(%?)\\s*' +
    ',?\\s*(' + colorUtils.cssNumberRegex + ')\\s*(%?)\\s*' +
    ',?\\s*(' + colorUtils.cssNumberRegex + ')\\s*(%?)\\s*' +
    '([/,]?\\s*(' + colorUtils.cssNumberRegex + ')\\s*(%?)\\s*)?' +
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
    '\\(\\s*(' + colorUtils.cssNumberRegex + ')\\s*(deg|grad|rad|turn)?\\s*' +
    ',?\\s*(' + colorUtils.cssNumberRegex + ')\\s*%\\s*' +
    ',?\\s*(' + colorUtils.cssNumberRegex + ')\\s*%\\s*' +
    '([/,]?\\s*(' + colorUtils.cssNumberRegex + ')\\s*(%?)\\s*)?' +
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

    var h = +match[1] / (colorUtils.cssAngleUnitsBase[match[2]] || 360),
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

module.exports = colorUtils;
