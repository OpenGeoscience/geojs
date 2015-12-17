#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glLinesBase(object):
    testCase = ('glLines',)
    testRevision = 9

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glLines/index.html')
        self.wait()
        self.resizeWindow(640, 480)

    def testGlLines(self):
        self.loadPage()

        testName = 'drawGlLines'
        self.screenshotTest(testName)


class FirefoxOSM(glLinesBase, FirefoxTest):
    testCase = glLinesBase.testCase + ('firefox',)


class ChromeOSM(glLinesBase, ChromeTest):
    testCase = glLinesBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
