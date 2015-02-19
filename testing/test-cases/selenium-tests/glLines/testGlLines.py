#!/usr/bin/env python

import unittest

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glLinesBase(object):
    testCase = ('glLines',)
    testRevision = 6

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


class ChromeOSM(glLinesBase, ChromeTest):
    testCase = glLinesBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
