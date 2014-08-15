#!/usr/bin/env python

import os
import time

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class d3GraphBase(object):
    testCase = ('d3Graph',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('d3Graph/index.html')
        self.wait()

    def testd3DrawGraph(self):
        self.loadPage()

        testName = 'd3DrawGraph'
        self.screenshotTest(testName, revision=3)


class FirefoxOSM(d3GraphBase, FirefoxTest):
    testCase = d3GraphBase.testCase + ('firefox',)


class ChromeOSM(d3GraphBase, ChromeTest):
    testCase = d3GraphBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
