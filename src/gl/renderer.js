//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class vglRenderer
 *
 * @class
 * @extends geo.renderer
 * @param canvas
 * @returns {geo.gl.renderer}
 */
//////////////////////////////////////////////////////////////////////////////
geo.gl.renderer = function (arg) {
  'use strict';

  if (!(this instanceof geo.gl.renderer)) {
    return new geo.gl.renderer(arg);
  }
  geo.renderer.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get context specific renderer
   */
  ////////////////////////////////////////////////////////////////////////////
  this.contextRenderer = function () {
    throw 'Should be implemented by derived classes';
  };

  return this;
};

inherit(geo.gl.renderer, geo.renderer);
