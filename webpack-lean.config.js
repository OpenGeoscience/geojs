// The lean build does not include any of the third-party runtime dependencies, rather
// it assumes they are in the global namespace at runtime.
var config = require('./webpack.base.config');
var merge = require('webpack-merge');

module.exports = merge(config, {
  entry: {
    'geo.lean': './index.js',
    'geo.lean.min': './index.js'
  },
  externals: {
    d3: 'd3',
    hammerjs: {
      root: 'Hammer',
      commonjs: 'hammerjs',
      commonjs2: 'hammerjs',
      amd: 'hammerjs',
      // Since GeoJS's libraryTarget is "umd", defining this (undocumented) external library type
      // will allow Webpack to create a better error message if a "hammerjs" import fails
      umd: 'hammerjs'
    }
  }
});
