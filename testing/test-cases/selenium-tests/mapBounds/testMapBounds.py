#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class Base(object):
    testCase = ('mapBounds',)
    testRevision = 4

    def loadPage(self):
        self.resizeWindow(1024, 600)
        self.loadURL('mapBounds/index.html')
        self.wait()
        self.resizeWindow(1024, 600)

    def test_set_bounds(self):
        testName = 'set_new_bounds'
        self.loadPage()
        self.screenshotTest(testName)


class FirefoxTestCls(Base, FirefoxTest):
    testCase = Base.testCase + ('firefox',)


class ChromeTestCls(Base, ChromeTest):
    testCase = Base.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
