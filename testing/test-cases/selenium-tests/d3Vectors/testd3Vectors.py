#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class d3VectorsBase(object):
    testCase = ('d3Vectors',)
    testRevision = 6

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('d3Vectors/index.html')
        self.wait()

    def testd3DrawVectors(self):
        self.loadPage()

        testName = 'd3DrawVectorss'
        self.screenshotTest(testName)


class FirefoxOSM(d3VectorsBase, FirefoxTest):
    testCase = d3VectorsBase.testCase + ('firefox',)


class ChromeOSM(d3VectorsBase, ChromeTest):
    testCase = d3VectorsBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
