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

vglModule.material = function() {

  this.RenderBin = {
    "Default"     : 0,
    "Opaque"      : 1,
    "Transparent" : 10,
    "Overlay"     : 20
  };

  if (!(this instanceof vglModule.material)) {
    return new vglModule.material();
  }
  vglModule.object.call(this);

  /// Private member variables
  var m_shaderProgram = new vglModule.shaderProgram();
  var m_binNumber = 0;
  var m_textureAttributes = {};
  var m_attributes = {};

  /// Public member methods
  this.binNumber = function() {
    return m_binNumber;
  };

  this.setBinNumber = function(binNo) {
    m_binNumber = binNo;
    this.modifiedOn();
  };


  this.exists = function(attr) {
    if (attr.type() === vglModule.materialAttribute.Texture) {
      return m_textureAttributes.hasOwnProperty(attr);
    } else {
      return m_attributes.hasOwnProperty(attr);
    }
  };


  this.addAttribute = function(attr) {

    if (this.exists(attr)) {
      return false;
    }

    if (attr.type() === materialAttributeType.Texture) {
      m_textureAttributes[attr.textureUnit()] = attr;
      this.modifiedOn();
      return true;
    } else {
      // Shader is a very special attribute
      if (attr.type() === materialAttributeType.ShaderProgram) {
        m_shaderProgram = attr;
      }

      m_attributes[attr.type()] = attr;
      return true;
    }

    return false;
  };


  this.shaderProgram = function() {
    return m_shaderProgram;
  };


  this.render = function(renderState) {
    this.bind(renderState);
  };


  this.remove = function(renderState) {
    this.undoBind(renderState);
  };


  this.bind = function(renderState) {

    for (var key in m_attributes) {
      if (m_attributes.hasOwnProperty(key)) {
        m_attributes[key].bind(renderState);
      }
    }

    for (var key in m_textureAttributes) {
      if (m_textureAttributes.hasOwnProperty(key)) {
        m_textureAttributes[key].bind(renderState);
      }
    }
  };

  this.undoBind = function(renderState) {
    var key = null;
    for (key in m_attributes) {
      if (m_attributes.hasOwnProperty(key)) {
        m_attributes[key].undoBind(renderState);
      }
    }

    for (key in m_textureAttributes) {
      if (m_textureAttributes.hasOwnProperty(key)) {
        m_textureAttributes[key].undoBind(renderState);
      }
    }
  };


  this.bindVertexData = function(renderState, key) {

    for (var i in m_attributes) {
      if (m_attributes.hasOwnProperty(i)) {
        m_attributes[i].bindVertexData(renderState, key);
      }
    }
  };

  this.undoBindVertexData = function(renderState, key) {
    for (var i in m_attributes) {
      if (m_attributes.hasOwnProperty(i)) {
        m_attributes.undoBindVertexData(renderState, key);
      }
    }
  };

  return this;
};

inherit(vglModule.material, vglModule.object);
