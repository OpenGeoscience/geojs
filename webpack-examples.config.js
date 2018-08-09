const StringReplacePlugin = require('string-replace-webpack-plugin');

var path = require('path');

var base = require('./webpack.config');

var rules = base.module.rules.concat([{
  test: /\.pug$/,
  use: ['pug-loader']
}, {
  test: /\.css$/,
  loader: 'style-loader!css-loader'
}, {
  test: /\.jade$/,
  loader: 'jade'
}, {
  test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
  use: ['url-loader?limit=10000&mimetype=application/font-woff']
}, {
  test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
  use: ['url-loader?limit=10000&mimetype=application/octet-stream']
}, {
  test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
  use: ['file-loader']
}, {
  test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
  use: ['url-loader?limit=10000&mimetype=image/svg+xml']
}, {
  test: require.resolve('codemirror'),
  use: ['expose-loader?CodeMirror']
}, {
  test: /jsonlint\.js$/,
  use: ['expose-loader?jsonlint']
}, {
  test: require.resolve('colorbrewer'),
  use: ['expose-loader?colorbrewer']
}, {
  test: /bootstrap.css$/,
  use: [StringReplacePlugin.replace({
    replacements: [{
      pattern: /@import.*fonts.googleapis.com\/css\?family=Lato[^;]*;/g,
      replacement: () => '@import url(../../typeface-lato/index.css);'
    }]
  })]
}]);

var plugins = base.plugins;
plugins.push(new StringReplacePlugin());

var resolve = {
  extensions: ['.js', '.css', '.pug'],
  alias: base.resolve.alias
};

module.exports = {
  /* webpack 4
  mode: 'production',
   */
  performance: {hints: false},
  cache: true,
  devtool: 'source-map',
  context: path.join(__dirname),
  entry: {
    bundle: './examples/index.js'
  },
  output: {
    path: path.join(__dirname, 'dist', 'examples'),
    publicPath: '/examples/',
    filename: '[name].js'
  },
  module: {
    rules: rules
  },
  resolve: resolve,
  plugins: plugins
};
