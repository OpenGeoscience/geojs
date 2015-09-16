#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule

class choroplethBase(object):
    testCase = ('choropleth',)
    testRevision = 1

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('choropleth/index.html')
        self.wait()
        self.resizeWindow(640, 480)

    def testChoroplethRender(self):
        self.loadPage()
        self.screenshotTest('renderChoropleth')

class FirefoxOSM(choroplethBase, FirefoxTest):
    testCase = choroplethBase.testCase + ('firefox',)


class ChromeOSM(choroplethBase, ChromeTest):
    testCase = choroplethBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
