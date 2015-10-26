#!/usr/bin/env python

from selenium_test import FirefoxTest,\
    setUpModule, tearDownModule


class uiLayer(FirefoxTest):
    testCase = ('uiLayer',)
    testRevision = 1

    def test_ui_position(self):
        self.resizeWindow(1024, 768)
        self.loadURL('uiLayer/index.html')
        self.wait()
        self.screenshotTest('uiLayer')
