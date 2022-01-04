var config = require('./webpack.base.config');
const { merge } = require('webpack-merge');

module.exports = merge(config, {
  entry: {
    geo: ['./index.js'],
    'geo.min': ['./index.js']
  }
});
