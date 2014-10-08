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
geo.event.update = "geo_update";
geo.event.opacityUpdate = "geo_opacityUpdate";
geo.event.layerAdd = "geo_layerAdd";
geo.event.layerRemove = "geo_layerRemove";
geo.event.layerToggle = "geo_layerToggle";
geo.event.layerSelect = "geo_layerSelect";
geo.event.layerUnselect = "geo_layerUnselect";
geo.event.zoom = "geo_zoom";
geo.event.center = "geo_center";
geo.event.pan = "geo_pan";
geo.event.rotate = "geo_rotate";
geo.event.resize = "geo_resize";
geo.event.animate = "geo_animate";
geo.event.query = "geo_query";
geo.event.draw = "geo_draw";
geo.event.drawEnd = "geo_drawEnd";
geo.event.animationPause = "geo_animationPause";
geo.event.animationStop = "geo_animationStop";
geo.event.animationComplete = "geo_animationComplete";

