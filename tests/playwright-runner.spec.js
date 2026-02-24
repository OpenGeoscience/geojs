// @ts-check
var { test, expect } = require('@playwright/test');
var fs = require('fs');
var path = require('path');

var testCase = process.env.GEOJS_TEST_CASE || 'tests/all.js';
var coverage = process.env.GEOJS_COVERAGE === 'true';

test.describe.configure({ timeout: 600000 });

test('GeoJS Jasmine Tests (' + testCase + ')', async function ({ page, browserName }) {
  var serverPort = process.env.TEST_SERVER_PORT || '9876';
  var url = 'http://localhost:' + serverPort + '/tests/jasmine-harness.html';

  var suppressPatterns = [
    /WebGL context was lost/,
    /WebGL: CONTEXT_LOST_WEBGL/,
    /WARNING: Too many active WebGL contexts/,
    /WEBGL_lose_context/,
    /JavaScript Warning:/,
    /has no expectations/,
    /Failed to load resource:/,
    /GPU stall due to ReadPixels/
  ];

  // Listen for console messages and relay them
  page.on('console', function (msg) {
    var type = msg.type();
    var text = msg.text();
    if (type === 'warning' || type === 'error') {
      for (var i = 0; i < suppressPatterns.length; i++) {
        if (suppressPatterns[i].test(text)) {
          return;
        }
      }
    }
    if (type === 'error') {
      console.error(text);
    } else if (type === 'warning') {
      console.warn(text);
    } else {
      console.log(text);
    }
  });

  // Listen for page errors
  page.on('pageerror', function (err) {
    console.error('[browser page error] ' + err.message);
  });

  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Wait for jasmine to finish — poll every second, up to 10 minutes
  var results = await page.evaluate(function () {
    return new Promise(function (resolve) {
      var checkInterval = setInterval(function () {
        if (window.__jasmineDone) {
          clearInterval(checkInterval);
          resolve(window.__jasmineResults);
        }
      }, 1000);
    });
  });

  // Collect coverage if enabled
  if (coverage) {
    var coverageData = await page.evaluate(function () {
      return window.__coverage__ || null;
    });
    if (coverageData) {
      // Determine subdirectory name
      var subdir = browserName;
      if (testCase) {
        var parts = /^(.+\/)*(([^/]+)\.[^/.]*|[^/.]+)$/.exec(testCase);
        if (parts) {
          subdir += '_' + (parts[3] || parts[2]);
        }
      }
      var coverageDir = path.resolve('dist/coverage/json', subdir);
      if (!fs.existsSync(coverageDir)) {
        fs.mkdirSync(coverageDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(coverageDir, 'coverage.json'),
        JSON.stringify(coverageData)
      );
      console.log('Coverage data written to ' + coverageDir);
    } else {
      console.log('No coverage data found in browser (window.__coverage__ was empty).');
    }
  }

  // Print summary
  console.log('\n=== Jasmine Test Results ===');
  console.log('Total: ' + results.totalSpecs +
    ', Passed: ' + results.passedSpecs +
    ', Failed: ' + results.failedSpecs +
    ', Skipped: ' + results.skippedSpecs);
  console.log('Overall status: ' + results.overallStatus);

  // Print failures
  if (results.failures && results.failures.length > 0) {
    console.log('\n=== Failures ===');
    results.failures.forEach(function (failure) {
      console.log('\n  FAILED: ' + failure.fullName);
      failure.failedExpectations.forEach(function (exp) {
        console.log('    ' + exp.message);
        if (exp.stack) {
          console.log('    ' + exp.stack.split('\n').slice(0, 3).join('\n    '));
        }
      });
    });
  }

  expect(results.failedSpecs).toBe(0);
});
