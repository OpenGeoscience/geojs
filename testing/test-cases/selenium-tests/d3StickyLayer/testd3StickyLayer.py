#!/usr/bin/env python

import os
import time

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class d3StickyBase(object):
    testCase = ('d3StickyLayer',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('d3StickyLayer/index.html')
        self.wait()

    def testDrag(self):
        testName = 'dragPoints'
        self.loadPage()

        self.drag('#map', (100, 100))
        time.sleep(2)
        self.screenshotTest(testName, revision=2)


class FirefoxOSM(d3StickyBase, FirefoxTest):
    testCase = d3StickyBase.testCase + ('firefox',)


class ChromeOSM(d3StickyBase, ChromeTest):
    testCase = d3StickyBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
