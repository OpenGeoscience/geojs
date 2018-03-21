var widget = require('./widget');
var inherit = require('../inherit');
var registerWidget = require('../registry').registerWidget;

/**
 * Create a new instance of class geo.gui.svgWidget.
 *
 * Due to the nature of d3 creating DOM elements as it inserts them, calls to
 * appendChild don't appear in this widget.
 *
 * The canvas of an svgWidget always refers to the actual svg element.
 * The parentCanvas can refer to another widget's svg element, dom element, or
 * the UI layer's dom element.
 * See {@link geo.gui.widget#parentCanvas}.
 *
 * @class
 * @alias geo.gui.svgWidget
 * @extends geo.gui.widget
 * @param {object} arg
 * @param {geo.widget} [parent] A parent widget for this widget.
 * @returns {geo.gui.svgWidget}
 */
var svgWidget = function (arg) {
  'use strict';
  if (!(this instanceof svgWidget)) {
    return new svgWidget(arg);
  }

  widget.call(this, arg);

  var d3Renderer = require('../d3/d3Renderer');

  var m_this = this,
      s_exit = this._exit,
      m_renderer = null;

  /**
   * Initializes SVG Widget.
   *
   * @returns {this}
   */
  this._init = function () {
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
    return m_this;
  };

  /**
   * Clean up the widget.
   */
  this._exit = function () {
    if (m_renderer) {
      m_renderer._exit();
    }
    s_exit();
  };

  /**
   * Creates the canvas for the svg widget.
   * This directly uses the {@link geo.d3.d3Renderer} as a helper to do all of
   * the heavy lifting.
   *
   * @param {d3Selector} d3Parent The canvas's parent element.
   */
  this._createCanvas = function (d3Parent) {
    var rendererOpts = {
      layer: m_this.layer(),
      widget: true
    };

    if (d3Parent) {
      rendererOpts.d3Parent = d3Parent;
    }

    m_renderer = d3Renderer(rendererOpts);

    // svg widgets manage their own sizes, so make the resize handler a no-op
    m_renderer._resize = function () {};

    m_this.canvas(m_renderer.canvas()[0][0]);
  };

  return this;
};

inherit(svgWidget, widget);

registerWidget('dom', 'svg', svgWidget);
module.exports = svgWidget;
