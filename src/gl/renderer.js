//////////////////////////////////////////////////////////////////////////////
/**
 * @module ggl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global window, ggl, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class vglRenderer
 *
 * @param canvas
 * @returns {ggl.vglRenderer}
 */
//////////////////////////////////////////////////////////////////////////////
ggl.renderer = function(arg) {
  'use strict';

  if (!(this instanceof ggl.renderer)) {
    return new ggl.renderer(arg);
  }
  geo.renderer.call(this, arg);

  var m_this = this;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get context specific renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.contextRenderer = function() {
    throw "Should be implemented by derived classes";
  };

  return this;
};

inherit(ggl.renderer, geo.renderer);

geo.registerRenderer('vglRenderer', ggl.vglRenderer);