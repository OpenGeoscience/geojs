#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class mapCenter(object):
    testCase = ('mapCenter',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('mapCenter/index.html')
        self.wait()

    def test_map_center(self):
        testName = 'mapCenter'
        self.loadPage()
        self.screenshotTest(testName)


class FirefoxMapCenter(mapCenter, FirefoxTest):
    testCase = mapCenter.testCase + ('firefox',)
    testRevision = 3


class ChromeMapCenter(mapCenter, ChromeTest):
    testCase = mapCenter.testCase + ('chrome',)
    testRevision = 4


if __name__ == '__main__':
    import unittest
    unittest.main()
