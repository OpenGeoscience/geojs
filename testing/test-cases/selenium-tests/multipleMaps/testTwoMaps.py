#!/usr/bin/env python

import unittest

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class osmBase(object):
    testCase = ('multipleMaps',)
    testRevision = 1

    def loadPage(self):
        self.resizeWindow(640, 960)
        self.loadURL('multipleMaps/index.html')
        self.wait()

    def test_2map_draw(self):
        testName = 'twoMapDraw'
        self.loadPage()
        self.screenshotTest(testName)


@unittest.skip("multiple maps support broken")
class FirefoxOSM(osmBase, FirefoxTest):
    testCase = osmBase.testCase + ('firefox',)


@unittest.skip("multiple maps support broken")
class ChromeOSM(osmBase, ChromeTest):
    testCase = osmBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
