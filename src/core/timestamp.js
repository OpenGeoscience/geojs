//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class timestamp
 *
 * @class
 * @extends vgl.timestamp
 * @returns {geo.timestamp}
 */
//////////////////////////////////////////////////////////////////////////////
geo.timestamp = function () {
  'use strict';
  if (!(this instanceof geo.timestamp)) {
    return new geo.timestamp();
  }
  vgl.timestamp.call(this);
};

inherit(geo.timestamp, vgl.timestamp);
