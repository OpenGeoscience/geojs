#!/usr/bin/env python

import os
import time

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class testVTKObject(object):
    testCase = ('vgl', 'vtkObject')

    def loadPage(self):
        self.resizeWindow(1024, 768)
        self.loadURL('vglObjectDraw/index.html')
        self.wait()

    def testDraw(self):
        self.loadPage()


class FirefoxOSM(testVTKObject, FirefoxTest):
    testCase = testVTKObject.testCase + ('firefox',)


class ChromeOSM(testVTKObject, ChromeTest):
    testCase = testVTKObject.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
