geo.gui.svgWidget = function (arg) {
  'use strict';
  if (!(this instanceof geo.gui.svgWidget)) {
    return new geo.gui.svgWidget(arg);
  }

  geo.gui.domWidget.call(this, arg);

  var m_this = this;

  this._createCanvas = function () {
    m_this.canvas(d3.select(m_this.parentCanvas()).append('svg')[0][0]);
  };

  this._appendChild = function () {
    if (m_this.parent() instanceof geo.gui.svgWidget) {
      throw 'Nested svgWidgets not yet supported.';
    } else {
      // The parent is another type of widget, or the UI Layer
      m_this.parentCanvas().appendChild(m_this.canvas());
    }
  };

  return this;
};

inherit(geo.gui.svgWidget, geo.gui.domWidget);

geo.registerWidget('dom', 'svg', geo.gui.svgWidget);
