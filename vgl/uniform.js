//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $*/
//////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
/**
 *
 * @param type
 * @param name
 * @returns {*}
 */
///////////////////////////////////////////////////////////////////////////////
vglModule.uniform = function(type, name) {

  if (!(this instanceof vglModule.uniform)) {
    return new vglModule.uniform();
  }

  this.getTypeNumberOfComponents = function(type) {
    switch (type) {
      case gl.FLOAT:
      case gl.INT:
      case gl.BOOL:
        return 1;

      case gl.FLOAT_VEC2:
      case gl.INT_VEC2:
      case gl.BOOL_VEC2:
        return 2;

      case gl.FLOAT_VEC2:
      case gl.INT_VEC2:
      case gl.FLOAT_VEC3:
        return 3;

      case gl.FLOAT_VEC4:
      case gl.INT_VEC4:
      case gl.BOOL_VEC4:
        return 4;

      case gl.FLOAT_MAT3:
        return 9;

      case gl.FLOAT_MAT4:
        return 16;

      default:
        return 0;
    }
  };

  var m_type = type;
  var m_name = name;
  var m_dataArray = [ this.getTypeNumberOfComponents(m_type) ];
  var m_numberOfElements = 1;

  /////////////////////////////////////////////////////////////////////////////
  /**
   *
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.name = function() {
    return m_name;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   *
   * @returns {*}
   */
  /////////////////////////////////////////////////////////////////////////////
  this.type = function() {
    return m_type;
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   *
   */
  /////////////////////////////////////////////////////////////////////////////
  this.get = function() {
    // TODO
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   *
   * @param value
   */
  /////////////////////////////////////////////////////////////////////////////
  this.set = function(value) {
    var i = 0;
    if (value instanceof mat4.constructor) {
      for (i = 0; i < 16; ++i) {
        m_dataArray[i] = value[i];
      }
    }
    else if (value instanceof mat3.constructor) {
      for (i = 0; i < 9; ++i) {
        m_dataArray[i] = value[i];
      }
    }
    else if (value instanceof vec4.constructor) {
      for (i = 0; i < 4; ++i) {
        m_dataArray[i] = value[i];
      }
    }
    else if (value instanceof vec3.constructor) {
      for (i = 0; i < 3; ++i) {
        m_dataArray[i] = value[i];
      }
    }
    else if (value instanceof vec2.constructor) {
      for (i = 0; i < 2; ++i) {
        m_dataArray[i] = value[i];
      }
    }
    else {
      m_dataArray[0] = value;
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   *
   * @param location
   */
  /////////////////////////////////////////////////////////////////////////////
  this.callGL = function(location) {
    if (this.m_numberElements < 1) {
      return;
    }

    switch (m_type) {
      case gl.BOOL:
      case gl.INT:
        gl.uniform1iv(location, m_dataArray);
        break;
      case gl.FLOAT:
        gl.uniform1fv(location, m_dataArray);
        break;
      case gl.FLOAT_VEC2:
        gl.uniform2fv(location, m_dataArray);
        break;
      case gl.FLOAT_VEC3:
        gl.uniform3fv(location, m_dataArray);
        break;
      case gl.FLOAT_VEC4:
        gl.uniform4fv(location, m_dataArray);
        break;
      case gl.FLOAT_MAT3:
        gl.uniformMatrix3fv(location, gl.FALSE, m_dataArray);
        break;
      case gl.FLOAT_MAT4:
        gl.uniformMatrix4fv(location, gl.FALSE, m_dataArray);
        break;
      default:
        break;
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  /**
   *
   * @param renderState
   * @param program
   */
  /////////////////////////////////////////////////////////////////////////////
  this.update = function(renderState, program) {
    // Should be implemented by the derived class
  };

  return this;
};

///////////////////////////////////////////////////////////////////////////////
/**
 *
 * @param name
 * @returns {*}
 */
///////////////////////////////////////////////////////////////////////////////
vglModule.modelViewUniform = function(name) {

  if (!(this instanceof vglModule.modelViewUniform)) {
    return new vglModule.modelViewUniform(name);
  }

  if (name.length === 0) {
    name = "modelViewMatrix";
  }

  vglModule.uniform.call(this, gl.FLOAT_MAT4, name);

  this.set(mat4.create());

  /////////////////////////////////////////////////////////////////////////////
  /**
   *
   * @param renderState
   * @param program
   */
  /////////////////////////////////////////////////////////////////////////////
  this.update = function(renderState, program) {
    this.set(renderState.m_modelViewMatrix);
  };

  return this;
};

inherit(vglModule.modelViewUniform, vglModule.uniform);

//////////////////////////////////////////////////////////////////////////////
/**
 *
 * @param name
 * @returns {*}
 */
///////////////////////////////////////////////////////////////////////////////
vglModule.projectionUniform = function(name) {

  if (!(this instanceof vglModule.projectionUniform)) {
    return new vglModule.projectionUniform(name);
  }

  if (name.length === 0) {
    name = "projectionMatrix";
  }

  vglModule.uniform.call(this, gl.FLOAT_MAT4, name);

  this.set(mat4.create());

  /////////////////////////////////////////////////////////////////////////////
  /**
   *
   * @param renderState
   * @param program
   */
  /////////////////////////////////////////////////////////////////////////////
  this.update = function(renderState, program) {
    this.set(renderState.m_projectionMatrix);
  };

  return this;
};

inherit(vglModule.projectionUniform, vglModule.uniform);

///////////////////////////////////////////////////////////////////////////////
/**
 *
 * @param name
 * @param value
 * @returns {vglModule.floatUniform}
 */
///////////////////////////////////////////////////////////////////////////////
vglModule.floatUniform = function(name, value) {

  if (!(this instanceof vglModule.floatUniform)) {
    return new vglModule.floatUniform(name, value);
  }

  if (name.length === 0) {
    name = "floatUniform";
  }

  if (!value) {
    value = 1.0;
  }

  vglModule.uniform.call(this, gl.FLOAT, name);

  this.set(value);
};

inherit(vglModule.floatUniform, vglModule.uniform);
