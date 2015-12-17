#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class base(object):
    testCase = ('jqueryPlugin',)
    testRevision = 5

    def loadPage(self):
        self.resizeWindow(800, 600)
        self.loadURL('jqueryPlugin/index.html')
        self.wait()
        self.resizeWindow(800, 600)

    def test_jquery_draw(self):
        self.loadPage()
        self.screenshotTest('jquery-plugin-draw')

    def test_jquery_swap_tiles(self):
        self.loadPage()
        self.runScript('window.swapTiles(function () { window.swapDone = true; });')
        self.wait('window.swapDone')
        self.screenshotTest('jquery-swap-tiles')

class FirefoxOSM(base, FirefoxTest):
    testCase = base.testCase + ('firefox',)


class ChromeOSM(base, ChromeTest):
    testCase = base.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
