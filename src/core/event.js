//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class event
 *
 * @class
 * @returns {geo.event}
 */
 //////////////////////////////////////////////////////////////////////////////
geo.event = function () {
  "use strict";
  if (!(this instanceof geo.event)) {
    return new geo.event();
  }
  vgl.event.call(this);

  return this;
};

inherit(geo.event, vgl.event);

//////////////////////////////////////////////////////////////////////////////
/**
 * Event types
 */
//////////////////////////////////////////////////////////////////////////////

// TODO Add documentation
geo.event.update = "geo.update";
geo.event.opacityUpdate = "geo.opacityUpdate";
geo.event.layerAdd = "geo.layerAdd";
geo.event.layerRemove = "geo.layerRemove";
geo.event.layerToggle = "geo.layerToggle";
geo.event.layerSelect = "geo.layerSelect";
geo.event.layerUnselect = "geo.layerUnselect";
geo.event.zoom = "geo.zoom";
geo.event.center = "geo.center";
geo.event.pan = "geo.pan";
geo.event.rotate = "geo.rotate";
geo.event.resize = "geo.resize";
geo.event.animate = "geo.animate";
geo.event.query = "geo.query";
geo.event.draw = "geo.draw";
geo.event.drawEnd = "geo.drawEnd";
geo.event.animationPause = "geo.animationPause";
geo.event.animationStop = "geo.animationStop";
geo.event.animationComplete = "geo.animationComplete";

