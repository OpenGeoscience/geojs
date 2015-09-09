#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glPointsNoFillBase(object):
    testCase = ('glPointsNoFill',)
    testRevision = 8

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glPointsNoFill/index.html')
        self.wait()
        self.resizeWindow(640, 480)

    def testGlPoints(self):
        self.loadPage()

        testName = 'drawGlPointsNoFill'
        self.screenshotTest(testName)


class FirefoxOSM(glPointsNoFillBase, FirefoxTest):
    testCase = glPointsNoFillBase.testCase + ('firefox',)


class ChromeOSM(glPointsNoFillBase, ChromeTest):
    testCase = glPointsNoFillBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
