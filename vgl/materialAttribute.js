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
// materialAttribute class
//
//////////////////////////////////////////////////////////////////////////////

materialAttributeType =   {
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

  /// Private member variables
  var m_type = type;
  var m_enabled = true;

  /// Public member methods
  this.type = function() {
    return m_type;
  };

  this.enabled = function() {
    return m_enabled;
  };

  this.setup = function(renderState) {
    return false;
  };

  this.bind  = function(renderState) {
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
