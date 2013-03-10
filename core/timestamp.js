//////////////////////////////////////////////////////////////////////////////
//
// timestamp class
//
//////////////////////////////////////////////////////////////////////////////

m_globalModifiedTime = 0;

coreModule.timestamp = function() {

  if (!(this instanceof coreModule.timestamp)) {
    return new coreModule.timestamp();
  }

  var m_modifiedTime = 0;

  this.modified = function() {
    ++m_globalModifiedTime;
    m_modifiedTime = m_globalModifiedTime;
  };

  this.getMTime = function() {
    return m_modifiedTime;
  };
};