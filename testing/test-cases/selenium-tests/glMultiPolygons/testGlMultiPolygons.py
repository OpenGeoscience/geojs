#!/usr/bin/env python
from selenium_test import FirefoxTest, ChromeTest


class glMultiPolygonsBase(object):
    testCase = ('glMultiPolygons',)
    testRevision = 2

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glMultiPolygons/index.html')
        self.wait()
        self.resizeWindow(640, 480)

    def testGlMultiPolygons(self):
        self.loadPage()

        testName = 'drawGlMultiPolygons'
        self.screenshotTest(testName, revision=self.testRevision)


class FirefoxOSM(glMultiPolygonsBase, FirefoxTest):
    testCase = glMultiPolygonsBase.testCase + ('firefox',)


class ChromeOSM(glMultiPolygonsBase, ChromeTest):
    testCase = glMultiPolygonsBase.testCase + ('chrome',)

if __name__ == '__main__':
    import unittest
    unittest.main()
