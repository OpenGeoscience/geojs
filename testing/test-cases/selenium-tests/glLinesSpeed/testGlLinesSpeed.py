#!/usr/bin/env python

import math
import os
import unittest

import selenium_test
from selenium_test import FirefoxTest, ChromeTest, ThresholdException


setUpModule = selenium_test.setUpModule
tearDownModule = selenium_test.tearDownModule


class glLinesSpeedBase(object):

    testCase = ('glLinesSpeed',)
    testRevision = 1

    def loadPage(self):
        self.resizeWindow(640, 480)
        self.loadURL('glLinesSpeed/index.html')
        self.wait()

    def testGlLinesSpeed(self):
        self.loadPage()

        testName = 'drawGlLinesSpeed'
        self.loadTimeTest(testName)
        self.framerateTest(testName)

    def loadTimeTest(self, testName, revision=None):
        # Threshold is in milliseconds.  We need the value to be less than the
        # threshold.
        el = self.getElement('#loadResults')
        value = float(el.get_attribute('results'))
        threshold = float(os.environ.get('LOAD_SPEED_THRESHOLD', '1000'))
        print 'Average load time %1.0f ms (must be less than %1.0f ms)' % (
            value, threshold)
        if value > threshold or math.isnan(value):
            raise ThresholdException({'value': value, 'threshold': threshold})

    def framerateTest(self, testName, revision=None):
        # Threshold is in frames-per-second.  We need the value to be greater
        # than the threshold.
        el = self.getElement('#framerateResults')
        value = float(el.get_attribute('results'))  # in milliseconds
        threshold = float(os.environ.get('FRAMERATE_THRESHOLD', '10'))
        print 'Average framerate %4.2f fps (must be at least %4.2f fps)' % (
            value, threshold)
        if value < threshold or math.isnan(value):
            raise ThresholdException({'value': value, 'threshold': threshold})


class FirefoxOSM(glLinesSpeedBase, FirefoxTest):
    testCase = glLinesSpeedBase.testCase + ('firefox',)


class ChromeOSM(glLinesSpeedBase, ChromeTest):
    testCase = glLinesSpeedBase.testCase + ('chrome',)


if __name__ == '__main__':
    unittest.main()
