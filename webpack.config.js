var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: path.join(__dirname, 'src'),
  entry: {
    geo: './index.js',
    'geo.min': './index.js'
  },
  output: {
    path: path.join(__dirname, 'dist', 'built'),
    filename: '[name].js',
    library: 'geo',
    libraryTarget: 'umd'
  },
  externals: {
    jquery: 'jQuery',
    mat4: 'mat4',
    vec4: 'vec4',
    vec3: 'vec3',
    pnltri: 'PNLTRI',
    proj4: 'proj4',
    vgl: 'vgl',
    d3: 'd3'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true
    })
  ]
};
