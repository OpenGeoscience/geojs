#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class parallelProjectionBase(object):
    testCase = ('parallelProjection',)
    testRevision = 1

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('parallelProjection/index.html')
        self.wait()
        self.resizeWindow(640, 480)

    def testParallelProjection(self):
        self.loadPage()

        testName = 'drawParallelProjection'
        self.screenshotTest(testName)


class FirefoxOSM(parallelProjectionBase, FirefoxTest):
    testCase = parallelProjectionBase.testCase + ('firefox',)


class ChromeOSM(parallelProjectionBase, ChromeTest):
    testCase = parallelProjectionBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
