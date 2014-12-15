#!/usr/bin/env python

import time

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class d3AnimationBase(object):
    testCase = ('d3Animation',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('d3Animation/index.html')
        self.wait()
        time.sleep(1)

    def testd3AnimateForward(self):
        self.loadPage()

        testName = 'd3AnimateFrame15'
        self.runScript(
            '''
                window.animateForward(15, function () {
                    window.animateForwardFinished = true;
                });
            '''
        )
        self.wait('window.animateForwardFinished')
        self.screenshotTest(testName)

    def testd3AnimateBackward(self):
        self.loadPage()

        testName = 'd3AnimateFrame75'
        self.runScript('window.animateForward(80);')
        self.runScript(
            '''
                window.animateBackward(5, function () {
                    window.animateBackwardFinished = true;
                });
            '''
        )
        self.wait('window.animateBackwardFinished')
        self.screenshotTest(testName)

    def testd3AnimateToEnd(self):
        self.loadPage()

        testName = 'd3AnimateEnd'
        self.runScript(
            '''window.animateToEnd(function () {
                   window.animationTestFinished = true;
            });
            '''
        )
        self.wait('window.animationTestFinished')
        self.screenshotTest(testName)


class FirefoxOSM(d3AnimationBase, FirefoxTest):
    testCase = d3AnimationBase.testCase + ('firefox',)
    testRevision = 7


class ChromeOSM(d3AnimationBase, ChromeTest):
    testCase = d3AnimationBase.testCase + ('chrome',)
    testRevision = 8


if __name__ == '__main__':
    import unittest
    unittest.main()
