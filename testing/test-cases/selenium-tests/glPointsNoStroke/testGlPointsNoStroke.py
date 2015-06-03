#!/usr/bin/env python

import unittest

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glPointsNoStrokeBase(object):
    testCase = ('glPointsNoStroke',)
    testRevision = 6

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glPointsNoStroke/index.html')
        self.wait()

    def testGlPoints(self):
        self.loadPage()

        testName = 'drawGlPointsNoStroke'
        self.screenshotTest(testName)


class FirefoxOSM(glPointsNoStrokeBase, FirefoxTest):
    testCase = glPointsNoStrokeBase.testCase + ('firefox',)


class ChromeOSM(glPointsNoStrokeBase, ChromeTest):
    testCase = glPointsNoStrokeBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
