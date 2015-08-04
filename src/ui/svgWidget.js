//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class geo.gui.svgWidget
 *
 * Due to the nature of d3 creating DOM elements as it inserts them, calls to appendChild
 * don't appear in this widget.
 *
 * The canvas of an svgWidget always refers to the actual <svg> element.
 * The parentCanvas can refer to another widgets svg element, dom element, or the
 * UI layers dom element. See {geo.gui.widget.parentCanvas}.
 *
 * @class
 * @extends geo.gui.domWidget
 * @returns {geo.gui.svgWidget}
 *
 */
//////////////////////////////////////////////////////////////////////////////
geo.gui.svgWidget = function (arg) {
  'use strict';
  if (!(this instanceof geo.gui.svgWidget)) {
    return new geo.gui.svgWidget(arg);
  }

  geo.gui.domWidget.call(this, arg);

  var m_this = this,
      m_renderer = geo.d3.d3Renderer;

  this._init = function (arg) {
    var d3Parent;
    arg = m_this.parseArgs(arg);
    m_this.args = arg;

    if (arg.hasOwnProperty('parent')) {
      arg.parent.addChild(m_this);

      // Tell the renderer there is an SVG element as a parent
      d3Parent = arg.parent.canvas();
    }

    m_this._createCanvas(d3Parent);

    m_this.canvas().addEventListener('mousedown', function (e) {
      e.stopPropagation();
    });

    this.reposition();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Creates the canvas for the svg widget.
   * This directly uses the d3 Renderer as a helper to do all of the heavy lifting.
   */
  ////////////////////////////////////////////////////////////////////////////
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

  return this;
};

inherit(geo.gui.svgWidget, geo.gui.domWidget);

geo.registerWidget('dom', 'svg', geo.gui.svgWidget);
