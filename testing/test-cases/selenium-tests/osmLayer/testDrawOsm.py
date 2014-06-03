#!/usr/bin/env python

import os
import time

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class osmBase(object):
    testCase = ('osmLayer',)

    def loadPage(self):
        self.loadURL('osmLayer/index.html')
        self.wait()
        self.resizeWindow(640, 480)
        time.sleep(0.1)

    def test_osm_draw(self):
        testName = 'osmDraw'
        self.loadPage()
        self.screenshotTest(testName)

    def test_osm_pan(self):
        testName = 'osmPan'
        self.loadPage()
        self.drag('#map', (200, 150))
        time.sleep(1)  # wait for tiles to load
        self.screenshotTest(testName)


class FirefoxOSM(osmBase, FirefoxTest):
    testCase = osmBase.testCase + ('firefox',)


class ChromeOSM(osmBase, ChromeTest):
    testCase = osmBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
