#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glPointsBase(object):
    testCase = ('pointClustering',)
    testRevision = 6

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('pointClustering/index.html')
        self.wait()

    def testClustering0(self):
        self.loadPage()
        self.screenshotTest('zoom0')

    def testClustering2(self):
        self.loadPage()
        self.runScript(
            'myMap.zoom(3); myMap.center({x: -99, y: 40});'
        )
        self.screenshotTest('zoom2')


class FirefoxOSM(glPointsBase, FirefoxTest):
    testCase = glPointsBase.testCase + ('firefox',)


class ChromeOSM(glPointsBase, ChromeTest):
    testCase = glPointsBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
