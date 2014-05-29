/*global blanket, $, window*/
(function () {
    
    window.stopTest = function (totalTested, totalPassed, done) {
        totalTested = totalTested === undefined ? 1 : totalTested;
        totalPassed = totalPassed === undefined ? 1 : totalPassed;
        blanket.onTestDone(totalTested, totalPassed);
        blanket.onTestsDone();
        if (done) {
            done();
        }
    };

    if (blanket) {
        window.testComplete = false;
        $(function () {
            // on window load setup coverage and run test
            blanket.setupCoverage();
            blanket.onTestStart();
        });

        if (window.startTest) {
            blanket.beforeStartTestRunner({
                callback: function () {
                    window.startTest(function () {
                        window.testComplete = true;
                    });
                }
            });
        }
    }

}());
