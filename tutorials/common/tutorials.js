var $ = require('jquery');
var pako = require('pako');
var utils = require('../../examples/common/utils');

/* Track the last selector used for generating a code block and also a timer so
 * we can avoid rendering the same codeblock if it is actively being edited. */
var processBlockInfo = {
  lastelem: null,       // debounce last element
  timer: null,          // debounce timer
  lastsrc: null,        // last set source
  srcdocSupport: null,  // boolean for iframe srcdoc support, null if untested
  defaultHTML: '<!DOCTYPE html>\n' +
    '<html>\n' +
    '<head>\n' +
    /* We could also load from the CDN:
     *   https://cdnjs.cloudflare.com/ajax/libs/geojs/0.12.2/geo.min.js
     * or the non-minified versions to make debug easier. */
    '  <script type="text/javascript" src="../../built/geo.min.js"></script>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <div id="map"></div>\n' +
    '</body>\n' +
    '</html>',
  defaultCSS: '' +
    'html,body,#map {\n' +
    '  width: 100%;\n' +
    '  height: 100%;\n' +
    '  padding: 0;\n' +
    '  margin: 0;\n' +
    '  overflow: hidden;\n' +
    '}'
};

/**
 * Make the specified code block and all of its ancestors active, then process
 * it.  If notLast is specified and the code block was already active, don't
 * disable descendants.
 *
 * @param {jQuery.selector} selector A jQuery selector of the code to
 *      activate and process.
 * @param {boolean} notLast If true, don't force this to be the last active
 *      block of code for this set.
 * @param {boolean} debounce If true, debounce the update.
 * @param {boolean} forceRun If true, rerun, even if we think it isn't
 *      necessary.
 */
function run_block(selector, notLast, debounce, forceRun) {
  var elem = $(selector).closest('.codeblock'),
      target = elem.attr('target'),
      parentstep = elem.attr('parentstep'),
      group = $('.codeblock[target="' + target + '"]'),
      activeGroup = elem,
      parents;
  if (forceRun) {
    processBlockInfo.lastsrc = '';
  }
  notLast = notLast && elem.hasClass('active');
  if (!notLast) {
    while (parentstep) {
      parents = group.filter('[step="' + parentstep + '"]');
      if (activeGroup.filter(parents).length || !parents.length) {
        break;
      }
      activeGroup = activeGroup.add(parents);
      parentstep = parents.attr('parentstep');
    }
    group.not(activeGroup).removeClass('active');
    activeGroup.addClass('active');
  }
  process_block_debounce(elem, debounce);
}

/**
 * Given a jquery selector, run the code associated with it.
 *
 * @param {jQuery.selector} selector A jQuery selector of the code to
 *      process.
 */
function process_block(selector) {
  processBlockInfo.lastelem = null;
  var elem = $(selector).closest('.codeblock'),
      target = elem.attr('target'),
      targetelem = $('#' + target),
      code = {},
      html, css, js, pos, jsurl, webgl;

  $('.codeblock[target="' + target + '"]').each(function () {
    var block = $(this),
        format = block.attr('format'),
        step = +block.attr('step'),
        val;
    if (!code[format]) {
      code[format] = [];
    }
    if (!block.hasClass('active')) {
      return;
    }
    webgl = webgl || block.attr('webgl');
    while (code[format].length <= step) {
      code[format].push('');
    }
    val = $('.CodeMirror', block).length ? $('.CodeMirror', block)[0].CodeMirror.getValue() : $('textarea', block).val();
    code[format][step] = val.trim();
  });
  $.each(code, function (key, list) {
    var processed = '';
    $.each(list, function (idx, val) {
      if (val) {
        processed += val + '\n';
      }
    });
    code[key] = processed;
  });
  html = code.html !== undefined ? code.html : processBlockInfo.defaultHTML;
  css = code.css !== undefined ? code.css : processBlockInfo.defaultCSS;
  js = code.javascript || '';
  pos = html.toLowerCase().indexOf('</head>');
  if (pos < 0) {
    pos = html.length;
  }
  if (css) {
    html = html.substr(0, pos).replace(/\s+$/, '') + '\n<style>\n' + css + '\n</style>\n' + html.substr(pos);
  }
  pos = html.toLowerCase().indexOf('</body>');
  if (pos < 0) {
    pos = html.length;
  }
  if (js) {
    /* If any code block is marked as needing webgl and the current window has
     * a geojs element that reports that it doesn't support webgl, mock webgl.
     * This is expected to only happen in the automated tests. */
    if (webgl && window.parent && window.parent !== window && window.geo && !window.geo.gl.vglRenderer.supported()) {
      js = 'geo.util.mockVGLRenderer();\n' +
           js +
           '\ngeo.util.restoreVGLRenderer();\n';
    }
    /* If we are in a test environment, redirect the tutorial's console to the
     * test's parent window to make debugging easier. */
    if (window.parent && window.parent !== window) {
      js = 'window.console = window.parent.parent.console;\n' +
           js;
    }
    html = html.substr(0, pos).replace(/\s+$/, '') + '\n<script type="text/javascript">\n' + js + '</script>\n' + html.substr(pos);
  }
  if (processBlockInfo.lastsrc !== html) {
    /* The source of the iframe can be set a variety of ways:
     * (a) targetelem.attr('src', 'data:text/html;charset=utf-8,' + escape(html));
     * (b) var blob = new Blob([html], {type: 'text/html;charset=utf-8'});
     *     targetelem.attr('src', URL.createObjectURL(blob));
     * (c) targetelem.attr('srcdoc', html);
     * Although (a) is the most compatible, it doesn't allow access to local
     * urls from within the iframe.  (c) solves this, but requires extra work
     * for browsers that don't support srcdoc. */
    processBlockInfo.lastsrc = html;
    targetelem.attr('srcdoc', html);
    if (!processBlockInfo.srcdocSupport) {
      jsurl = 'javascript: window.frameElement.getAttribute("srcdoc");';
      if (targetelem[0].contentWindow) {
        targetelem[0].contentWindow.location = jsurl;
      }
      targetelem.attr('src', jsurl);
    }
    /* Expose the frame's global variables in the 'tutorial' variable.  If
     * there are multiple tutorials (multiple iframes), then this is the last
     * one executed.  All of them will be accessible in the 'tutorials'
     * variable. */
    window.tutorial = targetelem[0].contentWindow;
    window.tutorials = window.tutorials || {};
    window.tutorials[target] = targetelem[0].contentWindow;
    elem.trigger('geojs-tutorial-run');
  }
}

/**
 * Given a jquery selector, run the code associated with it, but not too often.
 *
 * @param {jQuery.selector} selector A jQuery selector of the code to
 *      process.
 * @param {boolean} debounce If true, debounce the update.
 */
function process_block_debounce(selector, debounce) {
  if (processBlockInfo.timer) {
    window.clearTimeout(processBlockInfo.timer);
    processBlockInfo.timer = null;
  }
  if (!selector.is(processBlockInfo.lastelem) || !debounce) {
    if (processBlockInfo.lastelem && !selector.is(processBlockInfo.lastelem)) {
      process_block(processBlockInfo.lastelem);
    }
    processBlockInfo.lastelem = selector;
    if (!debounce) {
      process_block(selector);
      return;
    }
  }
  processBlockInfo.timer = window.setTimeout(function () {
    process_block(processBlockInfo.lastelem);
    processBlockInfo.timer = null;
  }, 2000);
}

/**
 * Run any default code blocks, then start listening for changes in code
 * blocks.
 */
function run_tutorial() {
  /* If any of the codeblocks is marked 'default', run them.  Do this in a
   * timeout so that other start up scripts can run */
  $('.codeblock[initial="true"]').each(function (idx, elem) {
    run_block(elem);
  });
  /* Whenever a code block changes, run it with its parents */
  $('.codeblock textarea').bind('input propertychange', function (evt) {
    run_block(evt.target, true, true);
  });
  $('.codeblock .CodeMirror').each(function () {
    $(this)[0].CodeMirror.on('change', function (elem) {
      run_block(elem.getWrapperElement(), true, true);
    });
  });
  /* Bind run and reset buttons */
  $('.codeblock_reset').click(function (evt) {
    var elem = $('textarea', $(evt.target).closest('.codeblock'));
    elem.val(elem.attr('defaultvalue'));
    $('.CodeMirror', $(evt.target).closest('.codeblock'))[0].CodeMirror.setValue(elem.attr('defaultvalue'));
    run_block(evt.target, true);
  });
  $('.codeblock_run').click(function (evt) {
    run_block(evt.target, undefined, undefined, evt.shiftKey);
  });
}

/**
 * Fill the codeblocks based on the encoded values in a query.
 *
 * @param {object} query An object as returned from `utils.getQuery()`.
 */
function fill_codeblocks(query) {
  $('.codeblock').each(function () {
    var block = $(this),
        key = 'src' + (block.attr('step') !== '1' ? block.attr('step') : '');
    if (query[key]) {
      try {
        /* Strip out white space and pluses, then convert ., -, and _ to /, +,
         * =.  By removing whitespace, the url is more robust against email
         * handling.  The others keep things short. */
        var src = atob(query[key].replace(/(\s|\+)/g, '').replace(/\./g, '/').replace(/-/g, '+').replace(/_/g, '='));
        src = pako.inflate(src, {to: 'string', raw: true});
        if ($('.CodeMirror', block).length) {
          $('.CodeMirror', block)[0].CodeMirror.setValue(src);
        } else {
          $('textarea', block).val(src);
        }
      } catch (err) { }
    }
  });
}

/**
 * Get query parameters for each step and update them as we start.  Monitor the
 * code blocks and update the url when they change if appropriate.
 *
 * @param {boolean} alwaysKeep If `true`, update the url even if the `keep` url
 *      parameter is not specified.
 */
function start_keeper(alwaysKeep) {
  var query = utils.getQuery(),
      keep = query.keep || (alwaysKeep === true),
      inPop = false;

  fill_codeblocks(query);
  if (keep) {
    $(document).on('geojs-tutorial-run', '.codeblock', function () {
      var newQuery = {};
      if (query.keep && alwaysKeep !== true) {
        newQuery.keep = query.keep;
      }
      $('.codeblock').each(function () {
        var block = $(this),
            defaultSrc = $('textarea', block).attr('defaultvalue'),
            key = 'src' + (block.attr('step') !== '1' ? block.attr('step') : '');

        var src = $('.CodeMirror', block).length ? $('.CodeMirror', block)[0].CodeMirror.getValue() : $('textarea', block).val().trim();
        if (src !== defaultSrc) {
          var comp = btoa(pako.deflate(src, {to: 'string', level: 9, raw: true}));
          /* instead of using regular base64, convert /, +, and = to ., -, and _
           * so that they don't need to be escaped on the url.  This reduces the
           * average length of the url by 6 percent. */
          comp = comp.replace(/\//g, '.').replace(/\+/g, '-').replace(/=/g, '_');
          newQuery[key] = comp;
        }
      });
      if (!inPop) {
        utils.setQuery(newQuery, true);
      }
    });
  }
  window.addEventListener('popstate', function (evt) {
    inPop = true;
    fill_codeblocks(utils.getQuery());
    run_tutorial();
    inPop = false;
  }, false);
}

/**
 * Process code blocks to remove unwanted white space and store default values,
 * set up event handling, and run any initial code blocks.
 *
 * @param {boolean} useCodeMirror If explicitly false, don't use CodeMirror.
 * @param {boolean} alwaysKeep If `true`, update the url even if the `keep` url
 *      parameter is not specified.
 */
function start_tutorial(useCodeMirror, alwaysKeep) {
  /* If we are in a test environment, redirect the test's console to the parent
   * window to make debugging easier. */
  if (window.parent && window.parent !== window) {
    window.console = window.parent.console;
  }
  /* clean up whitespace and store a default value for each code block */
  $('.codeblock').each(function () {
    var elem = $('textarea', this),
        value = elem.val().replace(/\s+$/, ''),
        lines = value.split('\n'),
        leading = lines[0].indexOf(lines[0].trim()),
        leadingSpace = lines[0].substr(0, leading);
    lines.forEach(function (line, idx) {
      if (line.substr(0, leading) === leadingSpace) {
        line = line.substr(leading);
      }
      lines[idx] = line.replace(/\s+$/, '');
    });
    value = lines.join('\n');
    elem.empty().val(value).attr('defaultvalue', value);
    elem.prop('rows', $(this).attr('rows') || lines.length);
  });
  /* Convert the text areas to CodeMirror blocks */
  if (useCodeMirror !== false) {
    $('textarea').each(function () {
      var elem = $(this),
          parent = elem.closest('.codeblock'),
          format = parent.attr('format');
      CodeMirror.fromTextArea(elem[0], {
        lineNumbers: true,
        mode: format === 'html' ? 'htmlmixed' : format
      }).setValue(elem.val());
    });
  }
  /* Check if iframe srcdoc support is present */
  processBlockInfo.srcdocSupport = !!('srcdoc' in document.createElement('iframe'));
  /* Chrome 64 introduced a change which removes some srcdoc support, so
   * mark it as unavailable in Chrome.  It would be nicer to not have user
   * agent testings, but doing this generically causes problems in Firefox
   * headless tests. */
  if (/Chrome\//.test(navigator.userAgent)) {
    processBlockInfo.srcdocSupport = false;
  }
  start_keeper(alwaysKeep);
  run_tutorial();
}

module.exports = start_tutorial;
