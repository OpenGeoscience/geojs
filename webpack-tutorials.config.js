const WebpackStringReplacer = require('webpack-string-replacer');
const { SwcMinifyWebpackPlugin } = require('swc-minify-webpack-plugin');

var path = require('path');

var base = require('./webpack.config');

var rules = base.module.rules.concat([{
  test: /\.pug$/,
  use: ['pug-load']
}, {
  test: /\.(woff|woff2|eot|ttf|svg)(\?v=\d+\.\d+\.\d+)?$/,
  type: 'asset/inline'
}, {
  test: require.resolve('codemirror'),
  use: [{
    loader: 'expose-loader',
    options: {exposes: 'CodeMirror'}
  }]
}]);

var plugins = base.plugins;
plugins.push(new WebpackStringReplacer({
  rules:[{
    fileInclude: /bootstrap.css$/,
    replacements: [{
      pattern: /@import.*fonts.googleapis.com\/css\?family=Lato[^;]*;/g,
      replacement: () => '@import url(../../@fontsource/lato/index.css);'
    }]
  }]
}));

var resolve = {
  extensions: ['.js', '.css', '.pug', '...'],
  alias: base.resolve.alias
};

module.exports = {
  mode: 'production',
  performance: {hints: false},
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
  optimization: {
    minimizer: [
      new SwcMinifyWebpackPlugin()
    ]
  },
  module: {
    rules: rules
  },
  resolve: resolve,
  plugins: plugins
};
