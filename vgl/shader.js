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
// shader class
//
//////////////////////////////////////////////////////////////////////////////
vglModule.shader = function(type) {

  if (!(this instanceof vglModule.shader)) {
    return new vglModule.shader(type);
  }
  vglModule.object.call(this);

  var m_shaderHandle = null;
  var m_shaderType = type;
  var m_shaderSource = "";
  var m_fileName = "";

  this.shaderHandle = function() {
  };

  this.shaderType = function() {
    return m_shaderType;
  };

  this.fileName = function() {
    return m_fileName;
  };

  this.setFileName = function(fileName) {
    m_fileName = fileName;
    this.modifiedOn();
  };

  this.shaderSource = function() {
    return m_shaderSource;
  };

  this.setShaderSource = function(source) {
    m_shaderSource = source;
    this.modifiedOn();
  };

  this.compile = function() {
    if (this.modified() === false) {
      return m_shaderHandle;
    }

    gl.deleteShader(m_shaderHandle);
    m_shaderHandle = gl.createShader(m_shaderType);
    gl.shaderSource(m_shaderHandle, m_shaderSource);
    gl.compileShader(m_shaderHandle);

    // See if it compiled successfully
    if (!gl.getShaderParameter(m_shaderHandle, gl.COMPILE_STATUS)) {
      console.log("[ERROR] An error occurred compiling the shaders: "
                  + gl.getShaderInfoLog(m_shaderHandle));
      console.log(m_shaderSource);
      gl.deleteShader(m_shaderHandle);
      return null;
    }

    this.modifiedOff();

    return m_shaderHandle;
  };

  this.attachShader = function(programHandle) {
    gl.attachShader(programHandle, m_shaderHandle);
  };
};

inherit(vglModule.shader, vglModule.object);
