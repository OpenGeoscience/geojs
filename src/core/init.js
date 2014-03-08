//////////////////////////////////////////////////////////////////////////////
/**
 * @module geojs
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vgl, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

if(typeof ogs === 'undefined') {
  var ogs = {};
}

//////////////////////////////////////////////////////////////////////////////
/**
 * Create namespace for the given name
 *
 * @param ns_string
 * @returns {*|{}}
 */
//////////////////////////////////////////////////////////////////////////////
ogs.namespace = function(ns_string) {
  'use strict';

  var parts = ns_string.split('.'), parent = ogs, i;

  // strip redundant leading global
  if (parts[0] === "ogs") {
    parts = parts.slice(1);
  }
  for (i = 0; i < parts.length; i += 1) {
    // create a property if it doesn't exist
    if (typeof parent[parts[i]] === "undefined") {
      parent[parts[i]] = {};
    }
    parent = parent[parts[i]];
  }
  return parent;
};

/** geo namespace */
var geo = ogs.namespace("geo");

geo.renderers = {};
geo.features = {};

//////////////////////////////////////////////////////////////////////////////
/**
 * Convenient function to define JS inheritance
 *
 * @param C
 * @param P
 */
//////////////////////////////////////////////////////////////////////////////
function inherit(C, P) {
  "use strict";

  var F = function() {
  };
  F.prototype = P.prototype;
  C.prototype = new F();
  C.uber = P.prototype;
  C.prototype.constructor = C;
}

//////////////////////////////////////////////////////////////////////////////
/**
 * Convenient function to get size of an object
 *
 * @param obj
 * @returns {number} *
 */
//////////////////////////////////////////////////////////////////////////////
Object.size = function(obj) {
  "use strict";

  var size = 0, key = null;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      size++;
    }
  }
  return size;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a new renderer type
 */
//////////////////////////////////////////////////////////////////////////////
geo.registerRenderer = function(category, name, func) {
  if (geo.renderers.hasKey(category)) {
    geo.renderers[category] = {};
  }

  geo.renderers[category][name] = func;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Register a new feature type
 */
//////////////////////////////////////////////////////////////////////////////
geo.registerFeature = function(category, name, func) {
  if (geo.features.hasKey(category)) {
    geo.features[category] = {};
  }

  // TODO Add warning if the name already exists
  geo.features[category][name] = func;
};
