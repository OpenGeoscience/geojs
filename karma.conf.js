// Defines a test server for running jasmine unit tests
// with coverage support.

var karma_config = require('./karma-base');

module.exports = function (config) {
  config.set(karma_config);
};
