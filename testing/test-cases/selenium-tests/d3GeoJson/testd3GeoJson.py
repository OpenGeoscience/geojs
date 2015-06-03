#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class d3GeoJsonBase(object):
    testCase = ('d3GeoJson',)
    testRevision = 4

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('d3GeoJson/index.html')
        self.wait()

    def testd3DrawGeoJson(self):
        self.loadPage()

        testName = 'd3DrawGeoJson'
        self.screenshotTest(testName)


class FirefoxOSM(d3GeoJsonBase, FirefoxTest):
    testCase = d3GeoJsonBase.testCase + ('firefox',)


class ChromeOSM(d3GeoJsonBase, ChromeTest):
    testCase = d3GeoJsonBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
