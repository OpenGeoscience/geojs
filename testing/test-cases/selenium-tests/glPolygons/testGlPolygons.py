#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glPolygonsBase(object):
    testCase = ('glPolygons',)
    testRevision = 1

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glPolygons/index.html')
        self.wait()

    def testGlLines(self):
        self.loadPage()

        testName = 'drawGlPolygons'
        self.screenshotTest(testName)


class FirefoxOSM(glPolygonsBase, FirefoxTest):
    testCase = glPolygonsBase.testCase + ('firefox',)


class ChromeOSM(glPolygonsBase, ChromeTest):
    testCase = glPolygonsBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
