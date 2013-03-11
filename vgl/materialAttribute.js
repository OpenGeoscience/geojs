//////////////////////////////////////////////////////////////////////////////
//
// materialAttribute class
//
//////////////////////////////////////////////////////////////////////////////

materialAttributeType = {
  "Undefined" : 0x0,
  "ShaderProgram" : 0x1,
  "Texture" : 0x2,
  "Blend" : 0x3,
  "Depth" : 0x4
};

vglModule.materialAttribute = function(type) {

  if (!(this instanceof vglModule.materialAttribute)) {
    return new vglModule.materialAttribute();
  }
  vglModule.object.call(this);

  // / Private member variables
  var m_type = type;
  var m_enabled = true;

  // / Public member methods
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
