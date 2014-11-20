//////////////////////////////////////////////////////////////////////////////
/**
 * @namespace geo
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
geo.event.pan = "geo_pan";
geo.event.rotate = "geo_rotate";
geo.event.resize = "geo_resize";
geo.event.animate = "geo_animate";
geo.event.query = "geo_query";
geo.event.draw = "geo_draw";
geo.event.drawEnd = "geo_drawEnd";
geo.event.mousemove = "geo_mousemove";
geo.event.mouseclick = "geo_mouseclick";
geo.event.brush = "geo_brush"; // mousemove during a selection
geo.event.brushend = "geo_brushend"; // mouseup after a selection has been made
geo.event.brushstart = "geo_brushstart"; // mousedown starting a selection
