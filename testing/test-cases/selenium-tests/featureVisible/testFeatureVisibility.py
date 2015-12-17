#!/usr/bin/env python

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class Visibility(object):
    testCase = ('osmLayer',)
    testRevision = 1

    def getCount(self):
        self.wait(function='return window.geo_is_done(window.geo_wait())')
        return self.runScript('return window.geo_mouse_moves')

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('featureVisible/index.html')
        self.resizeWindow(640, 480)
        self.wait()

    def trigger_mouse_moves(self):
        for i in range(10):
            self.hover('#map', offset=(2.5 * i, 2.5 * i))

    def test_visibility_toggle(self):
        self.loadPage()

        self.trigger_mouse_moves()
        initial = self.getCount()

        self.assertGreater(initial, 0, 'Initial mouse movements')

        self.runScript('window.geo_feature.visible(false)')
        initial = self.getCount()
        self.trigger_mouse_moves()
        count = self.getCount()

        self.assertEqual(count, initial, 'Visibility off')

        self.runScript('window.geo_feature.visible(true)')

        initial = self.getCount()
        self.trigger_mouse_moves()
        count = self.getCount()

        self.assertGreater(count, initial, 'Visibility on')


class FirefoxVis(Visibility, FirefoxTest):
    testCase = Visibility.testCase + ('firefox',)


class ChromeVis(Visibility, ChromeTest):
    testCase = Visibility.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
