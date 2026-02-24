var webpack = require('webpack');
var config = require('../webpack-test.config');

function buildTestBundle(callback) {
  var compiler = webpack(config);
  compiler.run(function (err, stats) {
    if (err) {
      console.error('Webpack build error:', err);
      if (callback) {
        callback(err);
      } else {
        process.exit(1);
      }
      return;
    }
    var info = stats.toJson();
    if (stats.hasErrors()) {
      console.error('Webpack compilation errors:');
      info.errors.forEach(function (e) {
        console.error(e.message || e);
      });
      if (callback) {
        callback(new Error('Webpack compilation failed'));
      } else {
        process.exit(1);
      }
      return;
    }
    if (stats.hasWarnings()) {
      info.warnings.forEach(function (w) {
        console.warn(w.message || w);
      });
    }
    console.log('Test bundle built successfully.');
    compiler.close(function (closeErr) {
      if (callback) {
        callback(closeErr || null);
      }
    });
  });
}

if (require.main === module) {
  buildTestBundle(function (err) {
    if (err) {
      process.exit(1);
    }
  });
}

module.exports = buildTestBundle;
