require('../src/vendor');
window.geo = require('../src/index');

// bootstrap and themes
require('bootstrap/dist/css/bootstrap.css');
require('bootswatch/flatly/bootstrap.css');
require('bootstrap');

// codemirror and plugins
require('codemirror/lib/codemirror.css');
require('codemirror/addon/lint/lint.css');
require('codemirror/addon/fold/foldgutter.css');

// Colorbrewer
require('colorbrewer');

require('./common/jsonlint');
require('codemirror');
require('codemirror/mode/javascript/javascript');
require('codemirror/addon/lint/lint');
require('codemirror/addon/lint/json-lint');
require('codemirror/addon/fold/brace-fold');
require('codemirror/addon/fold/foldcode');
require('codemirror/addon/fold/foldgutter');
require('codemirror/addon/edit/matchbrackets');

// common example code
require('./common/examples.css');
require('./common/examples');
