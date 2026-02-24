/**
 * Main test runner script. Builds the webpack test bundle, starts the test
 * server, then runs Playwright tests. This replaces the karma workflow.
 */
var path = require('path');
var child_process = require('child_process');

var buildTestBundle = require('./build-test-bundle');
var testServer = require('../test-server');

var serverPort = parseInt(process.env.TEST_SERVER_PORT, 10) || 9876;

// Determine which browsers to use
var browsers = process.env.GEOJS_BROWSERS || 'chromium';
// Determine if coverage is requested
var coverage = process.env.GEOJS_COVERAGE === 'true';

console.log('Building test bundle...');
console.log('  Test case: ' + (process.env.GEOJS_TEST_CASE || 'tests/all.js'));
if (coverage) {
  console.log('  Coverage: enabled');
}

buildTestBundle(function (err) {
  if (err) {
    console.error('Failed to build test bundle.');
    process.exit(1);
  }

  console.log('Starting test server on port ' + serverPort + '...');
  testServer.createServer(serverPort).then(function (result) {
    var server = result.server;

    var configPath = path.resolve(__dirname, '..', 'playwright.config.js');
    var testFile = path.resolve(__dirname, 'playwright-runner.spec.js');

    var args = [
      'playwright', 'test',
      testFile,
      '--config', configPath
    ];

    // Set the project based on requested browsers
    var browserList = browsers.split(',');
    browserList.forEach(function (b) {
      args.push('--project', b.trim());
    });

    var env = Object.assign({}, process.env, {
      TEST_SERVER_PORT: '' + serverPort
    });

    console.log('Running Playwright tests...');
    var proc = child_process.spawn('npx', args, {
      stdio: 'inherit',
      env: env,
      cwd: path.resolve(__dirname, '..'),
      shell: true
    });

    proc.on('close', function (code) {
      server.close();

      if (coverage) {
        console.log('Generating coverage reports...');
        try {
          var collectCoverage = require('./collect-coverage');
          collectCoverage();
        } catch (covErr) {
          console.error('Error generating coverage reports:', covErr.message);
        }
      }

      process.exit(code);
    });

    proc.on('error', function (spawnErr) {
      console.error('Failed to start Playwright:', spawnErr);
      server.close();
      process.exit(1);
    });
  }).catch(function (serverErr) {
    console.error('Failed to start test server:', serverErr);
    process.exit(1);
  });
});
