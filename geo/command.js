/**
 * @module ogs.geo
 * @class command
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