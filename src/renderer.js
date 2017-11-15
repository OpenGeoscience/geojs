var inherit = require('./inherit');
var object = require('./object');

/**
 * Create a new instance of class renderer.
 *
 * @class geo.renderer
 * @extends geo.object
 * @param {object} arg Options for the renderer.
 * @param {geo.layer} [arg.layer] Layer associated with the renderer.
 * @param {HTMLElement} [arg.canvas] Canvas element associated with the
 *   renderer.
 * @returns {geo.renderer}
 */
var renderer = function (arg) {
  'use strict';

  if (!(this instanceof renderer)) {
    return new renderer(arg);
  }
  object.call(this);

  arg = arg || {};
  var m_this = this,
      m_layer = arg.layer === undefined ? null : arg.layer,
      m_canvas = arg.canvas === undefined ? null : arg.canvas,
      m_initialized = false;

  /**
   * Get layer of the renderer.
   *
   * @returns {geo.layer}
   */
  this.layer = function () {
    return m_layer;
  };

  /**
   * Get/set canvas for the renderer.
   *
   * @param {HTMLElement} [val] If `undefined`, return the current canvas
   *    element, otherwise set the canvas element and mark the renderer as
   *    modified.
   * @returns {HTMLElement|this} The current canvas element or the renderer
   *    instance.
   */
  this.canvas = function (val) {
    if (val === undefined) {
      return m_canvas;
    }
    m_canvas = val;
    m_this.modified();
    return m_this;
  };

  /**
   * Get the map associated with the renderer's layer.
   *
   * @returns {geo.map|null} The map associated with the renderer's layer or
   *    `null` if there is no layer.
   */
  this.map = function () {
    if (m_layer) {
      return m_layer.map();
    } else {
      return null;
    }
  };

  /**
   * Get/set if renderer has been initialized.
   *
   * @param {boolean} [val] If `undefined` return the initialization state,
   *    otherwise set it.
   * @returns {boolean|this} The initialization state or this renderer
   *    instance.
   */
  this.initialized = function (val) {
    if (val === undefined) {
      return m_initialized;
    }
    m_initialized = val;
    return m_this;
  };

  /**
   * Get render API used by the renderer.
   *
   * This must be subclassed, returning a string describing the renderer
   * interface.
   */
  this.api = function () {
    throw new Error('Should be implemented by derived classes');
  };

  /**
   * Initialize.
   *
   * @returns {this}
   */
  this._init = function () {
    return m_this;
  };

  /**
   * Handle resize event.
   *
   * @param {number} x Ignored.
   * @param {number} y Ignored.
   * @param {number} w New width in pixels.
   * @param {number} h New height in pixels.
   * @returns {this}
   */
  this._resize = function (x, y, w, h) {
    return m_this;
  };

  /**
   * Render.
   *
   * @returns {this}
   */
  this._render = function () {
    return m_this;
  };

  return this;
};

inherit(renderer, object);
module.exports = renderer;
