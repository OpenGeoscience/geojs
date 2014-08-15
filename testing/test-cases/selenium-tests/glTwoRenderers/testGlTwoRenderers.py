#!/usr/bin/env python

import os
import time
import unittest

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glTwoRenderersBase(object):
    testCase = ('glTwoRenderers',)

    def loadPage(self):
        self.resizeWindow(1600, 1400)
        self.loadURL('glTwoRenderers/index.html')
        self.wait()

    def testGlTwoRenderers(self):
        self.loadPage()

        testName = 'drawGlTwoRenderers'
        self.screenshotTest(testName, revision=1)


@unittest.skip("Initial zoom currently not working")
class FirefoxOSM(glTwoRenderersBase, FirefoxTest):
    testCase = glTwoRenderersBase.testCase + ('firefox',)


@unittest.skip("Initial zoom currently not working")
class ChromeOSM(glTwoRenderersBase, ChromeTest):
    testCase = glTwoRenderersBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
