#!/usr/bin/env python

import unittest

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glPointsTransparentBase(object):
    testCase = ('glPointsTransparent',)
    testRevision = 6

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glPointsTransparent/index.html')
        self.wait()

    def testGlPoints(self):
        self.loadPage()

        testName = 'drawGlPointsTransparent'
        self.screenshotTest(testName)


class FirefoxOSM(glPointsTransparentBase, FirefoxTest):
    testCase = glPointsTransparentBase.testCase + ('firefox',)


class ChromeOSM(glPointsTransparentBase, ChromeTest):
    testCase = glPointsTransparentBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
