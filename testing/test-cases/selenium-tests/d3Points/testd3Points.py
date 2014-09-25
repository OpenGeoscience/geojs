#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class d3PointsBase(object):
    testCase = ('d3Points',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('d3Points/index.html')
        self.wait()

    def testd3DrawPoints(self):
        self.loadPage()

        testName = 'd3DrawPoints'
        self.screenshotTest(testName)


class FirefoxOSM(d3PointsBase, FirefoxTest):
    testCase = d3PointsBase.testCase + ('firefox',)
    testRevision = 3


class ChromeOSM(d3PointsBase, ChromeTest):
    testCase = d3PointsBase.testCase + ('chrome',)
    testRevision = 4


if __name__ == '__main__':
    import unittest
    unittest.main()
