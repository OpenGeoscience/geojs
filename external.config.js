var path = require('path');
var UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  /* webpack 4
  mode: 'production',
   */
  performance: {hints: false},
  cache: true,
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
  /* webpack 3 */
  plugins: [
    new UglifyJsPlugin({
      include: /\.min\.js$/,
      parallel: true,
      uglifyOptions: {
        compress: true,
        comments: /@(license|copyright)/
      },
      sourceMap: true
    })
  ],
  /* end webpack 3 */
  /* webpack 4
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        include: /\.min\.js$/,
        parallel: true,
        uglifyOptions: {
          compress: true,
          comments: /@(license|copyright)/
        },
        sourceMap: true
      })
    ]
  },
  */
  module: {
    rules: [{
      test: require.resolve('d3'),
      use: ['expose-loader?d3']
    }, {
      test: require.resolve('hammerjs'),
      use: ['expose-loader?hammerjs']
    }]
  }
};
