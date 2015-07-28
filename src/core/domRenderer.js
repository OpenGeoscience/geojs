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
      var el = $('<div id="dom-renderer"></div>');
      el.appendTo(m_this.layer().node().get(0));
      m_this.canvas(el);
    }
  };

  this._init(arg);
  return this;
};

inherit(geo.domRenderer, geo.renderer);

geo.registerRenderer('dom', geo.domRenderer);
