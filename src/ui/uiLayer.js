//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class uiLayer
 *
 * @class
 * @returns {geo.uiLayer}
 */
//////////////////////////////////////////////////////////////////////////////
geo.uiLayer = function (arg) {
  'use strict';

  // The widget stays fixed on the screen.  (only available in d3 at the moment)
  arg.renderer = 'd3Renderer';
  arg.sticky = false;

  if (!(this instanceof geo.uiLayer)) {
    return new geo.uiLayer(arg);
  }
  geo.layer.call(this, arg);

  var m_this = this;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create a new ui control
   *
   * @returns {geo.Widget} Will return a new control widget
   */
  ////////////////////////////////////////////////////////////////////////////
  this.createWidget = function (widgetName, arg) {

    var newWidget = geo.createWidget(
      widgetName, m_this, m_this.renderer(), arg);

    m_this.addChild(newWidget);
    newWidget._init();
    m_this.modified();
    return newWidget;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Delete a ui control
   */
  ////////////////////////////////////////////////////////////////////////////
  this.deleteWidget = function (widget) {
    widget._exit();
    m_this.removeChild(widget);
    m_this.modified();
    return m_this;
  };
};

inherit(geo.uiLayer, geo.layer);

geo.registerLayer('ui', geo.uiLayer);
