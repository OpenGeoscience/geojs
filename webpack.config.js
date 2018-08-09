var config = require('./webpack.base.config');
var merge = require('webpack-merge');

module.exports = merge(config, {
  entry: {
    'geo': './index.js',
    'geo.min': './index.js'
  }
});
