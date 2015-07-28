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
    if (!m_this.canvas()) {
      // The renderer and the UI Layer share the same canvas
      // at least for now. This renderer is essentially a noop renderer
      // designed for backwards compatibility
      m_this.canvas(m_this.layer().node());
    }
  };

  this._init(arg);
  return this;
};

inherit(geo.domRenderer, geo.renderer);

geo.registerRenderer('dom', geo.domRenderer);
