/**
 * @module ogs.vgl
 */

/**
 * Create a new instance of class object
 *
 * @class
 * @returns {vglModule.object}
 */
vglModule.object = function() {
  if (!(this instanceof vglModule.object)) {
    return new vglModule.object();
  }

  /** @private */
  var m_modifiedTime = vglModule.timestamp();
  m_modifiedTime.modified();

  this.modified = function() {
    m_modifiedTime.modified();
  };

  this.getMTime = function() {
    return m_modifiedTime.getMTime();
  };

  return this;
};
