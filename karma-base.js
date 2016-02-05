var webpack_config = require('./webpack.config');

module.exports = {
  files: [
    'tests/cases/**/*.js',
    {pattern: 'tests/data/**/*', included: false}
  ],
  proxies: {
    '/data/': '/base/tests/data/'
  },
  browsers: [
    'PhantomJS'
  ],
  reporters: [
    'progress',
    'kjhtml'
  ],
  preprocessors: {
    'tests/cases/**/*.js': ['webpack', 'sourcemap']
  },
  frameworks: [
    'jasmine'
  ],
  webpack: {
    cache: true,
    devtool: 'inline-source-map',
    module: {
      loaders: webpack_config.module.loaders
    },
    resolve: webpack_config.resolve,
    plugins: webpack_config.exposed_plugins
  }
};
