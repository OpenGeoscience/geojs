//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class uiLayer
 *
 * @class
 * @extends {geo.layer}
 * @returns {geo.gui.uiLayer}
 */
//////////////////////////////////////////////////////////////////////////////
geo.gui.uiLayer = function (arg) {
  'use strict';

  // The widget stays fixed on the screen.
  arg.renderer = 'dom';
  arg.sticky = false;

  if (!(this instanceof geo.gui.uiLayer)) {
    return new geo.gui.uiLayer(arg);
  }
  geo.layer.call(this, arg);

  var m_this = this,
      s_init = this._init,
      s_exit = this._exit;

  this._init = function () {
    s_init();
    m_this.node().css('position', 'relative');
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create a new ui control
   *
   * @returns {geo.gui.Widget} Will return a new control widget
   */
  ////////////////////////////////////////////////////////////////////////////
  this.createWidget = function (widgetName, arg) {
    var newWidget = geo.createWidget(widgetName, m_this, arg);

    // We only want top level widgets to be a child of the uiLayer
    if (!(arg && 'parent' in arg)) {
      m_this.addChild(newWidget);
    }

    newWidget._init(arg);
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

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Free memory and destroy the layer.
   */
  ////////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    m_this.children().forEach(function (child) {
      m_this.deleteWidget(child);
    });
    s_exit();
  };
};

inherit(geo.gui.uiLayer, geo.layer);

geo.registerLayer('ui', geo.gui.uiLayer);
