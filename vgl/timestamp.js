/**
 * Create a new instance of class timestamp
 *
 * @class
 * @returns {vglModule.timestamp}
 */
m_globalModifiedTime = 0;

vglModule.timestamp = function() {

  if (!(this instanceof vglModule.timestamp)) {
    return new vglModule.timestamp();
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
