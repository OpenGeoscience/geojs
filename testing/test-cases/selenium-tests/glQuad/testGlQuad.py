#!/usr/bin/env python

import unittest

from selenium_test import FirefoxTest, ChromeTest, setUpModule, tearDownModule


class glQuadBase(object):
    testCase = ('glQuad',)
    testRevision = 1

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glQuad/index.html')
        self.wait()
        self.resizeWindow(640, 480)

    def testGlQuad(self):
        self.loadPage()

        testName = 'drawGlQuad'
        self.screenshotTest(testName)


class FirefoxOSM(glQuadBase, FirefoxTest):
    testCase = glQuadBase.testCase + ('firefox',)


class ChromeOSM(glQuadBase, ChromeTest):
    testCase = glQuadBase.testCase + ('chrome',)


if __name__ == '__main__':
    unittest.main()
