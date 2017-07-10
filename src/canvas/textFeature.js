var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var textFeature = require('../textFeature');
var util = require('../util');

/**
 * Create a new instance of class canvas.textFeature.
 *
 * @class
 * @alias geo.canvas.textFeature
 * @extends geo.textFeature
 * @extends geo.canvas.object
 *
 * @param {geo.textFeature.spec} [arg] Options for the feature.
 * @returns {geo.canvas.textFeature} The created feature.
 */
var canvas_textFeature = function (arg) {
  'use strict';
  if (!(this instanceof canvas_textFeature)) {
    return new canvas_textFeature(arg);
  }

  var object = require('./object');

  arg = arg || {};
  textFeature.call(this, arg);
  object.call(this);

  /**
   * @private
   */
  var m_this = this,
      m_defaultFont = 'bold 16px sans-serif',
      /* This regexp parses css font specifications into style, variant,
       * weight, stretch, size, line height, and family.  It is based on a
       * regexp here: https://stackoverflow.com/questions/10135697/regex-to-parse-any-css-font,
       * but has been modified to fix some issues and handle font stretch. */
      m_cssFontRegExp = new RegExp(
        '^\\s*' +
        '(?=(?:(?:[-a-z0-9]+\\s+){0,3}(italic|oblique))?)' +
        '(?=(?:(?:[-a-z0-9]+\\s+){0,3}(small-caps))?)' +
        '(?=(?:(?:[-a-z0-9]+\\s+){0,3}(bold(?:er)?|lighter|[1-9]00))?)' +
        '(?=(?:(?:[-a-z0-9]+\\s+){0,3}((?:ultra-|extra-|semi-)?(?:condensed|expanded)))?)' +
        '(?:(?:normal|\\1|\\2|\\3|\\4)\\s+){0,4}' +
        '((?:xx?-)?(?:small|large)|medium|smaller|larger|[.\\d]+(?:\\%|in|[cem]m|ex|p[ctx]))' +
        '(?:/(normal|[.\\d]+(?:\\%|in|[cem]m|ex|p[ctx])))?\\s+' +
        '([-,\\"\\sa-z]+?)\\s*$', 'i');

  /**
   * Get the font for a specific data item.  This falls back to the default
   * font if the value is unset or doesn't contain sufficient information.
   *
   * @param {boolean} useSubValues If truthy, check all font styles (such as
   *    `fontSize`, `lineHeight`, etc., and override the code `font` style
   *    with those values.  If falsy, only use `font`.
   * @param {object} d The current data element.
   * @param {number} i The index of the current data element.
   * @returns {string} The font style.
   */
  this.getFontFromStyles = function (useSubValues, d, i) {
    var font = m_this.style.get('font')(d, i) || m_defaultFont;
    if (useSubValues) {
      var parts = m_cssFontRegExp.exec(font);
      if (parts === null) {
        parts = m_cssFontRegExp.exec(m_defaultFont);
      }
      parts[1] = m_this.style.get('fontStyle')(d, i) || parts[1];
      parts[2] = m_this.style.get('fontVariant')(d, i) || parts[2];
      parts[3] = m_this.style.get('fontWeight')(d, i) || parts[3];
      parts[4] = m_this.style.get('fontStretch')(d, i) || parts[4];
      parts[5] = m_this.style.get('fontSize')(d, i) || parts[5] || '16px';
      parts[6] = m_this.style.get('lineHeight')(d, i) || parts[6];
      parts[7] = m_this.style.get('fontFamily')(d, i) || parts[7] || 'sans-serif';
      font = (parts[1] || '') + ' ' + (parts[2] || '') + ' ' +
             (parts[3] || '') + ' ' + (parts[4] || '') + ' ' +
             (parts[5] || '') + (parts[6] ? '/' + parts[6] : '') + ' ' +
             parts[7];
    }
    return font;
  };

  /**
   * Render the data on the canvas.
   * @protected
   * @param {CanvasRenderingContext2D} context2d The canvas context to draw in.
   * @param {geo.map} map The parent map object.
   */
  this._renderOnCanvas = function (context2d, map) {
    var data = m_this.data(),
        posFunc = m_this.style.get('position'),
        textFunc = m_this.style.get('text'),
        fontFromSubValues, text, pos, val;

    /* If any of the font styles other than `font` have values, then we need to
     * construct a single font value from the subvalues.  Otherwise, we can
     * skip it. */
    fontFromSubValues = ['fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'lineHeight', 'fontFamily'].some(function (key) {
      return m_this.style(key) !== null && m_this.style(key) !== undefined;
    });
    /* Clear the canvas property buffer */
    m_this._canvasProperty();
    data.forEach(function (d, i) {
      val = m_this.style.get('visible')(d, i);
      if (!val && val !== undefined) {
        return;
      }
      val = util.convertColorAndOpacity(
        m_this.style.get('color')(d, i), m_this.style.get('textOpacity')(d, i));
      if (val.a === 0) {
        return;
      }
      m_this._canvasProperty(context2d, 'globalAlpha', val.a);
      m_this._canvasProperty(context2d, 'fillStyle', util.convertColorToHex(val));
      // TODO: get the position position without transform.  If it is outside
      // of the map to an extent that there is no chance of text showing,
      // skip further processing.
      pos = m_this.featureGcsToDisplay(posFunc(d, i));
      text = textFunc(d, i);
      m_this._canvasProperty(context2d, 'font', m_this.getFontFromStyles(fontFromSubValues, d, i));
      m_this._canvasProperty(context2d, 'textAlign', m_this.style.get('textAlign')(d, i) || 'center');
      m_this._canvasProperty(context2d, 'textBaseline', m_this.style.get('textBaseline')(d, i) || 'middle');

      // TODO: fetch and use other properties:
      // 'direction', 'rotation', 'rotateWithMap', 'scale',
      // 'scaleWithMap', 'offset', 'width', 'shadowColor', 'shadowOffset',
      // 'shadowBlur', 'shadowRotate', 'shadowOpacity'
      m_this._canvasProperty(context2d, 'direction', 'inherit'); // ltr, rtl, inherit
      /*
      ctx.shadowColor = "black";
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
      ctx.shadowBlur = 7;
      */

      context2d.fillText(text, pos.x, pos.y);
    });
    m_this._canvasProperty(context2d, 'globalAlpha', 1);
  };

  this._init(arg);
  return this;
};

inherit(canvas_textFeature, textFeature);

// Now register it
var capabilities = {};

registerFeature('canvas', 'text', canvas_textFeature, capabilities);

module.exports = canvas_textFeature;
