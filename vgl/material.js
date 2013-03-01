/*========================================================================
  VGL --- VTK WebGL Rendering Toolkit

  Copyright 2013 Kitware, Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 ========================================================================*/

//////////////////////////////////////////////////////////////////////////////
//
// material class
//
//////////////////////////////////////////////////////////////////////////////

///---------------------------------------------------------------------------
vglModule.material = function() {
  this.RenderBin = {
    "Default"     : 0,
    "Opaque"      : 1,
    "Transparent" : 10,
    "Overlay"     : 20
  };

  vglModule.object.call(this);
  this.m_shaderProgram = new vglModule.shaderProgram();
  this.m_binNumber = 0;
  this.m_textureAttributes = {};
  this.m_attributes = {};
};

inherit(vglModule.material, vglModule.object);

///---------------------------------------------------------------------------
vglModule.material.prototype.binNumber = function() {
  return this.m_binNumber;
};
///---------------------------------------------------------------------------
vglModule.material.prototype.setBinNumber = function(binNo) {
  this.m_binNumber = binNo;
  this.setModified();
};

///---------------------------------------------------------------------------
vglModule.material.prototype.exists = function(attr) {
  if (attr.type() === vglModule.materialAttribute.Texture) {
    return this.m_textureAttributes.hasOwnProperty(attr);
  } else {
    return this.m_attributes.hasOwnProperty(attr);
  }
};

///---------------------------------------------------------------------------
vglModule.material.prototype.addAttribute = function(attr) {

  if (this.exists(attr)) {
    return false;
  }

  if (attr.type() === materialAttributeType.Texture) {
    this.m_textureAttributes[attr.textureUnit()] = attr;
    this.setModified(true);
    return true;
  } else {
    // Shader is a very special attribute
    if (attr.type() === materialAttributeType.ShaderProgram) {
      this.m_shaderProgram = attr;
    }

    this.m_attributes[attr.type()] = attr;
    return true;
  }

  return false;
};

///---------------------------------------------------------------------------
vglModule.material.prototype.shaderProgram = function() {
  return this.m_shaderProgram;
};

///---------------------------------------------------------------------------
vglModule.material.prototype.render = function(renderState) {
  this.bind(renderState);
};

///---------------------------------------------------------------------------
vglModule.material.prototype.remove = function(renderState) {
  this.undoBind(renderState);
};

///---------------------------------------------------------------------------
vglModule.material.prototype.bind = function(renderState) {

  for (var key in this.m_attributes) {
    if (this.m_attributes.hasOwnProperty(key)) {
      this.m_attributes[key].bind(renderState);
    }
  }

  for (var key in this.m_textureAttributes) {
    if (this.m_textureAttributes.hasOwnProperty(key)) {
      this.m_textureAttributes[key].bind(renderState);
    }
  }
};
///---------------------------------------------------------------------------
vglModule.material.prototype.undoBind = function(renderState) {
  var key = null;
  for (key in this.m_attributes) {
    if (this.m_attributes.hasOwnProperty(key)) {
      this.m_attributes[key].undoBind(renderState);
    }
  }

  for (key in this.m_textureAttributes) {
    if (this.m_textureAttributes.hasOwnProperty(key)) {
      this.m_textureAttributes[key].undoBind(renderState);
    }
  }
};

///---------------------------------------------------------------------------
vglModule.material.prototype.bindVertexData = function(renderState, key) {

  for (var i in this.m_attributes) {
    if (this.m_attributes.hasOwnProperty(i)) {
      this.m_attributes[i].bindVertexData(renderState, key);
    }
  }
};
///---------------------------------------------------------------------------
vglModule.material.prototype.undoBindVertexData = function(renderState, key) {
  for (var i in this.m_attributes) {
    if (this.m_attributes.hasOwnProperty(i)) {
      this.m_attributes.undoBindVertexData(renderState, key);
    }
  }
};
