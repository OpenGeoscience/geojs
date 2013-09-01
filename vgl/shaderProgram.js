//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instace of class shaderProgram
 *
 * @class
 * @returns {vglModule.shaderProgram}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.shaderProgram = function() {

  if (!(this instanceof vglModule.shaderProgram)) {
    return new vglModule.shaderProgram();
  }
  vglModule.materialAttribute.call(this, materialAttributeType.ShaderProgram);

  /** @private */
  var m_programHandle = 0,
      m_compileTimestamp = vglModule.timestamp(),
      m_shaders = [],
      m_uniforms = [],
      m_vertexAttributes = {},
      m_uniformNameToLocation = {},
      m_vertexAttributeNameToLocation = {};

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Query uniform location in the program
   *
   * @param name
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.queryUniformLocation = function(name) {
    return gl.getUniformLocation(m_programHandle, name);
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Query attribute location in the program
   *
   * @param name
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.queryAttributeLocation = function(name) {
    return gl.getAttribLocation(m_programHandle, name);
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Add a new shader to the program
   *
   * @param shader
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.addShader = function(shader) {
    if (m_shaders.indexOf(shader) > -1) {
      return false;
    }

    for ( var i = 0; i < m_shaders.length; ++i) {
      if (m_shaders[i].shaderType() === shader.shaderType()) {
        m_shaders.splice(m_shaders.indexOf(shader), 1);
      }
    }

    m_shaders.push(shader);

    this.modified();
    return true;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Add a new uniform to the program
   *
   * @param uniform
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.addUniform = function(uniform) {
    if (m_uniforms.indexOf(uniform) > -1) {
      return false;
    }

    m_uniforms.push(uniform);
    this.modified();
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Add a new vertex attribute to the program
   *
   * @param attr
   * @param key
   */
  /////////////////////////////////////////////////////////////////////////////
  this.addVertexAttribute = function(attr, key) {
    m_vertexAttributes[key] = attr;

    this.modified();
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get uniform location
   *
   * This method does not perform any query into the program but relies on
   * the fact that it depends on a call to queryUniformLocation earlier.
   *
   * @param name
   * @returns {number}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.uniformLocation = function(name) {
    return m_uniformNameToLocation[name];
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get attribute location
   *
   * This method does not perform any query into the program but relies on the
   * fact that it depends on a call to queryUniformLocation earlier.
   *
   * @param name
   * @returns {number}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.attributeLocation = function(name) {
    return m_vertexAttributeNameToLocation[name];
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Get uniform object using name as the key
   *
   * @param name
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.uniform = function(name) {
    for ( var i = 0; i < m_uniforms.length; ++i) {
      if (m_uniforms[i].name() === name) {
        return m_uniforms[i];
      }
    }

    return null;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Update all uniforms
   *
   * This method should be used directly unless required
   */
  /////////////////////////////////////////////////////////////////////////////
  this.updateUniforms = function() {
    for ( var i = 0; i < m_uniforms.length; ++i) {
      m_uniforms[i].callGL(m_uniformNameToLocation[m_uniforms[i].name()]);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Link shader program
   *
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.link = function() {
    gl.linkProgram(m_programHandle);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(m_programHandle, gl.LINK_STATUS)) {
      console.log("[ERROR] Unable to initialize the shader program.");
      return false;
    }

    return true;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Use the shader program
   */
  /////////////////////////////////////////////////////////////////////////////
  this.use = function() {
    gl.useProgram(m_programHandle);
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Peform any clean up required when the program gets deleted
   */
  /////////////////////////////////////////////////////////////////////////////
  this.cleanUp = function() {
    this.deleteVertexAndFragment();
    this.deleteProgram();
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Delete the shader program
   */
  /////////////////////////////////////////////////////////////////////////////
  this.deleteProgram = function() {
    gl.deleteProgram(m_programHandle);
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Delete vertex and fragment shaders
   */
  /////////////////////////////////////////////////////////////////////////////
  this.deleteVertexAndFragment = function() {
    for ( var i = 0; i < m_shaders.length; ++i) {
      gl.deleteShader(m_shaders[i].shaderHandle());
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Bind the program with its shaders
   *
   * @param renderState
   * @returns {boolean}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.bind = function(renderState) {
    var i = 0;

    if (m_programHandle === 0
        || (m_compileTimestamp.getMTime() < this.getMTime())) {
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
      m_compileTimestamp.modified();
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

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Undo binding of the shader program
   *
   * @param renderState
   */
  /////////////////////////////////////////////////////////////////////////////
  this.undoBind = function(renderState) {
    // Do nothing
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Bind vertex data
   *
   * @param renderState
   * @param key
   */
  /////////////////////////////////////////////////////////////////////////////
  this.bindVertexData = function(renderState, key) {
    if (m_vertexAttributes.hasOwnProperty(key)) {
      m_vertexAttributes[key].bindVertexData(renderState, key);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Undo bind vetex data
   *
   * @param renderState
   * @param key
   */
  /////////////////////////////////////////////////////////////////////////////
  this.undoBindVertexData = function(renderState, key) {
    if (m_vertexAttributes.hasOwnProperty(key)) {
      m_vertexAttributes[key].undoBindVertexData(renderState, key);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Bind uniforms
   */
  /////////////////////////////////////////////////////////////////////////////
  this.bindUniforms = function() {
    for ( var i = 0; i < m_uniforms.length; ++i) {
      m_uniformNameToLocation[m_uniforms[i].name()] = this
          .queryUniformLocation(m_uniforms[i].name());
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   * Bind vertex attributes
   */
  /////////////////////////////////////////////////////////////////////////////
  this.bindAttributes = function() {
    for (var key in m_vertexAttributes) {
      var name = m_vertexAttributes[key].name();
      gl.bindAttribLocation(m_programHandle, key, name);
      m_vertexAttributeNameToLocation[name] = key;
    }
  };

  return this;
};

inherit(vglModule.shaderProgram, vglModule.materialAttribute);
