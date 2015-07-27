geo.gui.divWidget = function (arg) {
  'use strict';
  if (!(this instanceof geo.gui.divWidget)) {
    return new geo.gui.divWidget(arg);
  }

  geo.gui.widget.call(this, arg);

  var m_this = this,
      s_exit = this._exit;

  this._init = function () {
    console.log('div widget loaded');
  };

  this._exit = function () {
    // remove div

    // undo event listeners

    s_exit();
  };
};

inherit(geo.gui.divWidget, geo.gui.widget);

geo.registerWidget('dom', 'div', geo.gui.divWidget);
