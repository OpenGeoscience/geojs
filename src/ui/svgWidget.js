geo.gui.svgWidget = function (arg) {
  'use strict';
  if (!(this instanceof geo.gui.svgWidget)) {
    return new geo.gui.svgWidget(arg);
  }

  geo.gui.widget.call(this, arg);

  var m_this = this;

  this._init = function (arg) {
    m_this.args = arg;

    if (arg.hasOwnProperty('parent') && arg.parent instanceof geo.gui.widget) {
      arg.parent.addChild(m_this);
    }

    // @todo error handling has to be done here, dealing with d3/jquery interop
    m_this.$el = $(d3.select(m_this.parentCanvas()[0]).append('svg')[0]);
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

// @todo this should inherit domWidget
inherit(geo.gui.svgWidget, geo.gui.widget);

geo.registerWidget('dom', 'svg', geo.gui.svgWidget);
