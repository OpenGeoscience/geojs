//////////////////////////////////////////////////////////////////////////////
//
// object class
//
//////////////////////////////////////////////////////////////////////////////
vglModule.object = function() {
  // / TODO Switch to time based modifications

  if (!(this instanceof vglModule.object)) {
    return new vglModule.object();
  }

  // Private variables
  var m_modifiedTime = coreModule.timestamp();
  m_modifiedTime.modified();

  // Public member methods
  this.modified = function() {
    m_modifiedTime.modified();
  };

  this.getMTime = function() {
    return m_modifiedTime.getMTime();
  };

  return this;
};