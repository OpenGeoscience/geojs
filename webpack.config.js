var config = require('./webpack.base.config');
var merge = require('webpack-merge');

module.exports = merge(config, {
  entry: {
    'geo': ['./polyfills', './index.js'],
    'geo.min': ['./polyfills', './index.js']
  }
});
