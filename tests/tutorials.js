/* Find all tutorials. */
var tutorials = require.context('../tutorials', true, /\/tutorial.json$/);

describe('tutorials', function () {
  'use strict';

  var $ = require('jquery');

  var imageTest = require('./image-test');

  beforeEach(function () {
    imageTest.prepareIframeTest();
  });

  /* Test each tutorial */
  tutorials.keys().forEach(function (tutorialPath) {
    var tutorialName = tutorialPath.split('/')[1];
    describe('Test ' + tutorialName, function () {
      /* Load the tutorial in the test iframe */
      beforeEach(function (done) {
        sinon.stub(console, 'warn', function () {});
        $('#map').one('load', function () { window.setTimeout(done, 1); });
        $('#map').attr('src', '/tutorials/' + tutorialName + '/index.html');
      });
      afterEach(function () {
        console.warn.restore();
      });
      it('Run tutorial tests', function (done) {
        var base$, tests;

        base$ = $('iframe#map')[0].contentWindow.jQuery;
        /* If a codeblock test requires html video and the current browser
         * doesn't support video, skip the test. */
        if (!$('iframe#map')[0].contentWindow.HTMLVideoElement && base$('.codeblock[htmlvideo]').length) {
          done();
          return;
        }
        /* Find all codeblock_tests.  We chain them together and end on the
         * function's done callback, so reverse them so that they run in the
         * order written. */
        tests = base$(base$('.codeblock_test').get().reverse());
        tests.each(function (testIdx) {
          var test = base$(this),
              codeblock = test.prevAll('.codeblock').eq(0),
              target = base$('#' + codeblock.attr('target')),
              testDefer = $.Deferred();
          testDefer.then(done);
          done = function () {
            /* When the codeblock's target has run, handle the results */
            var onCodeLoaded = function () {
              var targetWindow = target[0].contentWindow,
                  tut$ = targetWindow.$,
                  deferreds = [];
              /* Evaluate and wait for each idle function and promises. */
              test.data('idlefuncs').forEach(function (idleFunc) {
                var defer = tut$.Deferred();
                deferreds.push(defer);
                var idle = targetWindow.eval(idleFunc);
                if (!tut$.isFunction(idle)) {
                  idle = idle.then || idle.done;
                }
                idle(function () {
                  defer.resolve();
                });
              });
              /* When all idle functions have resolved, evaluate each test in
               * the test list. */
              tut$.when.apply(tut$, deferreds).fail(function () {
                throw new Error('Idle functions were rejected');
              }).then(function () {
                var subtestDeferreds = [];
                test.data('tests').forEach(function (testExp) {
                  /* The test expression can return a value or a promise.  We
                   * use jQuery's when to generically get the results in a
                   * resolution function.  A rejection is a failure. */
                  var testResult = targetWindow.eval(testExp);
                  var subtestDefer = tut$.when(testResult).done(function (result) {
                    /* If the result isn't truthy, make sure our expect has a
                     * description telling which test block and specific test
                     * failed. */
                    expect(result).toBeTruthy(test.data('description') + ' -> ' + testExp);
                  }).fail(function () {
                    expect(false).toBeTruthy(test.data('description') + ' promise failed -> ' + testExp);
                  });
                  subtestDeferreds.push(subtestDefer);
                });
                tut$.when.apply(tut$, subtestDeferreds).then(function () {
                  testDefer.resolve();
                });
              });
            };
            /* If we have already run the specific codeblock, don't run it
             * again.  If not, click run and wait for the results.  On the
             * first test (which will be the last added), always force the code
             * block to run, as it ensures that we catch the load event. */
            if (codeblock.is(base$('.codeblock.active:last')) && testIdx !== tests.length - 1) {
              onCodeLoaded();
            } else {
              target.one('load', onCodeLoaded);
              if (testIdx !== tests.length - 1) {
                codeblock.find('.codeblock_run').click();
              } else {
                var evt = base$.Event('click');
                evt.shiftKey = true;
                codeblock.find('.codeblock_run').trigger(evt);
              }
            }
          };
        });
        /* Call the first step in the chained tests */
        done();
      }, 15000);
    });
  });
});
