var inherit = require('../util').inherit;
var registerLayer = require('../util').registerLayer;
var layer = require('../core/layer');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class uiLayer
 *
 * @class geo.gui.uiLayer
 * @extends {geo.layer}
 * @returns {geo.gui.uiLayer}
 */
//////////////////////////////////////////////////////////////////////////////
var uiLayer = function (arg) {
  'use strict';

  var createWidget = require('../util').createWidget;

  // The widget stays fixed on the screen.
  arg.renderer = 'dom';
  arg.sticky = false;

  if (!(this instanceof uiLayer)) {
    return new uiLayer(arg);
  }
  layer.call(this, arg);

  var m_this = this,
      s_exit = this._exit;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Create a new ui control
   *
   * @returns {geo.gui.Widget} Will return a new control widget
   */
  ////////////////////////////////////////////////////////////////////////////
  this.createWidget = function (widgetName, arg) {
    var newWidget = createWidget(widgetName, m_this, arg);

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

inherit(uiLayer, layer);

registerLayer('ui', uiLayer);
module.exports = uiLayer;
