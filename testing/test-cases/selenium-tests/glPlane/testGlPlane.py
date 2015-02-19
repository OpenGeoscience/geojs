#!/usr/bin/env python

import unittest

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glPlaneBase(object):
    testCase = ('glPlane',)
    testRevision = 1

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glPlane/index.html')
        self.wait()

    def testGlPlane(self):
        self.loadPage()

        testName = 'drawGlPlane'
        self.screenshotTest(testName)


class FirefoxOSM(glPlaneBase, FirefoxTest):
    testCase = glPlaneBase.testCase + ('firefox',)


class ChromeOSM(glPlaneBase, ChromeTest):
    testCase = glPlaneBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
