/**
 * @module ogs.vgl
 */

/**
 * Create a new instace of class shaderProgram
 *
 * @class
 * @returns {vglModule.shaderProgram}
 */
vglModule.shaderProgram = function() {

  if (!(this instanceof vglModule.shaderProgram)) {
    return new vglModule.shaderProgram();
  }
  vglModule.materialAttribute.call(this, materialAttributeType.ShaderProgram);

  /** @private */
  var m_programHandle = 0;

  /** @private */
  var m_compileTimestamp = vglModule.timestamp();

  /** @private */
  var m_shaders = [];

  /** @private */
  var m_uniforms = [];

  /** @private */
  var m_vertexAttributes = {};

  /** @private */
  var m_uniformNameToLocation = {};

  /** @private */
  var m_vertexAttributeNameToLocation = {};

  this.queryUniformLocation = function(name) {
    return gl.getUniformLocation(m_programHandle, name);
  };

  this.queryAttributeLocation = function(name) {
    return gl.getAttribLocation(m_programHandle, name);
  };

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

  this.addUniform = function(uniform) {
    if (m_uniforms.indexOf(uniform) > -1) {
      return false;
    }

    m_uniforms.push(uniform);
    this.modified();
  };

  this.addVertexAttribute = function(attr, key) {
    m_vertexAttributes[key] = attr;

    this.modified();
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

  this.uniform = function(name) {
    for ( var i = 0; i < m_uniforms.length; ++i) {
      if (m_uniforms[i].name() === name) {
        return m_uniforms[i];
      }
    }

    return null;
  };

  this.updateUniforms = function() {
    for ( var i = 0; i < m_uniforms.length; ++i) {
      m_uniforms[i].callGL(m_uniformNameToLocation[m_uniforms[i].name()]);
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
    for ( var i = 0; i < m_shaders.length; ++i) {
      gl.deleteShader(m_shaders[i].shaderHandle());
    }
  };

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
    for ( var i = 0; i < m_uniforms.length; ++i) {
      m_uniformNameToLocation[m_uniforms[i].name()] = this
          .queryUniformLocation(m_uniforms[i].name());
    }
  };

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
