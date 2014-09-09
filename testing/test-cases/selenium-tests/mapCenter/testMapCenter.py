#!/usr/bin/env python

import os
import time

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class mapCenter(object):
    testCase = ('mapCenter',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('mapCenter/index.html')
        self.wait()

    def test_map_center(self):
        testName = 'mapCenter'
        self.loadPage()
        self.screenshotTest(testName, revision=3)


class FirefoxMapCenter(mapCenter, FirefoxTest):
    testCase = mapCenter.testCase + ('firefox',)


class ChromeMapCenter(mapCenter, ChromeTest):
    testCase = mapCenter.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
