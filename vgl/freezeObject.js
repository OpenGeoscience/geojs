//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Freeze javascript object
 *
 * @param obj
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.freezeObject = function(obj) {
  'use strict';

  /**
   * Freezes an object, using Object.freeze if available, otherwise returns
   * the object unchanged.  This function should be used in setup code to prevent
   * errors from completely halting JavaScript execution in legacy browsers.
   *
   * @exports freezeObject
   */
  var freezedObject = Object.freeze(obj);
  if (typeof freezedObject === 'undefined') {
    freezedObject = function(o) {
      return o;
    };
  }

  return freezedObject;
};
