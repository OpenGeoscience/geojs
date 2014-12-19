//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class legendWidget
 *
 * @class
 * @returns {geo.gui.legendWidget}
 */
//////////////////////////////////////////////////////////////////////////////
geo.gui.legendWidget = function (arg) {
  'use strict';
  if (!(this instanceof geo.gui.legendWidget)) {
    return new geo.gui.legendWidget(arg);
  }
  geo.gui.widget.call(this, arg);
};

inherit(geo.gui.legendWidget, geo.gui.widget);

geo.registerWidget('d3', 'legend', geo.gui.legendWidget);
