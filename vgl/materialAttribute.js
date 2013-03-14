/**
 * @module ogs.vgl
 */

var materialAttributeType = {
  "Undefined" : 0x0,
  "ShaderProgram" : 0x1,
  "Texture" : 0x2,
  "Blend" : 0x3,
  "Depth" : 0x4
};

/**
 * Create a new instance of class materialAttribute
 *
 * @class
 * @param type
 * @returns {vglModule.materialAttribute}
 */
vglModule.materialAttribute = function(type) {

  if (!(this instanceof vglModule.materialAttribute)) {
    return new vglModule.materialAttribute();
  }
  vglModule.object.call(this);

  /** @private */
  var m_type = type;

  /** @private */
  var m_enabled = true;

  this.type = function() {
    return m_type;
  };

  this.enabled = function() {
    return m_enabled;
  };

  this.setup = function(renderState) {
    return false;
  };

  this.bind = function(renderState) {
    return false;
  };

  this.undoBind = function(renderState) {
    return false;
  };

  this.setupVertexData = function(renderState, key) {
    return false;
  };

  this.bindVertexData = function(renderState, key) {
    return false;
  };

  this.undoBindVertexData = function(renderState, key) {
    return false;
  };

  return this;
};

inherit(vglModule.materialAttribute, vglModule.object);
