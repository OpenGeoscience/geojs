#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class LayerReorder(FirefoxTest):
    testCase = ('LayerReorder',)
    testRevision = 1

    def testReorder(self):
        self.resizeWindow(640, 480)
        self.loadURL('layerReorder/index.html')
        self.wait()

        self.screenshotTest('1-2-3')

        self.runScript('window.layerOrder(10, 9, 11);')
        self.screenshotTest('2-1-3')

        self.runScript('window.layerOrder(10, 12, 11);')
        self.screenshotTest('1-3-2')

        self.runScript('window.layerOrder(15, 14, 13);')
        self.screenshotTest('3-2-1')


if __name__ == '__main__':
    import unittest
    unittest.main()
