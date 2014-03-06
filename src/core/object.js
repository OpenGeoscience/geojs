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
 * Create a new instance of class object
 *
 * @class
 * @returns {geo.object}
 */
//////////////////////////////////////////////////////////////////////////////
geo.object = function(cfg) {
  "use strict";
  if (!(this instanceof geo.object)) {
    return new geo.object();
  }
  vgl.object.call(this);

  return this;
};

inherit(geo.object, vgl.object);
