/*jslint browser: true */
/*globals phantom */

// This PhantomJS script drives Jasmine testing by accepting a URL containing a
// Jasmine test suite, parsing that URL's contents for appropriate test report
// data, and summarizing the report on the console.
//
// This is adapted from the "run-jasmine.js" script that comes with PhantomJS.

// Parse command line arguments.
var system = require('system');
if (system.args.length !== 2) {
    console.log('Usage: run-jasmine.js URL');
    phantom.exit(1);
}

// Import PhantomJS webpage utilities.
var page = require('webpage').create();

// Extract the URL argument.
var url = system.args[1];

// Set a timeout (in milliseconds).
var timeout = 5000;

// Route "console.log()" calls from within the Page context to the main Phantom
// context (i.e.  current "this")
page.onConsoleMessage = function (msg) {
    "use strict";

    console.log(msg);
};

// Open the URL.
page.open(url, function (status) {
    "use strict";

    if (status !== "success") {
        console.log("Could not retrieve URL (" + url + ")");
        phantom.exit(1);
    } else {
        // Record the current time, for purposes of measuring the timeout.
        var start = new Date().getTime();
        setInterval(function () {
            // This function, under setInterval, repeatedly checks the test page
            // to see if any pending tests remain.  It will time out if it takes
            // too long; otherwise, it parses the page to count how many tests
            // have failed, and uses this number to indicate overall test
            // passing/failure.
            var now = new Date().getTime(),
                done,
                i,
                exitCode,
                reporterDone;

            // If the test has timed out bail out with an error.
            if (now - start > timeout) {
                console.log("error: test timed out");
                phantom.exit(1);
            }

            // Examine the page to see if the tests are still running.
            done = page.evaluate(function () {
                return window.jsApiReporter && window.jsApiReporter.finished;
            });

            reporterDone = page.evaluate(function () {
                return document.body.className === 'reporter-done';
            });

            // If the tests are done, then count how many of them failed, print
            // some errors if applicable, and exit with an appropriate error
            // code.
            if (done && reporterDone) {
                exitCode = page.evaluate(function () {
                    var list = document.body.querySelectorAll('.results > .failures > .failed'),
                        el,
                        desc,
                        msg,
                        ret;

                    if (list && list.length > 0) {
                        console.log('');
                        console.log(list.length + ' test(s) FAILED:');
                        for (i = 0; i < list.length; i += 1) {
                            el = list[i];
                            desc = el.querySelector('.description');
                            msg = el.querySelector('.result-message');

                            console.log('');
                            console.log(desc.innerText);
                            console.log(msg.innerText);
                            console.log('');
                        }
                        ret = 1;
                    } else {
                        console.log(document.body.querySelector('.alert > .passed.bar').innerText);
                        ret = 0;
                    }

                    return ret;
                });

                // If something goes wrong (e.g., a syntax or reference error in
                // the JavaScript), print an error and set a non-zero exit code.
                if (exitCode === null) {
                    console.log("unexpected error: test did not run properly");
                    exitCode = 1;
                }

                // Indicate test passing/failure to the runner.
                phantom.exit(exitCode);
            }
        }, 100);
    }

    // (Intentionally "fall off the end" here, so that setInterval() can run the
    // page poller above.)
});
