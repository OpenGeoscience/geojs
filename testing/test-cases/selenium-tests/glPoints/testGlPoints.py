#!/usr/bin/env python

import os
import time
import unittest

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glPointsBase(object):
    testCase = ('glPoints',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glPoints/index.html')
        self.wait()
        time.sleep(1)

    def testGlPoints(self):
        self.loadPage()

        testName = 'drawGlPoints'
        self.screenshotTest(testName, revision=2)


@unittest.skip("Initial zoom currently not working")
class FirefoxOSM(glPointsBase, FirefoxTest):
    testCase = glPointsBase.testCase + ('firefox',)


@unittest.skip("Initial zoom currently not working")
class ChromeOSM(glPointsBase, ChromeTest):
    testCase = glPointsBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
