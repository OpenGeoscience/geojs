#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class Visibility(object):
    testCase = ('osmLayer',)
    testRevision = 1

    def getCount(self):
        return self.runScript('return window.geo_mouse_moves')

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('featureVisible/index.html')
        self.wait()
        self.resizeWindow(640, 480)

    def test_visibility_toggle(self):
        self.loadPage()

        self.hover('#map', offset=(25, 25))
        initial = self.getCount()

        self.hover('#map', offset=(50, 50))
        count = self.getCount()

        self.assertTrue(count > initial, 'Initial mouse movements')

        self.runScript('window.geo_feature.visible(false)')
        initial = self.getCount()
        self.hover('#map', offset=(75, 75))
        count = self.getCount()

        self.assertTrue(count == initial, 'Visibility off')

        self.runScript('window.geo_feature.visible(true)')
        initial = self.getCount()
        self.hover('#map', offset=(100, 100))
        count = self.getCount()

        self.assertTrue(count > initial, 'Visibility on')


class FirefoxVis(Visibility, FirefoxTest):
    testCase = Visibility.testCase + ('firefox',)


class ChromeVis(Visibility, ChromeTest):
    testCase = Visibility.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
