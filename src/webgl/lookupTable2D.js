var inherit = require('../inherit');
var timestamp = require('../timestamp');
var vgl = require('../vgl');

/**
 * Switch to a specific texture unit.
 *
 * @param {vgl.renderState} renderState An object that contains the context
 *   used for drawing.
 * @param {number} textureUnit The number of the texture unit [0-15].
 */
function activateTextureUnit(renderState, textureUnit) {
  if (textureUnit >= 0 && textureUnit <= 31) {
    renderState.m_context.activeTexture(vgl.GL.TEXTURE0 + textureUnit);
  } else {
    throw Error('[error] Texture unit ' + textureUnit + ' is not supported');
  }
}

/**
 * Create a new instance of class webgl_lookupTable2D.
 *
 * @class
 * @alias geo.webgl.lookupTable2D
 * @param {object} arg Options object.
 * @param {number} [arg.maxWidth] Maximum width to use for the texture.  If the
 *   number of colors set is less than this, the texture is 1D.  If greater, it
 *   will be a rectangle of maxWidth x whatever height is necessary.
 * @param {number[]} [arg.colorTable] Initial color table for the texture.
 *   This is of the form RGBARGBA... where each value is an integer on the
 *   scale [0,255].
 * @extends vgl.texture
 * @returns {geo.webgl.lookupTable2D}
 */
var webgl_lookupTable2D = function (arg) {
  'use strict';

  if (!(this instanceof webgl_lookupTable2D)) {
    return new webgl_lookupTable2D(arg);
  }
  arg = arg || {};
  vgl.texture.call(this);

  var m_setupTimestamp = timestamp(),
      m_maxWidth = arg.maxWidth || 4096,
      m_colorTable = new Uint8Array([0, 0, 0, 0]),
      m_colorTableOrig,
      m_this = this;

  /**
   * Create lookup table, initialize parameters, and bind data to it.
   *
   * @param {vgl.renderState} renderState An object that contains the context
   *   used for drawing.
   */
  this.setup = function (renderState) {
    activateTextureUnit(renderState, m_this.textureUnit());

    renderState.m_context.deleteTexture(m_this.m_textureHandle);
    m_this.m_textureHandle = renderState.m_context.createTexture();
    renderState.m_context.bindTexture(vgl.GL.TEXTURE_2D, m_this.m_textureHandle);
    renderState.m_context.texParameteri(vgl.GL.TEXTURE_2D, vgl.GL.TEXTURE_MIN_FILTER, vgl.GL.NEAREST);
    renderState.m_context.texParameteri(vgl.GL.TEXTURE_2D, vgl.GL.TEXTURE_MAG_FILTER, vgl.GL.NEAREST);
    renderState.m_context.texParameteri(vgl.GL.TEXTURE_2D, vgl.GL.TEXTURE_WRAP_S, vgl.GL.CLAMP_TO_EDGE);
    renderState.m_context.texParameteri(vgl.GL.TEXTURE_2D, vgl.GL.TEXTURE_WRAP_T, vgl.GL.CLAMP_TO_EDGE);
    renderState.m_context.pixelStorei(vgl.GL.UNPACK_ALIGNMENT, 1);
    renderState.m_context.pixelStorei(vgl.GL.UNPACK_FLIP_Y_WEBGL, true);

    renderState.m_context.texImage2D(
      vgl.GL.TEXTURE_2D, 0, vgl.GL.RGBA, m_this.width, m_this.height, 0,
      vgl.GL.RGBA, vgl.GL.UNSIGNED_BYTE, m_colorTable);

    renderState.m_context.bindTexture(vgl.GL.TEXTURE_2D, null);
    m_setupTimestamp.modified();
  };

  /**
   * Get/set color table.
   *
   * @param {number[]} [val] An array of RGBARGBA... integers on a scale
   *   of [0, 255].  `undefined` to get the current value.
   * @returns {number[]|this}
   */
  this.colorTable = function (val) {
    if (val === undefined) {
      return m_colorTableOrig;
    }
    m_colorTableOrig = val;
    if (val.length < 4) {
      val = [0, 0, 0, 0];
    }
    m_this.width = Math.min(m_maxWidth, val.length / 4);
    m_this.height = Math.ceil(val.length / 4 / m_maxWidth);
    if (!(val instanceof Uint8Array) || val.length !== m_this.width * m_this.height * 4) {
      if (val.length < m_this.width * m_this.height * 4) {
        val = val.concat(new Array(m_this.width * m_this.height * 4 - val.length).fill(0));
      }
      m_colorTable = new Uint8Array(val);
    } else {
      m_colorTable = val;
    }
    m_this.modified();
    return m_this;
  };

  /**
   * Get maxWidth value.
   *
   * @returns {number} The maxWidth of the texture used.
   */
  this.maxWidth = function () {
    return m_maxWidth;
  };

  this.colorTable(arg.colorTable || []);

  return this;
};

inherit(webgl_lookupTable2D, vgl.texture);

module.exports = webgl_lookupTable2D;
