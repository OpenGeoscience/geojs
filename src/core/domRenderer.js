var inherit = require('../util').inherit;
var renderer = require('./renderer');
var registerRenderer = require('../util').registerRenderer;

/**
 * @class geo.domRenderer
 * @extends geo.renderer
 */
var domRenderer = function (arg) {
  'use strict';

  if (!(this instanceof domRenderer)) {
    return new domRenderer(arg);
  }
  renderer.call(this, arg);

  arg = arg || {};

  var m_this = this;

  this.api = function () {
    return 'dom';
  };

  this._init = function () {
    var layer = m_this.layer().node();

    if (!m_this.canvas() && layer && layer.length) {
      // The renderer and the UI Layer share the same canvas
      // at least for now. This renderer is essentially a noop renderer
      // designed for backwards compatibility
      m_this.canvas(layer[0]);
    }
  };

  this._init(arg);
  return this;
};

inherit(domRenderer, renderer);
registerRenderer('dom', domRenderer);
module.exports = domRenderer;
