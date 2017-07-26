var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var textFeature = require('../textFeature');
var util = require('../util');
var mat3 = require('gl-mat3');
var vec3 = require('gl-vec3');

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
      font = font.trim().replace(/\s\s+/g, ' ');
    }
    return font;
  };

  /**
   * Render the data on the canvas.
   *
   * This does not currently support multiline text or word wrapping, since
   * canvas doesn't implement that directly.  To support these, each text item
   * would need to be split on line breaks, and have the width of the text
   * calculated with context2d.measureText to determine word wrapping.  This
   * would also need to calculate the effective line height from the font
   * specification.
   *
   * @protected
   * @param {CanvasRenderingContext2D} context2d The canvas context to draw in.
   * @param {geo.map} map The parent map object.
   */
  this._renderOnCanvas = function (context2d, map) {
    var data = m_this.data(),
        posFunc = m_this.style.get('position'),
        textFunc = m_this.style.get('text'),
        mapRotation = map.rotation(),
        mapZoom = map.zoom(),
        fontFromSubValues, text, pos, visible, color, blur, stroke, width,
        rotation, rotateWithMap, scale, offset,
        transform, lastTransform = util.mat3AsArray();

    /* If any of the font styles other than `font` have values, then we need to
     * construct a single font value from the subvalues.  Otherwise, we can
     * skip it. */
    fontFromSubValues = [
      'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
      'lineHeight', 'fontFamily'
    ].some(function (key) {
      return m_this.style(key) !== null && m_this.style(key) !== undefined;
    });
    /* Clear the canvas property buffer */
    m_this._canvasProperty();
    data.forEach(function (d, i) {
      visible = m_this.style.get('visible')(d, i);
      if (!visible && visible !== undefined) {
        return;
      }
      color = util.convertColorAndOpacity(
        m_this.style.get('color')(d, i), m_this.style.get('textOpacity')(d, i));
      stroke = util.convertColorAndOpacity(
        m_this.style.get('textStrokeColor')(d, i), m_this.style.get('textOpacity')(d, i), {r: 0, g: 0, b: 0, a: 0});
      if (color.a === 0 && stroke.a === 0) {
        return;
      }
      m_this._canvasProperty(context2d, 'fillStyle', util.convertColorToRGBA(color));
      // TODO: get the position position without transform.  If it is outside
      // of the map to an extent that there is no chance of text showing,
      // skip further processing.
      pos = m_this.featureGcsToDisplay(posFunc(d, i));
      text = textFunc(d, i);
      m_this._canvasProperty(context2d, 'font', m_this.getFontFromStyles(fontFromSubValues, d, i));
      m_this._canvasProperty(context2d, 'textAlign', m_this.style.get('textAlign')(d, i) || 'center');
      m_this._canvasProperty(context2d, 'textBaseline', m_this.style.get('textBaseline')(d, i) || 'middle');
      /* rotation, scale, and offset */
      rotation = m_this.style.get('rotation')(d, i) || 0;
      rotateWithMap = m_this.style.get('rotateWithMap')(d, i) && mapRotation;
      scale = m_this.style.get('textScaled')(d, i);
      scale = util.isNonNullFinite(scale) ? Math.pow(2, mapZoom - scale) : null;
      offset = m_this.style.get('offset')(d, i);
      transform = util.mat3AsArray();
      if (rotation || rotateWithMap || (scale && scale !== 1) || (offset && (offset.x || offset.y))) {
        mat3.translate(transform, transform, [pos.x, pos.y]);
        if (rotateWithMap && mapRotation) {
          mat3.rotate(transform, transform, mapRotation);
        }
        mat3.translate(transform, transform, [
          offset && offset.x ? +offset.x : 0,
          offset && offset.y ? +offset.y : 0]);
        if (rotation) {
          mat3.rotate(transform, transform, rotation);
        }
        if (scale && scale !== 1) {
          mat3.scale(transform, transform, [scale, scale]);
        }
        mat3.translate(transform, transform, [-pos.x, -pos.y]);
      }
      if (lastTransform[0] !== transform[0] || lastTransform[1] !== transform[1] ||
          lastTransform[3] !== transform[3] || lastTransform[4] !== transform[4] ||
          lastTransform[6] !== transform[6] || lastTransform[7] !== transform[7]) {
        context2d.setTransform(transform[0], transform[1], transform[3], transform[4], transform[6], transform[7]);
        mat3.copy(lastTransform, transform);
      }
      /* shadow */
      color = util.convertColorAndOpacity(
        m_this.style.get('shadowColor')(d, i), undefined, {r: 0, g: 0, b: 0, a: 0});
      if (color.a) {
        offset = m_this.style.get('shadowOffset')(d, i);
        blur = m_this.style.get('shadowBlur')(d, i);
      }
      if (color.a && ((offset && (offset.x || offset.y)) || blur)) {
        m_this._canvasProperty(context2d, 'shadowColor', util.convertColorToRGBA(color));
        if (offset && (rotation || rotateWithMap) && m_this.style.get('shadowRotate')(d, i)) {
          transform = [+offset.x, +offset.y, 0];
          vec3.rotateZ(transform, transform, [0, 0, 0],
                       rotation + (rotateWithMap ? mapRotation : 0));
          offset = {x: transform[0], y: transform[1]};
        }
        m_this._canvasProperty(context2d, 'shadowOffsetX', offset && offset.x ? +offset.x : 0);
        m_this._canvasProperty(context2d, 'shadowOffsetY', offset && offset.y ? +offset.y : 0);
        m_this._canvasProperty(context2d, 'shadowBlur', blur || 0);
      } else {
        m_this._canvasProperty(context2d, 'shadowColor', 'rgba(0,0,0,0)');
      }
      /* draw the text */
      if (stroke.a) {
        width = m_this.style.get('textStrokeWidth')(d, i);
        if (isFinite(width) && width > 0) {
          m_this._canvasProperty(context2d, 'strokeStyle', util.convertColorToRGBA(stroke));
          m_this._canvasProperty(context2d, 'lineWidth', width);
          context2d.strokeText(text, pos.x, pos.y);
          m_this._canvasProperty(context2d, 'shadowColor', 'rgba(0,0,0,0)');
        }
      }
      context2d.fillText(text, pos.x, pos.y);
    });
    m_this._canvasProperty(context2d, 'globalAlpha', 1);
    context2d.setTransform(1, 0, 0, 1, 0, 0);
  };

  return this;
};

inherit(canvas_textFeature, textFeature);

// Now register it
var capabilities = {};

registerFeature('canvas', 'text', canvas_textFeature, capabilities);

module.exports = canvas_textFeature;
