#!/usr/bin/env python

import os

from selenium_test import FirefoxTest, ChromeTest,\
    setUpModule, tearDownModule


class osmBase(object):

    def test_osm_draw(self):

        self.loadURL('osmLayer/index.html')
        self.wait()
        self.resizeWindow(640, 480)

        im1 = self.loadImageFile(
            os.path.join('osmLayer', 'osm-%s.png' % self.driverName)
        )

        im2 = self.screenshot()
        im2.save('osm-%s.png' % self.driverName)

        self.compareImages(im1, im2)


class FirefoxOSM(osmBase, FirefoxTest):
    pass


class ChromeOSM(osmBase, ChromeTest):
    pass


if __name__ == '__main__':
    import unittest
    unittest.main()
