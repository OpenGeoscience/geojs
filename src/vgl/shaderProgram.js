var vgl = require('./vgl');
var inherit = require('../inherit');
var timestamp = require('../timestamp');

/**
 * Create a new instance of class shaderProgram.
 *
 * @class
 * @alias vgl.shaderProgram
 * @returns {vgl.shaderProgram}
 */
vgl.shaderProgram = function () {
  'use strict';

  if (!(this instanceof vgl.shaderProgram)) {
    return new vgl.shaderProgram();
  }
  vgl.materialAttribute.call(
    this, vgl.materialAttributeType.ShaderProgram);

  var m_this = this,
      m_programHandle = 0,
      m_compileTimestamp = timestamp(),
      m_bindTimestamp = timestamp(),
      m_shaders = [],
      m_uniforms = [],
      m_vertexAttributes = {},
      m_uniformNameToLocation = {},
      m_vertexAttributeNameToLocation = {};

  /**
   * Query uniform location in the program.
   *
   * @param {vgl.renderState} renderState
   * @param {string} name
   * @returns {number}
   */
  this.queryUniformLocation = function (renderState, name) {
    return renderState.m_context.getUniformLocation(m_programHandle, name);
  };

  /**
   * Query attribute location in the program.
   *
   * @param {vgl.renderState} renderState
   * @param {string} name
   * @returns {number}
   */
  this.queryAttributeLocation = function (renderState, name) {
    return renderState.m_context.getAttribLocation(m_programHandle, name);
  };

  /**
   * Add a new shader to the program.
   *
   * @param {string} shader
   * @returns {boolean}
   */
  this.addShader = function (shader) {
    if (m_shaders.indexOf(shader) > -1) {
      return false;
    }

    var i;
    for (i = m_shaders.length - 2; i >= 0; i -= 1) {
      if (m_shaders[i].shaderType() === shader.shaderType()) {
        m_shaders.splice(i, 1);
      }
    }

    m_shaders.push(shader);
    m_this.modified();
    return true;
  };

  /**
   * Add a new uniform to the program.
   *
   * @param {vgl.uniform} uniform
   * @returns {boolean}
   */
  this.addUniform = function (uniform) {
    if (m_uniforms.indexOf(uniform) > -1) {
      return false;
    }

    m_uniforms.push(uniform);
    m_this.modified();
    return true;
  };

  /**
   * Add a new vertex attribute to the program.
   *
   * @param {vgl.vertexAttribute} attr
   * @param {string} key
   */
  this.addVertexAttribute = function (attr, key) {
    m_vertexAttributes[key] = attr;
    m_this.modified();
  };

  /**
   * Get uniform location.
   *
   * This method does not perform any query into the program but relies on
   * the fact that it depends on a call to queryUniformLocation earlier.
   *
   * @param {string} name
   * @returns {number}
   */
  this.uniformLocation = function (name) {
    return m_uniformNameToLocation[name];
  };

  /**
   * Get attribute location.
   *
   * This method does not perform any query into the program but relies on the
   * fact that it depends on a call to queryUniformLocation earlier.
   *
   * @param {string} name
   * @returns {number}
   */
  this.attributeLocation = function (name) {
    return m_vertexAttributeNameToLocation[name];
  };

  /**
   * Get uniform object using name as the key.
   *
   * @param {string} name
   * @returns {vgl.uniform}
   */
  this.uniform = function (name) {
    var i;
    for (i = 0; i < m_uniforms.length; i += 1) {
      if (m_uniforms[i].name() === name) {
        return m_uniforms[i];
      }
    }

    return null;
  };

  /**
   * Update all uniforms.
   *
   * This method should not be used directly unless required.
   *
   * @param {vgl.renderState} renderState
   */
  this.updateUniforms = function (renderState) {
    var i;

    for (i = 0; i < m_uniforms.length; i += 1) {
      m_uniforms[i].callGL(renderState,
                           m_uniformNameToLocation[m_uniforms[i].name()]);
    }
  };

  /**
   * Link shader program.
   *
   * @param {vgl.renderState} renderState
   * @returns {boolean}
   */
  this.link = function (renderState) {
    renderState.m_context.linkProgram(m_programHandle);

    // If creating the shader program failed, alert
    if (!renderState.m_context.getProgramParameter(m_programHandle,
                                                   vgl.GL.LINK_STATUS)) {
      console.log('[ERROR] Unable to initialize the shader program.');  // eslint-disable-line no-console
      return false;
    }

    return true;
  };

  /**
   * Use the shader program.
   *
   * @param {vgl.renderState} renderState
   */
  this.use = function (renderState) {
    renderState.m_context.useProgram(m_programHandle);
  };

  /**
   * Perform any initialization required.
   *
   * @param {vgl.renderState} renderState
   */
  this._setup = function (renderState) {
    if (m_programHandle === 0) {
      m_programHandle = renderState.m_context.createProgram();
    }
  };

  /**
   * Perform any clean up required when the program gets deleted.
   *
   * @param {vgl.renderState} renderState
   */
  this._cleanup = function (renderState) {
    m_this.deleteVertexAndFragment(renderState);
    m_this.deleteProgram(renderState);
    m_this.modified();
  };

  /**
   * Delete the shader program.
   *
   * @param {vgl.renderState} renderState
   */
  this.deleteProgram = function (renderState) {
    if (m_programHandle) {
      renderState.m_context.deleteProgram(m_programHandle);
    }
    m_programHandle = 0;
  };

  /**
   * Delete vertex and fragment shaders.
   *
   * @param {vgl.renderState} renderState
   */
  this.deleteVertexAndFragment = function (renderState) {
    var i;
    for (i = 0; i < m_shaders.length; i += 1) {
      if (m_shaders[i].shaderHandle(renderState)) {
        renderState.m_context.detachShader(m_programHandle, m_shaders[i].shaderHandle(renderState));
      }
      renderState.m_context.deleteShader(m_shaders[i].shaderHandle(renderState));
      m_shaders[i].removeContext(renderState);
    }
  };

  /**
   * Compile and link a shader.
   *
   * @param {vgl.renderState} renderState
   */
  this.compileAndLink = function (renderState) {
    var i;

    if (m_compileTimestamp.getMTime() >= this.getMTime()) {
      return;
    }

    m_this._setup(renderState);

    // Compile shaders
    for (i = 0; i < m_shaders.length; i += 1) {
      m_shaders[i].compile(renderState);
      m_shaders[i].attachShader(renderState, m_programHandle);
    }

    m_this.bindAttributes(renderState);

    // link program
    if (!m_this.link(renderState)) {
      console.log('[ERROR] Failed to link Program');  // eslint-disable-line no-console
      m_this._cleanup(renderState);
    }

    m_compileTimestamp.modified();
  };

  /**
   * Bind the program with its shaders.
   *
   * @param {vgl.renderState} renderState
   */
  this.bind = function (renderState) {
    var i = 0;

    if (m_bindTimestamp.getMTime() < m_this.getMTime()) {

      // Compile shaders
      m_this.compileAndLink(renderState);

      m_this.use(renderState);
      m_this.bindUniforms(renderState);
      m_bindTimestamp.modified();
    } else {
      m_this.use(renderState);
    }

    // Call update callback.
    for (i = 0; i < m_uniforms.length; i += 1) {
      m_uniforms[i].update(renderState, m_this);
    }

    // Now update values to GL.
    m_this.updateUniforms(renderState);
  };

  /**
   * Undo binding of the shader program.
   *
   * @param {vgl.renderState} renderState
   */
  this.undoBind = function (renderState) {
    // REF https://www.khronos.org/opengles/sdk/docs/man/xhtml/glUseProgram.xml
    // If program is 0, then the current rendering state refers to an invalid
    // program object, and the results of vertex and fragment shader execution
    // due to any glDrawArrays or glDrawElements commands are undefined
    renderState.m_context.useProgram(null);
  };

  /**
   * Bind vertex data.
   *
   * @param {vgl.renderState} renderState
   * @param {string} key
   */
  this.bindVertexData = function (renderState, key) {
    if (m_vertexAttributes.hasOwnProperty(key)) {
      m_vertexAttributes[key].bindVertexData(renderState, key);
    }
  };

  /**
   * Undo bind vertex data.
   *
   * @param {vgl.renderState} renderState
   * @param {string} key
   */
  this.undoBindVertexData = function (renderState, key) {
    if (m_vertexAttributes.hasOwnProperty(key)) {
      m_vertexAttributes[key].undoBindVertexData(renderState, key);
    }
  };

  /**
   * Bind uniforms.
   *
   * @param {vgl.renderState} renderState
   */
  this.bindUniforms = function (renderState) {
    var i;
    for (i = 0; i < m_uniforms.length; i += 1) {
      m_uniformNameToLocation[m_uniforms[i].name()] = this
          .queryUniformLocation(renderState, m_uniforms[i].name());
    }
  };

  /**
   * Bind vertex attributes.
   *
   * @param {vgl.renderState} renderState
   */
  this.bindAttributes = function (renderState) {
    var key, name;
    for (key in m_vertexAttributes) {
      if (m_vertexAttributes.hasOwnProperty(key)) {
        name = m_vertexAttributes[key].name();
        renderState.m_context.bindAttribLocation(m_programHandle, key, name);
        m_vertexAttributeNameToLocation[name] = key;
      }
    }
  };

  return m_this;
};

inherit(vgl.shaderProgram, vgl.materialAttribute);
