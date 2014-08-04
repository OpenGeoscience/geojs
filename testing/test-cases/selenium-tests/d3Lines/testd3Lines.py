#!/usr/bin/env python

import os
import time

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class d3LinesBase(object):
    testCase = ('d3Lines',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('d3Lines/index.html')
        self.wait()
        time.sleep(1)

    def testd3DrawLines(self):
        self.loadPage()

        testName = 'd3DrawLines'
        self.screenshotTest(testName, revision=3)


class FirefoxOSM(d3LinesBase, FirefoxTest):
    testCase = d3LinesBase.testCase + ('firefox',)


class ChromeOSM(d3LinesBase, ChromeTest):
    testCase = d3LinesBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
