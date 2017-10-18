var vgl = require('vgl');
var inherit = require('./inherit');

/**
 * Create a new instance of class timestamp.
 *
 * @class geo.timestamp
 * @extends vgl.timestamp
 * @returns {geo.timestamp}
 */
var timestamp = function () {
  'use strict';
  if (!(this instanceof timestamp)) {
    return new timestamp();
  }
  vgl.timestamp.call(this);
};

inherit(timestamp, vgl.timestamp);
module.exports = timestamp;
