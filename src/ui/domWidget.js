geo.gui.domWidget = function (arg) {
  'use strict';
  if (!(this instanceof geo.gui.domWidget)) {
    return new geo.gui.domWidget(arg);
  }

  geo.gui.widget.call(this, arg);

  var m_this = this;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initializes DOM Widget.
   * Sets the canvas for the widget, does parent/child relationship management,
   * appends it to it's parent and handles any positioning logic.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    m_this.args = arg;
    m_this.args.sticky = arg.sticky || false;
    m_this.args.positionType = arg.positionType || 'viewport';
    m_this.canvas($(arg.el || '<div></div>'));

    if (arg.hasOwnProperty('parent') && arg.parent instanceof geo.gui.widget) {
      arg.parent.addChild(m_this);
    }

    m_this.canvas().appendTo(m_this.parentCanvas());

    m_this.canvas().on('mousedown', function (e) {
      e.stopPropagation();
    });

    this.positionMaybe();
  };

  return this;
};

inherit(geo.gui.domWidget, geo.gui.widget);

geo.registerWidget('dom', 'dom', geo.gui.domWidget);
