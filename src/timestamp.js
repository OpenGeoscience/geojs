var m_globalTimestamp = 0;

/**
 * Create a new instance of class timestamp.  The timestamp is a globally
 * unique integer that monotonically increases.
 *
 * @class
 * @alias geo.timestamp
 * @returns {geo.timestamp}
 */
var timestamp = function () {
  'use strict';
  if (!(this instanceof timestamp)) {
    return new timestamp();
  }

  var m_this = this,
      m_timestamp = 0;

  /**
   * Update the timestamp to the next global timestamp value.
   *
   * @returns {this}
   */
  this.modified = function () {
    m_globalTimestamp += 1;
    m_timestamp = m_globalTimestamp;
    return m_this;
  };

  /**
   * Get time.
   *
   * @returns {number} The timestamp.  This is 0 if the timestamp has never
   *    been modified.
   */
  this.timestamp = function () {
    return m_timestamp;
  };

  // Also refer to `timestamp` under an alternate name
  this.getMTime = this.timestamp;

  return this;
};

module.exports = timestamp;
