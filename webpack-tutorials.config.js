var path = require('path');

var base = require('./webpack.config');
var external = require('./external.config');

require('./tutorials/build');

var loaders = base.module.loaders.concat([{
  test: /\.pug$/,
  loader: 'pug'
}, {
  test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
  loader: 'url?limit=10000&mimetype=application/font-woff'
}, {
  test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
  loader: 'url?limit=10000&mimetype=application/octet-stream'
}, {
  test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
  loader: 'file'
}, {
  test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
  loader: 'url?limit=10000&mimetype=image/svg+xml'
}, {
  test: require.resolve('codemirror'),
  loader: 'expose?CodeMirror'
}]);

loaders = loaders.concat(external.module.loaders);

var plugins = base.exposed_plugins;

var resolve = {
  extentions: ['.js', '.css', '.pug', ''],
  alias: base.resolve.alias
};

module.exports = {
  cache: true,
  devtool: 'source-map',
  context: path.join(__dirname),
  entry: {
    bundle: './tutorials/index.js'
  },
  output: {
    path: path.join(__dirname, 'dist', 'tutorials'),
    publicPath: '/tutorials',
    filename: '[name].js'
  },
  module: {
    loaders: loaders
  },
  resolve: resolve,
  plugins: plugins
};
