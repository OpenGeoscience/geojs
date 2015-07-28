geo.gui.divWidget = function (arg) {
  'use strict';
  if (!(this instanceof geo.gui.divWidget)) {
    return new geo.gui.divWidget(arg);
  }

  geo.gui.widget.call(this, arg);

  var m_this = this;

  this.$el = $('<div></div>');

  this._init = function (arg) {
    m_this.args = arg;

    m_this.$el.appendTo(m_this.layer().canvas());
    if (arg.hasOwnProperty('attrs')) {
      m_this.$el.attr(arg.attrs);
    }

    this.positionMaybe();
  };

  return this;
};

inherit(geo.gui.divWidget, geo.gui.widget);

geo.registerWidget('dom', 'div', geo.gui.divWidget);
