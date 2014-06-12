#!/usr/bin/env python

import os
import time

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class osmBase(object):
    testCase = ('d3Animation',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('d3Animation/index.html')
        self.wait()
        self.drag('#map', (225, 125))
        time.sleep(1)

    def testd3AnimateForward(self):
        self.loadPage()

        testName = 'd3AnimateFrame15'
        self.runScript('window.animateForward(15);')
        self.screenshotTest(testName, revision=1)

    def testd3AnimateBackward(self):
        self.loadPage()

        testName = 'd3AnimateFrame75'
        self.runScript('window.animateForward(80);')
        self.runScript('window.animateBackward(5);')
        self.screenshotTest(testName, revision=1)

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
        self.screenshotTest(testName, revision=1)


class FirefoxOSM(osmBase, FirefoxTest):
    testCase = osmBase.testCase + ('firefox',)


class ChromeOSM(osmBase, ChromeTest):
    testCase = osmBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
