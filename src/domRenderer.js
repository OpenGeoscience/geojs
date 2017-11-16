var inherit = require('./inherit');
var renderer = require('./renderer');
var registerRenderer = require('./registry').registerRenderer;

/**
 * Create a new instance of class domRenderer.
 *
 * @class geo.domRenderer
 * @extends geo.renderer
 * @param {object} arg Options for the renderer.
 * @param {geo.layer} [arg.layer] Layer associated with the renderer.
 * @param {HTMLElement} [arg.canvas] Canvas element associated with the
 *   renderer.
 * @returns {geo.domRenderer}
 */
var domRenderer = function (arg) {
  'use strict';

  if (!(this instanceof domRenderer)) {
    return new domRenderer(arg);
  }
  renderer.call(this, arg);

  arg = arg || {};

  var m_this = this;

  /**
   * Get API used by the renderer.
   *
   * @returns {string} 'dom'.
   */
  this.api = function () {
    return 'dom';
  };

  /**
   * Initialize.
   *
   * @returns {this}
   */
  this._init = function () {
    var layer = m_this.layer().node();

    if (!m_this.canvas() && layer && layer.length) {
      // The renderer and the UI Layer share the same canvas
      // at least for now. This renderer is essentially a noop renderer
      // designed for backwards compatibility
      m_this.canvas(layer[0]);
    }
    return m_this;
  };

  this._init(arg);
  return this;
};

inherit(domRenderer, renderer);
registerRenderer('dom', domRenderer);
module.exports = domRenderer;
