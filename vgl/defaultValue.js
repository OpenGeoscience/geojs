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
 * Returns the first parameter if not undefined,
 * otherwise the second parameter.
 *
 * @class
 * @returns {vglModule.defaultValue}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.defaultValue = function(a, b) {
  "use strict";

  if (typeof a !== 'undefined') {
    return a;
  }
  return b;
};

vglModule.defaultValue.EMPTY_OBJECT = vglModule.freezeObject({});
