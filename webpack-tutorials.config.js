const StringReplacePlugin = require('string-replace-webpack-plugin');

var path = require('path');

var base = require('./webpack.config');
var external = require('./external.config');

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
}, {
  test: /bootstrap.css$/,
  loader: StringReplacePlugin.replace({
    replacements: [{
      pattern: /@import.*fonts.googleapis.com\/css\?family=Lato[^;]*;/g,
      replacement: () => '@import url(../../typeface-lato/index.css);'
    }]
  })
}]);

loaders = loaders.concat(external.module.loaders);

var plugins = base.exposed_plugins;
plugins.push(new StringReplacePlugin());

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
    publicPath: '/tutorials/',
    filename: '[name].js'
  },
  module: {
    loaders: loaders
  },
  resolve: resolve,
  plugins: plugins
};
