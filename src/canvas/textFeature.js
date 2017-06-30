var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var textFeature = require('../textFeature');

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
  var m_this = this;

  /**
   * Render the data on the canvas.
   * @protected
   * @param {object} context2d the canvas context to draw in.
   * @param {object} map the parent map object.
   */
  this._renderOnCanvas = function (context2d, map) {
    var data = m_this.data(),
        posFunc = m_this.style.get('position'),
        textFunc = m_this.style.get('text'),
        text, pos;

    data.forEach(function (d, i) {
      // TODO: get the position position without transform.  If it is outside
      // of the map to an extent that there is no chance of text showing,
      // skip further processing.  Also, don't change canvas properties (such
      // as font) if they haven't changed.
      pos = m_this.featureGcsToDisplay(posFunc(d, i));
      text = textFunc(d, i);

      context2d.font = 'bold 16px sans-serif'; // style | variant | weight | stretch | size/line-height | family
      context2d.textAlign = 'center';  // start, end, left, right, center
      context2d.textBaseline = 'middle'; // top, hanging, middle, alphabetic, ideographic, bottom
      context2d.direction = 'inherit'; // ltr, rtl, inherit
      context2d.fillStyle = 'black';  // css color or style

      // TODO: rotation, maxWidth, offset
      context2d.fillText(text, pos.x, pos.y);
    });
  };

  this._init(arg);
  return this;
};

inherit(canvas_textFeature, textFeature);

// Now register it
var capabilities = {};

registerFeature('canvas', 'text', canvas_textFeature, capabilities);

module.exports = canvas_textFeature;
