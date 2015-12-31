/* These are functions we want available to jasmine tests. */
/* global it */
/* exported waitForIt */

/**
 * Create a pair of it functions.  The first one waits for a function to return
 * a truthy value, and the second one runs after the first has assured its
 * completion.  This needs to be run within a describe block and not within
 * another it function.
 *
 * @param {string} desc a description of the task.
 * @param {function} testFunc a function that returns true when the
 *                            specification is complete.
 */
function waitForIt(desc, testFunc) {
  'use strict';
  it('wait for ' + desc, function (done) {
    var interval;
    interval = setInterval(function () {
      if (testFunc()) {
        clearInterval(interval);
        done();
      }
    }, 1);
  });
  it('done waiting for ' + desc, function () {
  });
}
