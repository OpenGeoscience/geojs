#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class mapCenter(object):
    testCase = ('mapCenterAndZoom',)

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('mapCenterAndZoom/index.html')
        self.wait()

    def test_map_initial_center(self):
        testName = 'mapInitialCenter'
        self.loadPage()
        self.screenshotTest(testName)

    def test_map_center(self):
        # test the map.center method
        testName = 'mapCenter'
        self.loadPage()
        self.runScript(
            '''
window.gjsmap.center({
  x: 60,
  y: 20
});
window.gjsmap.onIdle(function () {
  window.centerDone = true;
});
'''
        )
        self.wait('window.centerDone')
        self.screenshotTest(testName)

    def test_map_zoom(self):
        # test the map.zoom method
        testName = 'mapZoom'
        self.loadPage()
        self.runScript(
            '''
window.gjsmap.zoom(3);
window.gjsmap.onIdle(function () {
  window.zoomDone = true;
});
'''
        )
        self.wait('window.zoomDone')
        self.screenshotTest(testName)


class FirefoxMapCenter(mapCenter, FirefoxTest):
    testCase = mapCenter.testCase + ('firefox',)
    testRevision = 3


class ChromeMapCenter(mapCenter, ChromeTest):
    testCase = mapCenter.testCase + ('chrome',)
    testRevision = 3


if __name__ == '__main__':
    import unittest
    unittest.main()
