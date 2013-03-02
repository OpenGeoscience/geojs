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
// shaderProgram class
//
//////////////////////////////////////////////////////////////////////////////

vglModule.shaderProgram = function() {

  if (!(this instanceof vglModule.shaderProgram)) {
    return new vglModule.shaderProgram();
  }
  vglModule.materialAttribute.call(this, materialAttributeType.ShaderProgram);

  /// Private member variables
  var m_programHandle = 0;
  var m_shaders = [];
  var m_uniforms = [];
  var m_vertexAttributes = {};

  var m_uniformNameToLocation = {};
  var m_vertexAttributeNameToLocation = {};

  /// Public member methods
  this.queryUniformLocation = function(name) {
    return gl.getUniformLocation(m_programHandle, name);
  };

  this.queryAttributeLocation = function(name) {
    return gl.getAttribLocation(m_programHandle, name);
  };

  this.addShader = function(shader) {
    if (m_shaders.indexOf(shader) > -1)   {
      return false;
    }

    for (var i = 0; i < m_shaders.length; ++i) {
      if (m_shaders[i].shaderType() === shader.shaderType()) {
        m_shaders.splice(m_shaders.indexOf(shader), 1);
      }
    }

    m_shaders.push(shader);

    this.modifiedOn();
    return true;
  };

  this.addUniform = function(uniform) {
    if (m_uniforms.indexOf(uniform) > -1) {
      return false;
    }

    m_uniforms.push(uniform);
    this.modifiedOn();
  };

  this.addVertexAttribute = function(attr, key) {
    m_vertexAttributes[key] = attr;

    this.modifiedOn();
  };

  this.uniformLocation = function(name) {
    return m_uniformNameToLocation[name];
  };

  this.attributeLocation = function(name) {
    return m_vertexAttributeNameToLocation[name];
  };

  this.uniformExist = function() {
    // TODO
  };

  this.updateUniforms = function() {
    for (var i = 0; i < m_uniforms.length; ++i) {
      m_uniforms[i].callGL(
        m_uniformNameToLocation[m_uniforms[i].name()]);
    }
  };

  this.link = function() {
    gl.linkProgram(m_programHandle);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(m_programHandle, gl.LINK_STATUS)) {
      console.log("[ERROR] Unable to initialize the shader program.");
      return false;
    }

    return true;
  };

  this.validate = function() {
    // TODO
  };

  this.use = function() {
    gl.useProgram(m_programHandle);
  };

  this.cleanUp = function() {
    this.deleteVertexAndFragment();
    this.deleteProgram();
  };

  this.deleteProgram = function() {
    gl.deleteProgram(m_programHandle);
  };

  this.deleteVertexAndFragment = function() {
    for (var i = 0; i < m_shaders.length; ++i) {
      gl.deleteShader(m_shaders[i].shaderHandle());
    }
  };

  this.bind = function(renderState) {
    var i = 0;

    if (m_programHandle === 0 || this.modified()) {
      m_programHandle = gl.createProgram();

      if (m_programHandle === 0) {
        console.log("[ERROR] Cannot create Program Object");
        return false;
      }

      // Compile shaders
      for (i = 0; i < m_shaders.length; ++i) {
        m_shaders[i].compile();
        m_shaders[i].attachShader(m_programHandle);
      }

      this.bindAttributes();

      // link program
      if (!this.link()) {
        console.log("[ERROR] Failed to link Program");
        this.cleanUp();
      }

      this.use();
      this.bindUniforms();
      this.modifiedOff();
    }
    else {
      this.use();
    }

    // Call update callback.
    for (i = 0; i < m_uniforms.length; ++i) {
      m_uniforms[i].update(renderState, this);
    }

    // Now update values to GL.
    this.updateUniforms();
  };

  this.undoBind = function(renderState) {
    // Do nothing
  };

  this.bindVertexData = function(renderState, key) {
    if (m_vertexAttributes.hasOwnProperty(key)) {
      m_vertexAttributes[key].bindVertexData(renderState, key);
    }
  };

  this.undoBindVertexData = function(renderState, key) {
    if (m_vertexAttributes.hasOwnProperty(key)) {
      m_vertexAttributes[key].undoBindVertexData(renderState, key);
    }
  };

  this.bindUniforms = function() {
    for (var i = 0; i < m_uniforms.length; ++i) {
      m_uniformNameToLocation[m_uniforms[i].name()] =
        this.queryUniformLocation(m_uniforms[i].name());

      console.log(m_uniforms[i].name());
      console.log(this.queryUniformLocation(m_uniforms[i].name()));
    }
  };

  this.bindAttributes = function() {
    var index = 0;
    for (var i in m_vertexAttributes) {
      var name = m_vertexAttributes[i].name();
      gl.bindAttribLocation(m_programHandle, index, name);
      m_vertexAttributeNameToLocation[name] = index++;
    }
  };

  return this;
};

inherit(vglModule.shaderProgram, vglModule.materialAttribute);
