#!/usr/bin/env python

import os
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
        self.runScript('window.animateForward(15);')
        self.screenshotTest(testName, revision=5)

    def testd3AnimateBackward(self):
        self.loadPage()

        testName = 'd3AnimateFrame75'
        self.runScript('window.animateForward(80);')
        self.runScript('window.animateBackward(5);')
        self.screenshotTest(testName, revision=5)

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
        self.screenshotTest(testName, revision=5)


class FirefoxOSM(d3AnimationBase, FirefoxTest):
    testCase = d3AnimationBase.testCase + ('firefox',)


class ChromeOSM(d3AnimationBase, ChromeTest):
    testCase = d3AnimationBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
