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
  var m_compileTimestmap = coreModule.timestamp();
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
    this.modified();
  };

  this.shaderSource = function() {
    return m_shaderSource;
  };

  this.setShaderSource = function(source) {
    m_shaderSource = source;
    this.modified();
  };

  this.compile = function() {
    if (this.getMTime() < m_compileTimestmap.getMTime()) {
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

    m_compileTimestmap.modified();

    return m_shaderHandle;
  };

  this.attachShader = function(programHandle) {
    gl.attachShader(programHandle, m_shaderHandle);
  };
};

inherit(vglModule.shader, vglModule.object);
