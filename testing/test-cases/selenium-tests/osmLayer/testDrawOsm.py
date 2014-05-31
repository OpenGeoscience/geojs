#!/usr/bin/env python

import os

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class osmBase(object):
    testCase = ('osmLayer',)

    def test_osm_draw(self):

        testName = 'osmDraw'
        self.loadURL('osmLayer/index.html')
        self.wait()
        self.resizeWindow(640, 480)

        baseImg = self.loadTestImage(testName)
        testImg = self.screenshot()
        self.compareImages(baseImg, testImg, testName)


class FirefoxOSM(osmBase, FirefoxTest):
    testCase = osmBase.testCase + ('firefox',)


class ChromeOSM(osmBase, ChromeTest):
    testCase = osmBase.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
