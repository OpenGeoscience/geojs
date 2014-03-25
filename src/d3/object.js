//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo.d3
 */

/*jslint devel: true, unparam: true, indent: 2*/

/*global geo, inherit, gd3*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * D3 specific subclass of object which adds an id property for d3 selections
 * on groups of objects by class id.
 */
//////////////////////////////////////////////////////////////////////////////

gd3.object = function (arg) {
  'use strict';
  // this is used to extend other geojs classes, so only generate
  // a new object when that is not the case... like if this === window
  if (!(this instanceof geo.object)) {
    return new gd3.object(arg);
  }

  var m_id = 'd3-' + gd3.uniqueID();

  this._d3id = function () {
    return m_id;
  };
  
  geo.sceneObject.call(this);
  return this;
};

inherit(gd3.object, geo.sceneObject);
