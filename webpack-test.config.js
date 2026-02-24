var webpack_config = require('./webpack.base.config');
var path = require('path');
var test_case = process.env.GEOJS_TEST_CASE || 'tests/all.js';

var config = {
  mode: 'development',
  performance: { hints: false },
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '_build', '.webpack-test-cache')
  },
  devtool: 'inline-source-map',
  context: path.join(__dirname),
  entry: {
    'test-bundle': './' + test_case
  },
  output: {
    path: path.resolve(__dirname, '_build', 'test-bundle'),
    filename: '[name].js',
    publicPath: '/test-bundle/'
  },
  module: {
    rules: webpack_config.module.rules.map(function (rule, index) {
      if (index === 0) {
        // Add compact: false to the first rule's babel-loader options
        var newRule = Object.assign({}, rule);
        newRule.use = rule.use.map(function (u) {
          if (typeof u === 'object' && u.loader === 'babel-loader') {
            return Object.assign({}, u, {
              options: Object.assign({}, u.options, { compact: false })
            });
          }
          return u;
        });
        return newRule;
      }
      return rule;
    })
  },
  resolve: webpack_config.resolve,
  plugins: webpack_config.plugins.slice()
};

/* If coverage is requested, add istanbul instrumentation */
if (process.env.GEOJS_COVERAGE === 'true') {
  // Add coverage-istanbul-loader to the first rule (src files)
  config.module.rules[0] = Object.assign({}, config.module.rules[0]);
  config.module.rules[0].use = config.module.rules[0].use.concat([{
    loader: '@jsdevtools/coverage-istanbul-loader',
    options: { esModules: true }
  }]);
}

/* If webpack of a test fails, stop rather than run some tests */
class WarningsToErrorsWebpackPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('WarningsToErrorsWebpackPlugin', function (stats) {
      if (stats.compilation.warnings.length) {
        stats.compilation.warnings.forEach(function (warning) {
          console.log(warning.message || warning);
        });
        // Make the build fail
        stats.compilation.errors = stats.compilation.errors.concat(
          stats.compilation.warnings.map(function (w) { return new Error(w.message || w); })
        );
      }
    });
  }
}

config.plugins.push(new WarningsToErrorsWebpackPlugin());

module.exports = config;
