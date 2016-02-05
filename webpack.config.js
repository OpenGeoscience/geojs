var path = require('path');
var webpack = require('webpack');
var define_plugin = new webpack.DefinePlugin({
  VERSION: JSON.stringify(require('./package.json').version)
});

module.exports = {
  context: path.join(__dirname, 'src'),
  entry: {
    geo: './index.js',
    'geo.min': './index.js',
    vendor: './vendor.js'
  },
  output: {
    path: path.join(__dirname, 'dist', 'built'),
    publicPath: 'dist/built',
    filename: '[name].js',
    library: 'geo',
    libraryTarget: 'umd'
  },
  resolve: {
    alias: {
      jquery: 'jquery/dist/jquery',
      proj4: 'proj4/lib',
      vgl: 'vgl/vgl.js',
      d3: 'd3/d3.js'
    }
  },
  plugins: [
    define_plugin,
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'geo.ext.js',
      minChunks: Infinity
    }),
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true
    })
  ],
  module: {
    loaders: [{
      test: /\.json$/,
      loader: 'json-loader'
    }, {
      test: require.resolve('d3'), loader: 'exports?d3'
    }]
  },

  // These are plugins that we want to run in Karma as well
  exposed_plugins: [
    define_plugin
  ]
};
