//////////////////////////////////////////////////////////////////////////////
//
// boundingObject class
//
//////////////////////////////////////////////////////////////////////////////
vglModule.boundingObject = function() {

  if (!(this instanceof vglModule.boundingObject)) {
    return new vglModule.boundingObject();
  }
  vglModule.object.call(this);

  var m_boundsDirty = true;
  var m_bounds = new Array(6);

  /**
   * Return true if bounds are dirty otherwise false
   *
   */
  this.boundsDirty = function() {
    return m_boundsDirty;
  };

  /**
   * Mark bounds dirty for the object
   *
   */
  this.setBoundsDirty = function(flag) {
    if (m_boundsDirty !== flag) {
      m_boundsDirty = flag;
      this.modified();
      return true;
    }

    return false;
  };

  /**
   * Get current bounds of the object
   *
   */
  this.bounds = function() {
    return m_bounds;
  };

  /**
   * Set current bounds of the object
   *
   */
  this.setBounds = function(minX, maxX, minY, maxY, minZ, maxZ) {
    m_bounds[0] = minX;
    m_bounds[1] = maxX;
    m_bounds[2] = minY;
    m_bounds[3] = maxY;
    m_bounds[4] = minZ;
    m_bounds[5] = maxZ;

    this.modified();

    return true;
  };

  // / Request computing bounds. Should be implemented by the concrete class
  this.computeBounds = function() {
  };

  return this;
};

inherit(vglModule.boundingObject, vglModule.object);
