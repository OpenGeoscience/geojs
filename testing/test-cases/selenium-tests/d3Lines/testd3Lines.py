#!/usr/bin/env python

import os
import time

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class osmBase(object):
    testCase = ('d3Lines',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('d3Lines/index.html')
        self.wait()
        self.drag('#map', (225, 125))
        time.sleep(2)

    def testd3DrawLines(self):
        self.loadPage()

        testName = 'd3DrawLines'
        self.screenshotTest(testName, revision=1)


class FirefoxOSM(osmBase, FirefoxTest):
    testCase = osmBase.testCase + ('firefox',)


class ChromeOSM(osmBase, ChromeTest):
    testCase = osmBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
