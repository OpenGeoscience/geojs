//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

vglModule.data = function() {
  'use strict';

  if (!(this instanceof vglModule.data)) {
    return new vglModule.data();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return data type. Should be implemented by a derived class
   */
  ////////////////////////////////////////////////////////////////////////////
  this.type = function() {
  }
};

vglModule.data.raster = 0;
vglModule.data.point = 1;
vglModule.data.lineString = 2;
vglModule.data.polygon = 3;
vglModule.data.geometry = 10;