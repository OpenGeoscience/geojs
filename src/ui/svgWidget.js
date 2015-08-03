geo.gui.svgWidget = function (arg) {
  'use strict';
  if (!(this instanceof geo.gui.svgWidget)) {
    return new geo.gui.svgWidget(arg);
  }

  geo.gui.domWidget.call(this, arg);

  var m_this = this,
      m_renderer = geo.d3.d3Renderer;

  this._createCanvas = function (d3Parent) {
    var rendererOpts = {
      layer: m_this.layer()
    };

    if (d3Parent) {
      rendererOpts.d3Parent = d3Parent;
    }

    var renderer = m_renderer(rendererOpts);

    m_this.canvas(renderer.canvas()[0][0].parentNode);
  };

  this._init = function () {
    arg = arg || {};
    m_this.args = arg;
    m_this.args.sticky = arg.sticky || false;
    m_this.args.positionType = arg.positionType || 'viewport';
    var d3Parent;

    if (arg.hasOwnProperty('parent') && arg.parent instanceof geo.gui.widget) {
      arg.parent.addChild(m_this);

      d3Parent = arg.parent.canvas();
    }

    m_this._createCanvas(d3Parent);

    m_this.canvas().addEventListener('mousedown', function (e) {
      e.stopPropagation();
    });

    this.reposition();
  };

  return this;
};

inherit(geo.gui.svgWidget, geo.gui.domWidget);

geo.registerWidget('dom', 'svg', geo.gui.svgWidget);
