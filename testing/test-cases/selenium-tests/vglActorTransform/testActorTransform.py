#!/usr/bin/env python

import os
import time
import unittest

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


@unittest.skip("vgl tests disabled until fixed")
class FirefoxOSM(actorTransform, FirefoxTest):
    testCase = actorTransform.testCase + ('firefox',)


@unittest.skip("vgl tests disabled until fixed")
class ChromeOSM(actorTransform, ChromeTest):
    testCase = actorTransform.testCase + ('chrome',)


if __name__ == '__main__':
    import unittest
    unittest.main()
