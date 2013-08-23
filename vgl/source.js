//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

/**
 * Create a new instance of class source
 *
 * @class
 * @returns {vglModule.source}
 */
vglModule.source = function() {

  if (!(this instanceof vglModule.source)) {
    return new vglModule.source();
  }

  vglModule.object.call(this);

  /**
   * Virtual function to create a source instance
   */
  this.create = function() {
  };

  return this;
};

inherit(vglModule.source, vglModule.object);
