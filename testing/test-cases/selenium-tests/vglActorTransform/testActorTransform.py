#!/usr/bin/env python

import os
import time

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class actorTransform(object):
    testCase = ('vgl', 'actorTransformation')

    def loadPage(self):
        self.resizeWindow(1024, 768)
        self.loadURL('vglActorTransform/index.html')
        self.wait()

    def testDraw(self):
        self.loadPage()


class FirefoxOSM(actorTransform, FirefoxTest):
    testCase = actorTransform.testCase + ('firefox',)


class ChromeOSM(actorTransform, ChromeTest):
    testCase = actorTransform.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
