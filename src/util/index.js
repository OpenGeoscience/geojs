var $ = require('jquery');

/**
 * @module geo.util
 */
var util = require('./init');
$.extend(util, require('./throttle'));
$.extend(util, require('./mockVGL'));
util.DistanceGrid = require('./distanceGrid.js');
util.ClusterGroup = require('./clustering.js');

module.exports = util;
