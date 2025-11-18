require('../src/vendor');
window.geo = require('../src/index');

// bootstrap and themes
require('../website/legacycss/bootstrap3.min.css');
require('../website/legacycss/bootswatch_flatly3.min.css');
require('@fontsource/lato');
window.bootstrap = require('bootstrap/dist/js/bootstrap.bundle');

// codemirror and plugins
window.jsonlint = require('jsonlint-mod');
require('codemirror/lib/codemirror.css');
require('codemirror/addon/lint/lint.css');
require('codemirror/addon/fold/foldgutter.css');

require('codemirror');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/css/css');
require('codemirror/mode/htmlmixed/htmlmixed');
require('codemirror/addon/lint/lint');
require('codemirror/addon/lint/json-lint');
require('codemirror/addon/fold/brace-fold');
require('codemirror/addon/fold/foldcode');
require('codemirror/addon/fold/foldgutter');
require('codemirror/addon/edit/matchbrackets');

// common tutorial code
require('./common/tutorials.css');
window.start_tutorial = require('./common/tutorials');
