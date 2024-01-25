// The lean build does not include any of the third-party runtime dependencies,
// rather it assumes they are in the global namespace at runtime.
var config = require('./webpack.base.config');
const { merge } = require('webpack-merge');

module.exports = merge(config, {
  entry: {
    'geo.lean': './index.js',
    'geo.lean.min': './index.js'
  },
  externals: {
    d3: 'd3',
    'd3-array': 'd3-array',
    'd3-axis': 'd3-axis',
    'd3-brush': 'd3-brush',
    'd3-chord': 'd3-chord',
    'd3-color': 'd3-color',
    'd3-contour': 'd3-contour',
    'd3-delaunay': 'd3-delaunay',
    'd3-dispatch': 'd3-dispatch',
    'd3-drag': 'd3-drag',
    'd3-dsv': 'd3-dsv',
    'd3-ease': 'd3-ease',
    'd3-fetch': 'd3-fetch',
    'd3-force': 'd3-force',
    'd3-format': 'd3-format',
    'd3-geo': 'd3-geo',
    'd3-hierarchy': 'd3-hierarchy',
    'd3-interpolate': 'd3-interpolate',
    'd3-path': 'd3-path',
    'd3-polygon': 'd3-polygon',
    'd3-quadtree': 'd3-quadtree',
    'd3-random': 'd3-random',
    'd3-scale': 'd3-scale',
    'd3-scale-chromatic': 'd3-scale-chromatic',
    'd3-selection': 'd3-selection',
    'd3-shape': 'd3-shape',
    'd3-time': 'd3-time',
    'd3-time-format': 'd3-time-format',
    'd3-timer': 'd3-timer',
    'd3-transition': 'd3-transition',
    'd3-zoom': 'd3-zoom',
    hammerjs: {
      root: 'Hammer',
      commonjs: 'hammerjs',
      commonjs2: 'hammerjs',
      amd: 'hammerjs',
      // Since GeoJS's libraryTarget is "umd", defining this (undocumented)
      // external library type will allow Webpack to create a better error
      // message if a "hammerjs" import fails
      umd: 'hammerjs'
    },
    'vtk.js': 'vtk.js'
  }
});
