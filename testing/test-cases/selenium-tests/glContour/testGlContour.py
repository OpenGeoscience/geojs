#!/usr/bin/env python

import urllib
from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class glContourBase(object):
    testCase = ('glContour',)
    testRevision = 4

    def loadPage(self, params=None):
        self.resizeWindow(640, 480)
        url = 'glContour/index.html'
        if params:
            url += '?' + urllib.urlencode(params)
        self.loadURL(url)
        self.wait()
        self.resizeWindow(640, 480)

    def testGlContour(self):
        self.loadPage()
        # geo from position, auto min-max, default color range, stepped
        self.screenshotTest('drawGlContour')

    def testOptionsGlContour(self):
        self.loadPage({
            'url': 'oahu-dense.json',
            'range': 'true',
            'stepped': 'false'
        })
        # geo from x0, specified min-max, set color range, smooth
        self.screenshotTest('optionsGlContour')

    def testRangeGlContour(self):
        self.loadPage({
            'url': 'oahu-dense.json',
            'range': 'nonlinear',
        })
        # geo from x0, non-linear range
        self.screenshotTest('rangeGlContour')

    def testIsoGlContour(self):
        self.loadPage({
            'url': 'oahu-dense.json',
            'range': 'iso',
        })
        # geo from x0, iso-like range
        self.screenshotTest('isoGlContour')


class FirefoxOSM(glContourBase, FirefoxTest):
    testCase = glContourBase.testCase + ('firefox',)


class ChromeOSM(glContourBase, ChromeTest):
    testCase = glContourBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
