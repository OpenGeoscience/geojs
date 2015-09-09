#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class d3LinesBase(object):
    testCase = ('d3Lines',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('d3Lines/index.html')
        self.wait()
        self.resizeWindow(640, 480)

    def testd3DrawLines(self):
        self.loadPage()

        testName = 'd3DrawLines'
        self.screenshotTest(testName)


class FirefoxOSM(d3LinesBase, FirefoxTest):
    testCase = d3LinesBase.testCase + ('firefox',)
    testRevision = 8


class ChromeOSM(d3LinesBase, ChromeTest):
    testCase = d3LinesBase.testCase + ('chrome',)
    testRevision = 9


if __name__ == '__main__':
    import unittest
    unittest.main()
