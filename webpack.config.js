var path = require('path');
var webpack = require('webpack');
var define_plugin = new webpack.DefinePlugin({
  VERSION: JSON.stringify(require('./package.json').version)
});

module.exports = {
  context: path.join(__dirname, 'src'),
  entry: {
    geo: './index.js',
    'geo.min': './index.js'
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
  externals: {
    jquery: 'jQuery',
    d3: 'd3'
  },
  plugins: [
    define_plugin,
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true,
      comments: /@(license|copyright)/
    })
  ],
  module: {
    loaders: [{
      test: /\.json$/,
      loader: 'json-loader'
    }, {
      test: /vgl\.js$/,
      loader: 'expose?vgl!imports?mat4=gl-mat4,vec4=gl-vec4,vec3=gl-vec3,vec2=gl-vec2,$=jquery'
    }]
  },

  // These are plugins that we want to run in Karma as well
  exposed_plugins: [
    define_plugin
  ]
};
