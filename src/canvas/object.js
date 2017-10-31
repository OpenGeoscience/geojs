var inherit = require('../inherit');
var sceneObject = require('../sceneObject');

/**
 * Canvas specific subclass of object which rerenders when the object is drawn.
 * @class
 * @alias geo.canvas.object
 * @extends geo.sceneObject
 * @param {object} arg Options for the object.
 * @returns {geo.canvas.object}
 */
var canvas_object = function (arg) {
  'use strict';

  var object = require('../object');

  // this is used to extend other geojs classes, so only generate
  // a new object when that is not the case... like if this === window
  if (!(this instanceof object)) {
    return new canvas_object(arg);
  }
  sceneObject.call(this);

  var m_this = this,
      s_draw = this.draw,
      m_canvasProperties = {};

  /**
   * This must be overridden by any feature that needs to render.
   */
  this._renderOnCanvas = function () {
  };

  /**
   * If this returns true, the render will be skipped and tried again on the
   * next animation frame.
   *
   * @returns {boolean} Truthy to delay rendering.
   */
  this._delayRender = function () {
    return false;
  };

  /**
   * Check if a property has already been set on a canvas's context.  If so,
   * don't set it again.  Some browsers are much slower if the properties are
   * set, even if no change is made.
   *
   * @param {CanvasRenderingContext2D} [context] The canvas context to modify.
   *    If `undefined`, clear the internal property buffer.
   * @param {string} [key] The property to set on the canvas.
   * @param {object} [value] The value for the property.
   * @returns {this} The current object.
   */
  this._canvasProperty = function (context, key, value) {
    if (!context || !key) {
      m_canvasProperties = {};
      return m_this;
    }
    if (m_canvasProperties[key] !== value) {
      m_canvasProperties[key] = value;
      context[key] = value;
    }
    return m_this;
  };

  /**
   * Redraw the object.
   *
   * @returns {this} The current object.
   */
  this.draw = function () {
    m_this._update();
    m_this.renderer()._render();
    s_draw();
    return m_this;
  };

  return this;
};

inherit(canvas_object, sceneObject);
module.exports = canvas_object;
