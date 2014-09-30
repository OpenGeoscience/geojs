#!/usr/bin/env python

import unittest

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glPointSpritesBase(object):
    testCase = ('glPointSprites',)
    testRevision = 1

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glPointSprites/index.html')
        self.wait()

    def testGlPointSprites(self):
        self.loadPage()

        testName = 'drawGlPointSprites'
        self.screenshotTest(testName)


@unittest.skip("Initial zoom currently not working")
class FirefoxOSM(glPointSpritesBase, FirefoxTest):
    testCase = glPointSpritesBase.testCase + ('firefox',)


@unittest.skip("Initial zoom currently not working")
class ChromeOSM(glPointSpritesBase, ChromeTest):
    testCase = glPointSpritesBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
