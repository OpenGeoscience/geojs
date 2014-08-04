#!/usr/bin/env python

import os
import time
import unittest

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glPlaneBase(object):
    testCase = ('glPlane',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glPlane/index.html')
        self.wait()

    def testGlPlane(self):
        self.loadPage()

        time.sleep(1)  # wait for data to load

        testName = 'drawGlPlane'
        self.screenshotTest(testName, revision=1)


@unittest.skip("Initial zoom currently not working")
class FirefoxOSM(glPlaneBase, FirefoxTest):
    testCase = glPlaneBase.testCase + ('firefox',)


@unittest.skip("Initial zoom currently not working")
class ChromeOSM(glPlaneBase, ChromeTest):
    testCase = glPlaneBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
