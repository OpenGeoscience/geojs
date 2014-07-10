#!/usr/bin/env python

import os
import time

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class osmBase(object):
    testCase = ('glLines',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glLines/index.html')
        self.wait()

    def testGlPoints(self):
        self.loadPage()

        time.sleep(1)  # wait for data to load

        testName = 'd3DrawGlLines'
        self.screenshotTest(testName, revision=1)


class FirefoxOSM(osmBase, FirefoxTest):
    testCase = osmBase.testCase + ('firefox',)


class ChromeOSM(osmBase, ChromeTest):
    testCase = osmBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
