#!/usr/bin/env python

import os
import time
import unittest

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class osmBase(object):
    testCase = ('glPointSprites',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glPointSprites/index.html')
        self.wait()

    def testGlPointSprites(self):
        self.loadPage()

        time.sleep(1)  # wait for data to load

        testName = 'drawGlPointSprites'
        self.screenshotTest(testName, revision=1)


@unittest.skip("Initial zoom currently not working")
class FirefoxOSM(osmBase, FirefoxTest):
    testCase = osmBase.testCase + ('firefox',)


@unittest.skip("Initial zoom currently not working")
class ChromeOSM(osmBase, ChromeTest):
    testCase = osmBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
