geo.gui.domWidget = function (arg) {
  'use strict';
  if (!(this instanceof geo.gui.domWidget)) {
    return new geo.gui.domWidget(arg);
  }

  geo.gui.widget.call(this, arg);

  var m_this = this,
      m_default_canvas = 'div';

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initializes DOM Widget.
   * Sets the canvas for the widget, does parent/child relationship management,
   * appends it to it's parent and handles any positioning logic.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    arg = m_this.parseArgs(arg);
    m_this.args = arg;

    if (arg.hasOwnProperty('parent')) {
      arg.parent.addChild(m_this);
    }

    m_this._createCanvas();
    m_this._appendChild();

    m_this.canvas().addEventListener('mousedown', function (e) {
      e.stopPropagation();
    });

    this.reposition();
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Creates the widget canvas.
   * This is just a simple DOM element (based on args.el, or defaults to a div)
   */
  ////////////////////////////////////////////////////////////////////////////
  this._createCanvas = function () {
    m_this.canvas(document.createElement(m_this.args.el || m_default_canvas));
  };

  return this;
};

inherit(geo.gui.domWidget, geo.gui.widget);

geo.registerWidget('dom', 'dom', geo.gui.domWidget);
