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
