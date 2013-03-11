//////////////////////////////////////////////////////////////////////////////
//
// blendFunction class
//
//////////////////////////////////////////////////////////////////////////////

vglModule.blendFunction = function(source, destination) {

  if (!(this instanceof vglModule.blendFunction)) {
    return new vglModule.blendFunction(source, destination);
  }

  // / Private variables
  var m_source = source;
  var m_destination = destination;

  /**
   * Apply blend function to the current state
   *
   */
  this.apply = function(renderState) {
    gl.blendFunc(m_source, m_destination);
  };

  return this;
};

// ////////////////////////////////////////////////////////////////////////////
//
// blend class
//
// ////////////////////////////////////////////////////////////////////////////

vglModule.blend = function() {

  if (!(this instanceof vglModule.blend)) {
    return new vglModule.blend();
  }
  vglModule.materialAttribute.call(this, materialAttributeType.Blend);

  // / Private member variables
  var m_wasEnabled = false;
  var m_blendFunction = vglModule.blendFunction(gl.SRC_ALPHA,
                                                gl.ONE_MINUS_SRC_ALPHA);

  /**
   * Bind blend attribute
   *
   */
  this.bind = function(renderState) {
    m_wasEnabled = gl.isEnabled(gl.BLEND);

    if (this.enabled()) {
      gl.enable(gl.BLEND);
      m_blendFunction.apply(renderState);
    }
    else {
      gl.disable(gl.BLEND);
    }

    return true;
  };

  /**
   * Undo blend attribute
   *
   */
  this.undoBind = function(renderState) {
    if (m_wasEnabled) {
      gl.enable(gl.BLEND);
    }
    else {
      gl.disable(gl.BLEND);
    }
    return true;
  };

  return this;
};

inherit(vglModule.blend, vglModule.materialAttribute);
