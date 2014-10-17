#!/usr/bin/env python

import unittest

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glPointsBase(object):
    testCase = ('glPointsTransparent',)
    testRevision = 4

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glPointsTransparent/index.html')
        self.wait()

    def testGlPoints(self):
        self.loadPage()

        testName = 'drawGlPointsTransparent'
        self.screenshotTest(testName)


@unittest.skip("Initial zoom currently not working")
class FirefoxOSM(glPointsBase, FirefoxTest):
    testCase = glPointsBase.testCase + ('firefox',)


@unittest.skip("Initial zoom currently not working")
class ChromeOSM(glPointsBase, ChromeTest):
    testCase = glPointsBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
