#!/usr/bin/env python

import unittest

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glPlaneBase(object):
    testCase = ('glPlane',)
    testRevision = 1

    def loadPage(self, opacity=None):
        self.resizeWindow(640, 480)
        if opacity is None:
            self.loadURL('glPlane/index.html')
        else:
            self.loadURL('glPlane/index.html?opacity=' + str(opacity))
        self.wait()

    def testGlPlane(self):
        self.loadPage()

        testName = 'drawGlPlane'
        self.screenshotTest(testName)

    def testGlPlaneOpacity(self):
        self.loadPage(0.4)

        testName = 'drawGlPlaneOpacity'
        self.screenshotTest(testName)


class FirefoxOSM(glPlaneBase, FirefoxTest):
    testCase = glPlaneBase.testCase + ('firefox',)


class ChromeOSM(glPlaneBase, ChromeTest):
    testCase = glPlaneBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
