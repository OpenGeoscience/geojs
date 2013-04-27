/**
 * @module ogs.geo
 */

/*global geoModule, ogs, inherit*/
/*jslint devel: true, eqeq: true, forin: true, newcap: true, plusplus: true, todo: true, indent: 2*/

/**
 * Create a new instance of class command
 *
 * @class
 * @returns {geoModule.command}
 */
geoModule.command = function() {
  "use strict";
  if (!(this instanceof geoModule.command)) {
    return new geoModule.command();
  }
  ogs.vgl.command.call(this);

  return this;
};

inherit(geoModule.command, ogs.vgl.command);

/**
 * Event types
 */
geoModule.command.updateEvent = "updateEvent";
geoModule.command.addLayerEvent = "addLayerEvent";
geoModule.command.removeLayerEvent = "removeLayerEvent";
geoModule.command.toggleLayerEvent = "toggleLayerEvent";
geoModule.command.selectLayerEvent = "selectLayerEvent";
geoModule.command.unselectLayerEvent = "unselectLayerEvent";
geoModule.command.updateZoomEvent = "updateZoomEvent";
geoModule.command.resizeEvent = "resizeEvent";
