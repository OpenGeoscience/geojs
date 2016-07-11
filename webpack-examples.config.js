var path = require('path');

var base = require('./webpack.config');
var external = require('./external.config');

require('./examples/build');

var loaders = base.module.loaders.concat([{
  test: /\.css$/,
  loader: 'style-loader!css-loader'
}, {
  test: /\.jade$/,
  loader: 'jade'
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
}, {
  test: /jsonlint\.js$/,
  loader: 'expose?jsonlint'
}, {
  test: require.resolve('colorbrewer'),
  loader: 'expose?colorbrewer'
}]);

loaders = loaders.concat(external.module.loaders);

var plugins = base.exposed_plugins;

var resolve = {
  extentions: ['.js', '.css', '.jade', ''],
  alias: base.resolve.alias
};

module.exports = {
  cache: true,
  devtool: 'source-map',
  context: path.join(__dirname),
  entry: {
    bundle: './examples/index.js'
  },
  output: {
    path: path.join(__dirname, 'dist', 'examples'),
    publicPath: '/examples',
    filename: '[name].js'
  },
  module: {
    loaders: loaders
  },
  resolve: resolve,
  plugins: plugins
};
