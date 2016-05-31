/* global require, module */
'use strict';

var express = require('express'),
    bodyParser = require('body-parser'),
    xml = require('xmlbuilder'),
    fs = require('fs'),
    app = express(),
    cov = {},
    notes = {};

/**
 * Combine coverage results.
 */
function combine(files) {
  var f, l;
  for (f in files) {
    if (files.hasOwnProperty(f)) {
      if (!cov.hasOwnProperty(f)) {
        cov[f] = {};
      }

      for (l in files[f]) {
        if (files[f].hasOwnProperty(l)) {
          if (!cov[f].hasOwnProperty(l)) {
            cov[f][l] = 0;
          }
          cov[f][l] += files[f][l];
        }
      }
    }
  }
}

/**
 * Get total coverage statistics
 */
function calc_stats() {
  var f, l, stats;

  stats = {
    totalSloc: 0,
    totalHits: 0,
    files: {}
  };
  for (f in cov) {
    if (cov.hasOwnProperty(f)) {
      var sloc = 0, hits = 0;

      for (l in cov[f]) {
        if (cov[f].hasOwnProperty(l)) {
          sloc += 1;
          hits += cov[f][l] && 1;

        }
      }

      stats.totalSloc += sloc;
      stats.totalHits += hits;
      stats.files[f] = {
        sloc: sloc,
        hits: hits
      };
    }
  }
  return stats;
}

/**
 * Convert to cobertura xml format
 */
function cobertura() {
  var stats, totalPct, root, pkg, clss, cls, f, l, ln, lineRate;

  function _percent(num, den) {
    if (den <= 0) {
      return 1;
    } else {
      return num / den;
    }
  }

  stats = calc_stats();
  totalPct = _percent(stats.totalHits, stats.totalSloc);

  root = xml.create('coverage');
  root.a({
    'branch-rate': 0,
    'line-rate': totalPct,
    'version': 3.6,
    'timestamp': (new Date() / 1000).toFixed()
  });

  pkg = root.ele('packages').ele('package');
  pkg.a({
    'branch-rate': 0,
    'complexity': 0,
    'line-rate': totalPct,
    'name': ''
  });

  clss = pkg.ele('classes');
  for (f in cov) {
    if (cov.hasOwnProperty(f)) {
      lineRate = _percent(stats.files[f].hits, stats.files[f].sloc);
      cls = clss.ele('class');
      cls.a({
        'branch-rate': 0,
        'complexity': 0,
        'line-rate': lineRate,
        'filename': f.replace(/^src\/vgl/, 'vgl/src'),
        'name': f
      });

      ln = cls.ele('lines');
      for (l in cov[f]) {
        if (cov[f].hasOwnProperty(l)) {
          ln.ele('line').a({
            number: l,
            hits: cov[f][l]
          });
        }
      }
    }
  }

  return root.toString();
}

app.use(bodyParser.json());
app.use(express.static('dist'));

app.put('/coverage', function (req, res, next) {
  combine(req.body.files);
  res.send('{}');
  next();
});

app.delete('/coverage', function (req, res, next) {
  cov = {};
  res.send('{}');
  next();
});

app.get('/coverage', function (req, res, next) {
  res.send(cobertura());
  next();
});

app.post('/coverage', function (req, res, next) {
  fs.writeFile(req.query.path, cobertura());
  res.send('{}');
  next();
});

app.delete('/notes', function (req, res, next) {
  notes = {};
  res.send('{}');
  next();
});

app.put('/notes', function (req, res, next) {
  notes[req.query.key] = req.body;
  res.send('{}');
  next();
});

app.post('/notes', function (req, res, next) {
  fs.writeFile(req.query.path, JSON.stringify(notes));
  next();
});

app.listen(30100, function () {
  console.log('Server listening on 30100');
});

module.exports = app;
