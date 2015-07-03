#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class osmBase(object):
    testCase = ('multipleMaps',)
    testRevision = 2

    def loadPage(self):
        self.resizeWindow(320, 480)
        self.loadURL('multipleMaps/index.html')
        self.wait()

    def test_2map_draw(self):
        testName = 'twoMapDraw'
        self.loadPage()
        self.screenshotTest(testName)


class FirefoxOSM(osmBase, FirefoxTest):
    testCase = osmBase.testCase + ('firefox',)


class ChromeOSM(osmBase, ChromeTest):
    testCase = osmBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
