#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glLinesBase(object):
    testCase = ('glLines',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glLines/index.html')
        self.wait()

    def testGlLines(self):
        self.loadPage()

        testName = 'drawGlLines'
        self.screenshotTest(testName)


class FirefoxOSM(glLinesBase, FirefoxTest):
    testCase = glLinesBase.testCase + ('firefox',)
    testRevision = 3


class ChromeOSM(glLinesBase, ChromeTest):
    testCase = glLinesBase.testCase + ('chrome',)
    testRevision = 4


if __name__ == '__main__':
    import unittest
    unittest.main()
