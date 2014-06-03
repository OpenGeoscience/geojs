/*global blanket, $, window*/
(function () {
    
    var blanket = window.blanket;
    window.stopTest = function (totalTested, totalPassed, done) {
        totalTested = totalTested === undefined ? 1 : totalTested;
        totalPassed = totalPassed === undefined ? 1 : totalPassed;
        if (blanket) {
          blanket.onTestDone(totalTested, totalPassed);
          blanket.onTestsDone();
        }
        if (done) {
            done();
        }
    };

    function run () {
      if (window.startTest) {
        window.startTest(function () {
          window.testComplete = true;
        });
      }
    }

    window.testComplete = false;
    if (blanket) {
        $(function () {
            // on window load setup coverage and run test
            blanket.setupCoverage();
            blanket.onTestStart();
        });

        blanket.beforeStartTestRunner({
            callback: run
        });
    } else {
      $(run);
    }

}());
