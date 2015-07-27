#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class d3StickyBase(object):
    testCase = ('d3StickyLayer',)

    def waitForIdle(self, timeout=5):
        self.runScript(
            'window._wait = false; window.gjsmap.onIdle(function () {window._wait = true;});'
        )
        self.wait(variable='window._wait', timeout=timeout)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('d3StickyLayer/index.html')
        self.wait()
        self.resizeWindow(640, 480)

    def testDrag(self):
        testName = 'dragPoints'
        self.loadPage()

        self.drag('#map', (100, 100))
        self.waitForIdle()
        self.screenshotTest(testName)


class FirefoxOSM(d3StickyBase, FirefoxTest):
    testCase = d3StickyBase.testCase + ('firefox',)
    testRevision = 6


class ChromeOSM(d3StickyBase, ChromeTest):
    testCase = d3StickyBase.testCase + ('chrome',)
    testRevision = 7


if __name__ == '__main__':
    import unittest
    unittest.main()
