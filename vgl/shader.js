//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global gl, vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class shader
 *
 * @param type
 * @returns {vglModule.shader}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.shader = function(type) {
  'use strict';

  if (!(this instanceof vglModule.shader)) {
    return new vglModule.shader(type);
  }
  vglModule.object.call(this);

  var m_shaderHandle = null,
      m_compileTimestamp = vglModule.timestamp(),
      m_shaderType = type,
      m_shaderSource = "";

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get shader handle
   */
  /////////////////////////////////////////////////////////////////////////////
  this.shaderHandle = function() {
    return m_shaderHandle;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get type of the shader
   *
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.shaderType = function() {
    return m_shaderType;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get shader source
   *
   * @returns {string}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.shaderSource = function() {
    return m_shaderSource;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Set shader source
   *
   * @param {string} source
   */
  /////////////////////////////////////////////////////////////////////////////
  this.setShaderSource = function(source) {
    m_shaderSource = source;
    this.modified();
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Compile the shader
   *
   * @returns {null}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.compile = function() {
    if (this.getMTime() < m_compileTimestamp.getMTime()) {
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

    m_compileTimestamp.modified();

    return m_shaderHandle;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Attach shader to the program
   *
   * @param programHandle
   */
  /////////////////////////////////////////////////////////////////////////////
  this.attachShader = function(programHandle) {
    gl.attachShader(programHandle, m_shaderHandle);
  };
};

inherit(vglModule.shader, vglModule.object);
