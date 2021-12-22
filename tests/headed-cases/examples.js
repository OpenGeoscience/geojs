/* In each examples/<path>/example.json, if there is a top-level key called
 * "tests", this will run a test on that example.  This key is an array of
 * tests, each of which is an object with the following optional values:
 *   Partial example:
 * "tests": [{
 *   "description": "test name",  // a description of the test
 *   "htmlvideo": false,          // if true, the test browser must support
 *                                //  video, or the test is skipped.
 *   "idle": [                    // a list of idle functions or deferreds
 *     "map.onIdle"               // an example idle function that will be
 *   ],                           //  passed a function to call when idle
 *   "wait": [                    // a list of expressions that will block
 *                                //  until they don't throw errors and
 *                                //  evaluate to truthy
 *     "map.layers().length >= 1" // an example wait expression
 *   ],
 *   "tests": [                   // a list of expressions that must evaluate
 *                                //  to truthy for the tests to pass.
 *     "map.layers()[0] instanceof geo.tileLayer"  // an example of a test
 *   ]
 * }]
 */

/* Find all examples. */
var examples = require.context('../../examples', true, /\/example.json$/);

describe('examples', function () {
  'use strict';

  var $ = require('jquery');

  var imageTest = require('../image-test');

  beforeEach(function () {
    imageTest.prepareIframeTest();
  });

  /* Test each example */
  examples.keys().forEach(function (examplePath) {
    var example;
    try {
      example = $.ajax({url: '/examples/' + examplePath, dataType: 'json', async: false}).responseJSON;
    } catch (err) {
      return;
    }
    if (!example || !example.tests) {
      return;
    }
    var exampleName = examplePath.split('/')[1];
    example.tests.forEach(function (test, idx) {
      describe('Test ' + exampleName, function () {
        /* Load the example in the test iframe */
        beforeEach(function (done) {
          sinon.stub(console, 'warn').callsFake(function () {});
          $('#map').one('load', function () {
            /* allow logging to percolate through to our test environment */
            $('iframe#map')[0].contentWindow.console = console;
            window.setTimeout(done, 1);
          });
          $('#map').attr('src', '/examples/' + exampleName + '/index.html' + (test.query ? '?' + test.query : ''));
        }, 150000);
        afterEach(function () {
          console.warn.restore();
        });
        it(test.description || ('Test ' + idx), function (done) {
          /* Never complain if there are no explicit expect statements */
          expect().nothing();
          /* If a test requires html video and the current browser doesn't
           * support video, skip the test. */
          if (test.htmlvideo && !$('iframe#map')[0].contentWindow.HTMLVideoElement) {
            done();
            return;
          }
          var exampleWindow = $('iframe#map')[0].contentWindow,
              ex$ = exampleWindow.$,
              deferreds = [];
          /* Description of the current example and test. */
          var desc = $('iframe#map')[0].contentWindow.document.title + (test.description ? ' - ' + test.description : '');
          /* Evaluate and wait for each idle function and promises. */
          (test.idle || []).forEach(function (idleFunc) {
            var defer = ex$.Deferred();
            deferreds.push(defer);
            var interval;
            interval = exampleWindow.setInterval(function () {
              var idle;
              try {
                idle = exampleWindow.eval(idleFunc);
              } catch (err) { }
              if (idle) {
                exampleWindow.clearInterval(interval);
                if (!ex$.isFunction(idle)) {
                  idle = idle.then || idle.done;
                }
                idle(function () {
                  defer.resolve();
                });
              }
            }, 10);
          });
          (test.wait || []).forEach(function (waitCondition) {
            var defer = ex$.Deferred();
            deferreds.push(defer);
            var interval;
            interval = exampleWindow.setInterval(function () {
              var result;
              try {
                result = exampleWindow.eval(waitCondition);
              } catch (err) { }
              if (result) {
                exampleWindow.clearInterval(interval);
                defer.resolve();
              }
            }, 10);
          });
          /* When all idle functions and wait conditions have resolved,
           * evaluate each test in the tests list. */
          ex$.when.apply(ex$, deferreds).then(function () {
            var subtestDeferreds = [];
            (test.tests || []).forEach(function (testExp) {
              /* The test expression can return a value or a promise.  We
               * use jQuery's when to generically get the results in a
               * resolution function.  A rejection is a failure. */
              try {
                var testResult = exampleWindow.eval(testExp);
              } catch (err) {
                fail(desc + ' -> raised an error: ' + err);
                return;
              }
              var subtestDefer = ex$.when(testResult).then(function (result) {
                /* If the result isn't truthy, make sure our expect has a
                 * description telling which test block and specific test
                 * failed. */
                expect(result).toBeTruthy(desc + ' -> ' + testExp);
              }, function () {
                fail(desc + ' promise failed -> ' + testExp);
              });
              subtestDeferreds.push(subtestDefer);
            });
            ex$.when.apply(ex$, subtestDeferreds).then(done);
          }, function () {
            fail(desc + ' -> idle functions were rejected');
          });
        }, 150000);
      });
    });
  });
});
