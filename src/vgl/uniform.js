var vgl = require('./vgl');
var inherit = require('../inherit');
var mat4 = require('gl-mat4');

/**
 * Create a new instance of class uniform.
 *
 * @class
 * @alias vgl.uniform
 * @param {number} type The GL type, such as FLOAT or INT.
 * @param {string} name The name of the uniform.
 * @returns {vgl.uniform} OpenGL uniform encapsulation
 */
vgl.uniform = function (type, name) {
  'use strict';

  if (!(this instanceof vgl.uniform)) {
    return new vgl.uniform(type, name);
  }

  this.getTypeNumberOfComponents = function (type) {
    switch (type) {
      case vgl.GL.FLOAT:
      case vgl.GL.INT:
      case vgl.GL.BOOL:
        return 1;

      case vgl.GL.FLOAT_VEC2:
      case vgl.GL.INT_VEC2:
      case vgl.GL.BOOL_VEC2:
        return 2;

      case vgl.GL.FLOAT_VEC3:
      case vgl.GL.INT_VEC3:
      case vgl.GL.BOOL_VEC3:
        return 3;

      case vgl.GL.FLOAT_VEC4:
      case vgl.GL.INT_VEC4:
      case vgl.GL.BOOL_VEC4:
        return 4;

      case vgl.GL.FLOAT_MAT3:
        return 9;

      case vgl.GL.FLOAT_MAT4:
        return 16;

      default:
        return 0;
    }
  };

  var m_type = type,
      m_name = name,
      m_dataArray = new Array(this.getTypeNumberOfComponents(m_type)).fill(0);

  /**
   * Get name of the uniform.
   *
   * @returns {string}
   */
  this.name = function () {
    return m_name;
  };

  /**
   * Set value of the uniform.
   *
   * @param {Array|number} value
   */
  this.set = function (value) {
    var i = 0, lendata = m_dataArray.length;
    if (lendata !== 1) {
      for (i = 0; i < lendata; i += 1) {
        m_dataArray[i] = value[i];
      }
    } else {
      m_dataArray[0] = value;
    }
  };

  /**
   * Call GL and pass updated values to the current shader.
   *
   * @param {vgl.renderState} renderState The current render state with the
   *    current context.
   * @param {number} location The context location.
   */
  this.callGL = function (renderState, location) {
    switch (m_type) {
      case vgl.GL.BOOL:
      case vgl.GL.INT:
        renderState.m_context.uniform1iv(location, m_dataArray);
        break;
      case vgl.GL.FLOAT:
        renderState.m_context.uniform1fv(location, m_dataArray);
        break;
      case vgl.GL.BOOL_VEC2:
      case vgl.GL.INT_VEC2:
        renderState.m_context.uniform2iv(location, m_dataArray);
        break;
      case vgl.GL.FLOAT_VEC2:
        renderState.m_context.uniform2fv(location, m_dataArray);
        break;
      case vgl.GL.BOOL_VEC3:
      case vgl.GL.INT_VEC3:
        renderState.m_context.uniform3iv(location, m_dataArray);
        break;
      case vgl.GL.FLOAT_VEC3:
        renderState.m_context.uniform3fv(location, m_dataArray);
        break;
      case vgl.GL.BOOL_VEC4:
      case vgl.GL.INT_VEC4:
        renderState.m_context.uniform4iv(location, m_dataArray);
        break;
      case vgl.GL.FLOAT_VEC4:
        renderState.m_context.uniform4fv(location, m_dataArray);
        break;
      case vgl.GL.FLOAT_MAT3:
        renderState.m_context.uniformMatrix3fv(location, vgl.GL.FALSE, m_dataArray);
        break;
      case vgl.GL.FLOAT_MAT4:
        renderState.m_context.uniformMatrix4fv(location, vgl.GL.FALSE, m_dataArray);
        break;
      default:
        break;
    }
  };

  /**
   * Virtual method to update the uniform.
   *
   * Should be implemented by the derived class.
   *
   * @param {vgl.renderState} renderState
   * @param {vgl.shaderProgram} program
   */
  this.update = function (renderState, program) {
    // Should be implemented by the derived class
  };

  return this;
};

/**
 * Create new instance of class modelViewOriginUniform.
 *
 * @class
 * @alias vgl.modelViewUniform
 * @param {string} name
 * @param {number[]} origin a triplet of floats.
 * @returns {vgl.modelViewUniform}
 */
vgl.modelViewOriginUniform = function (name, origin) {
  'use strict';

  if (!(this instanceof vgl.modelViewOriginUniform)) {
    return new vgl.modelViewOriginUniform(name, origin);
  }

  if (!name) {
    name = 'modelViewMatrix';
  }
  origin = origin || [0, 0, 0];

  var m_origin = [origin[0], origin[1], origin[2] || 0];

  vgl.uniform.call(this, vgl.GL.FLOAT_MAT4, name);

  this.set(mat4.create());

  /**
   * Change the origin used by the uniform view matrix.
   *
   * @param {number[]} origin a triplet of floats.
   */
  this.setOrigin = function (origin) {
    origin = origin || [0, 0, 0];
    m_origin = [origin[0], origin[1], origin[2] || 0];
  };

  /**
   * Update the uniform given a render state and shader program.  This offsets
   * the modelViewMatrix by the origin, and, if the model view should be
   * aligned, aligns it appropriately.  The alignment must be done after the
   * origin offset to maintain precision.
   *
   * @param {vgl.renderState} renderState
   * @param {vgl.shaderProgram} program
   */
  this.update = function (renderState, program) {
    var view = renderState.m_modelViewMatrix;
    if (renderState.m_modelViewAlignment) {
      /* adjust alignment before origin.  Otherwise, a changing origin can
       * affect the rounding choice and result in a 1 pixe jitter. */
      var align = renderState.m_modelViewAlignment;
      /* Don't modify the original matrix.  If we are in an environment where
       * you can't slice an Float32Array, switch to a regular array */
      view = view.slice ? view.slice() : Array.prototype.slice.call(view);
      /* view[12] and view[13] are the x and y offsets.  align.round is the
       * units-per-pixel, and align.dx and .dy are either 0 or half the size of
       * a unit-per-pixel.  The alignment guarantees that the texels are
       * aligned with screen pixels. */
      view[12] = Math.round(view[12] / align.roundx) * align.roundx + align.dx;
      view[13] = Math.round(view[13] / align.roundy) * align.roundy + align.dy;
    }
    view = mat4.translate(mat4.create(), view, m_origin);
    this.set(view);
  };

  return this;
};

inherit(vgl.modelViewOriginUniform, vgl.uniform);

/**
 * Create a new instance of class projectionUniform.
 *
 * @class
 * @alias vgl.projectionUniform
 * @param {string} name
 * @returns {vgl.projectionUniform}
 */
vgl.projectionUniform = function (name) {
  'use strict';

  if (!(this instanceof vgl.projectionUniform)) {
    return new vgl.projectionUniform(name);
  }

  if (!name) {
    name = 'projectionMatrix';
  }

  vgl.uniform.call(this, vgl.GL.FLOAT_MAT4, name);

  this.set(mat4.create());

  /**
   * Update the uniform given a render state and shader program.
   *
   * @param {vgl.renderState} renderState
   * @param {vgl.shaderProgram} program
   */
  this.update = function (renderState, program) {
    this.set(renderState.m_projectionMatrix);
  };

  return this;
};

inherit(vgl.projectionUniform, vgl.uniform);

/**
 * Create a new instance of class floatUniform.
 *
 * @class
 * @alias vgl.floatUniform
 * @param {string} name
 * @param {number} value
 * @returns {vgl.floatUniform}
 */
vgl.floatUniform = function (name, value) {
  'use strict';

  if (!(this instanceof vgl.floatUniform)) {
    return new vgl.floatUniform(name, value);
  }

  if (!name) {
    name = 'floatUniform';
  }

  value = value === undefined ? 1.0 : value;

  vgl.uniform.call(this, vgl.GL.FLOAT, name);

  this.set(value);
};

inherit(vgl.floatUniform, vgl.uniform);
