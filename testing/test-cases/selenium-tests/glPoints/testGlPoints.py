#!/usr/bin/env python

import os
import time

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class osmBase(object):
    testCase = ('glPoints',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glPoints/index.html')
        self.wait()

        self.drag('#map', (225, 125))
        time.sleep(1)
        self.drag('#map', (225, 125))
        time.sleep(1)
        self.drag('#map', (225, 0))

    def testGlPoints(self):
        self.loadPage()

        time.sleep(1)  # wait for data to load

        testName = 'd3DrawGlPoints'
        self.screenshotTest(testName, revision=1)


class FirefoxOSM(osmBase, FirefoxTest):
    testCase = osmBase.testCase + ('firefox',)


class ChromeOSM(osmBase, ChromeTest):
    testCase = osmBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
