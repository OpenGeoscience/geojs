//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class command
 *
 * @class
 * @returns {geo.command}
 */
 //////////////////////////////////////////////////////////////////////////////
geo.command = function() {
  "use strict";
  if (!(this instanceof geo.command)) {
    return new geo.command();
  }
  ogs.vgl.command.call(this);

  return this;
};

inherit(geo.command, ogs.vgl.command);

//////////////////////////////////////////////////////////////////////////////
/**
 * Event types
 */
//////////////////////////////////////////////////////////////////////////////
geo.command.updateEvent = "updateEvent";
geo.command.updateLayerOpacityEvent = "updateLayerOpacityEvent";
geo.command.addLayerEvent = "addLayerEvent";
geo.command.removeLayerEvent = "removeLayerEvent";
geo.command.toggleLayerEvent = "toggleLayerEvent";
geo.command.selectLayerEvent = "selectLayerEvent";
geo.command.unselectLayerEvent = "unselectLayerEvent";
geo.command.updateZoomEvent = "updateZoomEvent";
geo.command.updateViewZoomEvent = "updateViewZoomEvent";
geo.command.updateViewPositionEvent = "updateViewPositionEvent";
geo.command.updateDrawRegionEvent = "updateDrawRegionEvent";
geo.command.resizeEvent = "resizeEvent";
geo.command.animateEvent = "animateEvent";
geo.command.requestRedrawEvent = "requestRedrawEvent";
geo.command.requestPredrawEvent = "requestPredrawEvent";
geo.command.queryResultEvent = "queryResultEvent";
