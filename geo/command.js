/**
 * @module ogs.geo
 */

/**
 * Create a new instance of class command
 *
 * @class
 * @returns {geoModule.command}
 */
geoModule.command = function() {

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