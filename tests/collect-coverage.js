/**
 * Merge coverage JSON files and produce reports.
 * This replaces karma-coverage's reporting functionality.
 */
var fs = require('fs');
var path = require('path');
var { createCoverageMap } = require('istanbul-lib-coverage');
var reports = require('istanbul-reports');
var libReport = require('istanbul-lib-report');
var glob = require('glob');

function collectCoverage() {
  var coverageDir = path.resolve('dist/coverage/json');
  if (!fs.existsSync(coverageDir)) {
    console.log('No coverage data found in ' + coverageDir);
    return;
  }

  var files = glob.sync(path.join(coverageDir, '**', 'coverage.json'));
  if (files.length === 0) {
    console.log('No coverage JSON files found.');
    return;
  }

  var coverageMap = createCoverageMap({});

  files.forEach(function (file) {
    console.log('  Merging coverage from: ' + file);
    var data = JSON.parse(fs.readFileSync(file, 'utf8'));
    coverageMap.merge(data);
  });

  var configWatermarks = {
    statements: [50, 80],
    branches: [50, 80],
    functions: [50, 80],
    lines: [50, 80]
  };

  // Cobertura report
  var coberturaDir = path.resolve('dist/cobertura');
  if (!fs.existsSync(coberturaDir)) {
    fs.mkdirSync(coberturaDir, { recursive: true });
  }
  var coberturaContext = libReport.createContext({
    dir: coberturaDir,
    watermarks: configWatermarks,
    coverageMap: coverageMap
  });
  reports.create('cobertura', { file: 'coverage.xml' }).execute(coberturaContext);
  console.log('  Wrote cobertura report to ' + coberturaDir + '/coverage.xml');

  // LCOV report
  var lcovDir = path.resolve('dist/coverage/lcov');
  if (!fs.existsSync(lcovDir)) {
    fs.mkdirSync(lcovDir, { recursive: true });
  }
  var lcovContext = libReport.createContext({
    dir: lcovDir,
    watermarks: configWatermarks,
    coverageMap: coverageMap
  });
  reports.create('lcovonly', { file: 'lcov.info' }).execute(lcovContext);
  console.log('  Wrote lcov report to ' + lcovDir + '/lcov.info');

  // Text summary to stdout
  var textContext = libReport.createContext({
    dir: path.resolve('dist'),
    watermarks: configWatermarks,
    coverageMap: coverageMap
  });
  reports.create('text-summary', {}).execute(textContext);

  console.log('Coverage reports generated.');
}

if (require.main === module) {
  collectCoverage();
}

module.exports = collectCoverage;
