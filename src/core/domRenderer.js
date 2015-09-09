geo.domRenderer = function (arg) {
  'use strict';

  if (!(this instanceof geo.domRenderer)) {
    return new geo.domRenderer(arg);
  }
  geo.renderer.call(this, arg);

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

inherit(geo.domRenderer, geo.renderer);

geo.registerRenderer('dom', geo.domRenderer);
