#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glPointsBase(object):
    testCase = ('glPoints',)
    testRevision = 8

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glPoints/index.html')
        self.wait()
        self.resizeWindow(640, 480)

    def testGlPoints(self):
        self.loadPage()

        testName = 'drawGlPoints'
        self.screenshotTest(testName)


class FirefoxOSM(glPointsBase, FirefoxTest):
    testCase = glPointsBase.testCase + ('firefox',)


class ChromeOSM(glPointsBase, ChromeTest):
    testCase = glPointsBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
