#!/usr/bin/env python

import os
import time

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class testVTKViewer(object):
    testCase = ('vgl', 'VTKViewer')

    def loadPage(self):
        self.resizeWindow(1024, 768)
        self.loadURL('vglVTKViewer/index.html')
        self.wait()

    def testDraw(self):
        self.loadPage()


class FirefoxOSM(testVTKViewer, FirefoxTest):
    testCase = testVTKViewer.testCase + ('firefox',)


class ChromeOSM(testVTKViewer, ChromeTest):
    testCase = testVTKViewer.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
