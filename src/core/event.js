//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class event
 *
 * @class
 * @returns {geo.event}
 */
 //////////////////////////////////////////////////////////////////////////////
geo.event = function() {
  "use strict";
  if (!(this instanceof geo.event)) {
    return new geo.event();
  }
  vgl.command.call(this);

  return this;
};

inherit(geo.event, vgl.command);

//////////////////////////////////////////////////////////////////////////////
/**
 * Event types
 */
//////////////////////////////////////////////////////////////////////////////
geo.event.update = "update";
geo.event.opacityUpdate = "opacityUpdate";
geo.event.layerAdd = "layerAdd";
geo.event.layerRemove = "layerRemove";
geo.event.layerToggle = "layerToggle";
geo.event.layerSelect = "layerSelect";
geo.event.layerUnselect = "layerUnselect";
geo.event.zoom = "zoom";
geo.event.center = "center";
geo.event.pan = "pan";
geo.event.rotate = "rotate";
geo.event.resize = "resize";
geo.event.animate = "animate";
geo.event.query = "query";
