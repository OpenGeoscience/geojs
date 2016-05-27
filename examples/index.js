import 'babel-polyfill';

import '../src/vendor';
import geo from '../src/index';

// export the geo symbol for examples not using modules
window.geo = geo;

// bootstrap and themes
import 'bootstrap/dist/css/bootstrap.css';
import 'bootswatch/flatly/bootstrap.css';
import 'bootstrap';

// codemirror and plugins
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/lint/lint.css';
import 'codemirror/addon/fold/foldgutter.css';

import './common/js/jsonlint';
import 'codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/json-lint';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/edit/matchbrackets';

// common example code
import './common/css/examples.css';
import './common/js/examples';
