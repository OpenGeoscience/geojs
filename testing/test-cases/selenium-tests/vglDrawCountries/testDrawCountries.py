#!/usr/bin/env python

import os
import time

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class testDrawCountries(object):
    testCase = ('vgl', 'drawCountries')

    def loadPage(self):
        self.resizeWindow(1024, 768)
        self.loadURL('vglDrawCountries/index.html')
        self.wait()

    def testDraw(self):
        self.loadPage()


class FirefoxOSM(testDrawCountries, FirefoxTest):
    testCase = testDrawCountries.testCase + ('firefox',)


class ChromeOSM(testDrawCountries, ChromeTest):
    testCase = testDrawCountries.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
