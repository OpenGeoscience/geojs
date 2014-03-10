//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global geo, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class timestamp
 *
 * @class
 * @returns {geo.timestamp}
 */
//////////////////////////////////////////////////////////////////////////////
geo.timestamp = function() {
  'use strict';
  if (!(this instanceof geo.timestamp)) {
    return new geo.timestamp();
  }
  vgl.timestamp.call(this);
};

inherit(geo.timestamp, vgl.timestamp);
