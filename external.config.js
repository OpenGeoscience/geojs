var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: path.join(__dirname, 'src'),
  entry: {
    'geo.ext': './vendor.js',
    'geo.ext.min': './vendor.js'
  },
  output: {
    path: path.join(__dirname, 'dist', 'built'),
    publicPath: 'dist/built',
    filename: '[name].js'
  },
  resolve: {
    alias: {
      d3: 'd3/d3.js',
      hammerjs: 'hammerjs/hammer.js'
    }
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true,
      comments: /@(license|copyright)/
    })
  ],
  module: {
    loaders: [{
      test: require.resolve('d3'), loader: 'expose?d3'
    }, {
      test: require.resolve('hammerjs'), loader: 'expose?hammerjs'
    }]
  }
};
