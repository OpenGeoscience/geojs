var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: path.join(__dirname, 'src'),
  entry: {
    geo: './index.js',
    'geo.min': './index.js',
    vendor: [
      'jquery',
      'gl-mat4',
      'gl-vec2',
      'gl-vec3',
      'gl-vec4',
      'proj4',
      'd3',
      'pnltri'
    ]
  },
  output: {
    path: path.join(__dirname, 'dist', 'built'),
    filename: '[name].js',
    library: 'geo',
    libraryTarget: 'umd'
  },
  resolve: {
    alias: {
      jquery: 'jquery/dist/jquery',
      proj4: 'proj4/dist/proj4-src.js',
      vgl: 'vgl/vgl.js'
    }
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'geo.ext.js',
      minChunks: Infinity
    }),
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true
    })
  ]
};
