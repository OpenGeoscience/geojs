const path = require('path');
var exec = require('child_process').execSync;
var webpack = require('webpack');
var TerserPlugin = require('terser-webpack-plugin');

var sha = '';

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
  mode: 'production',
  performance: {hints: false},
  cache: true,
  devtool: 'source-map',
  context: path.join(__dirname, 'src'),
  output: {
    path: path.resolve(__dirname, 'dist', 'built'),
    publicPath: 'dist/built',
    filename: '[name].js',
    library: 'geo',
    libraryTarget: 'umd'
  },
  resolve: {
    alias: {
      jquery: 'jquery/dist/jquery',
      kdbush: 'kdbush/kdbush.js',
      proj4: 'proj4/lib',
      vgl: 'vgl/vgl.js',
      d3: 'd3/d3.js',
      hammerjs: 'hammerjs/hammer.js',
      mousetrap: 'mousetrap/mousetrap.js'
    }
  },
  plugins: [
    define_plugin
  ],
  optimization: {
    minimizer: [
      new TerserPlugin({
        include: /\.min\.js$/,
        extractComments: false,
        parallel: true
      })
    ]
  },
  module: {
    rules: [{
      test: /\.js$/,
      include: path.resolve('src'),
      use: ['babel-loader']
    }, {
      test: /\.js$/,
      include: [
        path.resolve('tests'),
        path.resolve('examples'),
        path.resolve('tutorials')
      ],
      use: ['babel-loader']
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
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: [{
        loader: 'shader-loader',
        options: {
          glsl: { chunkPath: 'src/webgl' }
        }
      }]
    }, {
      // vgl expects jQuery, gl-vec3/4, gl-mat4 to be in the global name space
      test: /vgl\.js$/,
      use: [{
        loader: 'expose-loader',
        options: {
          exposes: {
            globalName: 'vgl',
            override: true
          }
        }
      }, {
        loader: 'imports-loader',
        options: {
          type: 'commonjs',
          imports: [
            'single gl-mat4 mat4',
            'single gl-vec4 vec4',
            'single gl-vec3 vec3',
            'single jquery $'
          ]
        }
      }]
    }]
  }
};
