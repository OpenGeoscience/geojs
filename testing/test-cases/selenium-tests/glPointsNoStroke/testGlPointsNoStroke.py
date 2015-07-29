#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glPointsNoStrokeBase(object):
    testCase = ('glPointsNoStroke',)
    testRevision = 7

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glPointsNoStroke/index.html')
        self.wait()
        self.resizeWindow(640, 480)

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
