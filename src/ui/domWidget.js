geo.gui.domWidget = function (arg) {
  'use strict';
  if (!(this instanceof geo.gui.domWidget)) {
    return new geo.gui.domWidget(arg);
  }

  geo.gui.widget.call(this, arg);

  var m_this = this;

  this._init = function (arg) {
    m_this.args = arg;
    m_this.$el = $(arg.el || '<div></div>');

    if (arg.hasOwnProperty('parent') && arg.parent instanceof geo.gui.widget) {
      arg.parent.addChild(m_this);
    }

    m_this.$el.appendTo(m_this.parentCanvas());
    if (arg.hasOwnProperty('attrs')) {
      m_this.$el.attr(arg.attrs);
    }

    this.positionMaybe();

    m_this.$el.on('mousedown', function (e) {
      e.stopPropagation();
    });
  };

  return this;
};

inherit(geo.gui.domWidget, geo.gui.widget);

geo.registerWidget('dom', 'dom', geo.gui.domWidget);
