/**
 * @module ogs.vgl
 */

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
