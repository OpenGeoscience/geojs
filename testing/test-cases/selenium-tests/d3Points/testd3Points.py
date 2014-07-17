#!/usr/bin/env python

import os
import time

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class osmBase(object):
    testCase = ('d3Points',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('d3Points/index.html')
        self.wait()
        time.sleep(1)

    def testd3DrawPoints(self):
        self.loadPage()

        testName = 'd3DrawPoints'
        self.screenshotTest(testName, revision=2)


class FirefoxOSM(osmBase, FirefoxTest):
    testCase = osmBase.testCase + ('firefox',)


class ChromeOSM(osmBase, ChromeTest):
    testCase = osmBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
