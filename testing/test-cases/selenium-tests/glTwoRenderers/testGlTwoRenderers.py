#!/usr/bin/env python

import unittest

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glTwoRenderersBase(object):
    testCase = ('glTwoRenderers',)
    testRevision = 2

    def loadPage(self):
        self.resizeWindow(1600, 900)
        self.loadURL('glTwoRenderers/index.html')
        self.wait()

    def testGlTwoRenderers(self):
        self.loadPage()

        testName = 'drawGlTwoRenderers'
        self.screenshotTest(testName)


class FirefoxOSM(glTwoRenderersBase, FirefoxTest):
    testCase = glTwoRenderersBase.testCase + ('firefox',)


class ChromeOSM(glTwoRenderersBase, ChromeTest):
    testCase = glTwoRenderersBase.testCase + ('chrome',)


if __name__ == '__main__':
    unittest.main()
