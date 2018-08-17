var path = require('path');
var webpack = require('webpack');
var exec = require('child_process').execSync;
var UglifyJsPlugin = require('uglifyjs-webpack-plugin');
var sha = '';

if (!exec) {
  console.warn('Node 0.12 or greater is required for detecting the git hash.');
}

try {
  sha = exec('git rev-parse HEAD', {cwd: __dirname}).toString().trim();
} catch (e) {
  console.warn('Could not determine git hash.');
}

var define_plugin = new webpack.DefinePlugin({
  GEO_SHA: JSON.stringify(sha),
  GEO_VERSION: JSON.stringify(require('./package.json').version)
});

module.exports = {
  /* webpack 4
  mode: 'production',
   */
  performance: {hints: false},
  cache: true,
  devtool: 'source-map',
  context: path.join(__dirname, 'src'),
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
      d3: 'd3/d3.js',
      hammerjs: 'hammerjs/hammer.js',
      mousetrap: 'mousetrap/mousetrap.js'
    }
  },
  plugins: [
    /* webpack 3 */
    new UglifyJsPlugin({
      include: /\.min\.js$/,
      parallel: true,
      uglifyOptions: {
        compress: true,
        comments: /@(license|copyright)/
      },
      sourceMap: true
    }),
    /* end webpack 3 */
    define_plugin
  ],
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
      /* The first rule only includes src/*.js so that it can conveniently be
       * modified for istanbul instrumentation */
      test: /\.js$/,
      include: path.resolve('src'),
      exclude: path.resolve('src/polyfills.js'),
      use: [{
        loader: 'babel-loader',
        options: {
          plugins: [require('babel-plugin-transform-object-rest-spread')],
          presets: [[
            'env', {
              targets: {
                browsers: ['defaults'],
                uglify: true
              },
              useBuiltIns: 'usage'
            }
          ]],
          cacheDirectory: true
        }
      }]
    }, {
      test: /\.js$/,
      include: [
        path.resolve('tests'),
        path.resolve('examples'),
        path.resolve('tutorials')
      ],
      use: [{
        loader: 'babel-loader',
        options: {
          plugins: [require('babel-plugin-transform-object-rest-spread')],
          presets: [[
            'env', {
              targets: {
                browsers: ['defaults'],
                uglify: true
              },
              useBuiltIns: 'usage'
            }
          ]],
          cacheDirectory: true
        }
      }]
    }, {
      test: /\.styl$/,
      use: [
        'style-loader',
        'css-loader',
        'stylus-loader'
      ]
    }, {
      test: /\.css$/,
      use: [
        'style-loader',
        'css-loader'
      ]
    }, {
      test: /vgl\.js$/,
      use: [
        'expose-loader?vgl',
        'imports-loader?mat4=gl-mat4,vec4=gl-vec4,vec3=gl-vec3,$=jquery'
      ]
    }]
  }
};
