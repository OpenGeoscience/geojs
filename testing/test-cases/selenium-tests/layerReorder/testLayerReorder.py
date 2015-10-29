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

    def testMoveUp(self):
        self.resizeWindow(640, 480)
        self.loadURL('layerReorder/index.html')
        self.wait()

        # move osm layer up to top
        self.runScript('window.moveUp(0, 2);')
        self.screenshotTest('moveUp_0_2')

        # move d3 layer below gl layer
        self.runScript('window.moveUp(2, -1);')
        self.screenshotTest('moveUp_2_-1')

        # move gl layer up one
        self.runScript('window.moveUp(1);')
        self.screenshotTest('moveUp_1_1')

    def testMoveDown(self):
        self.resizeWindow(640, 480)
        self.loadURL('layerReorder/index.html')
        self.wait()

        # move down (no-op)
        self.runScript('window.moveDown(0);')
        self.screenshotTest('moveDown_0')

        # move d3 layer below gl layer
        self.runScript('window.moveDown(2, 1);')
        self.screenshotTest('moveDown_2_1')

        # move osm layer to the top
        self.runScript('window.moveDown(0, -5);')
        self.screenshotTest('moveDown_0_-5')

if __name__ == '__main__':
    import unittest
    unittest.main()
