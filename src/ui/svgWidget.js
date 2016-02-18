//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class geo.gui.svgWidget
 *
 * Due to the nature of d3 creating DOM elements as it inserts them, calls to appendChild
 * don't appear in this widget.
 *
 * The canvas of an svgWidget always refers to the actual svg element.
 * The parentCanvas can refer to another widgets svg element, dom element, or the
 * UI layers dom element.
 * See {@link geo.gui.widget#parentCanvas}.
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
      m_renderer = null;

  this._init = function (arg) {
    var d3Parent;
    if (arg.hasOwnProperty('parent')) {
      arg.parent.addChild(m_this);

      // Tell the renderer there is an SVG element as a parent
      d3Parent = arg.parent.canvas();
    }

    m_this._createCanvas(d3Parent);

    m_this.canvas().addEventListener('mousedown', function (e) {
      e.stopPropagation();
    });

    m_this.reposition();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Creates the canvas for the svg widget.
   * This directly uses the {@link geo.d3.d3Renderer} as a helper to do all of the heavy
   * lifting.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._createCanvas = function (d3Parent) {
    var rendererOpts = {
      layer: m_this.layer(),
      widget: true
    };

    if (d3Parent) {
      rendererOpts.d3Parent = d3Parent;
    }

    m_renderer = geo.d3.d3Renderer(rendererOpts);

    m_this.canvas(m_renderer.canvas()[0][0]);
  };

  return this;
};

inherit(geo.gui.svgWidget, geo.gui.domWidget);

geo.registerWidget('dom', 'svg', geo.gui.svgWidget);
