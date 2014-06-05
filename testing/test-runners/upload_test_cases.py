#!/usr/bin/env python

'''
This python module is a script that helps to generate test images
and upload them to the midas data store.  It is dependent on a
the specific structure of the unit tests.  It can be improved
in the future by using the testtools module and providing a
custom exception handler.
'''

import sys
import os
import unittest
import textwrap
from cStringIO import StringIO

from PIL import Image

from selenium_test import BaseTest, ImageDifferenceException


def iterate_tests(test_suite_or_case):
    """Iterate through all of the test cases in 'test_suite_or_case'."""
    try:
        suite = iter(test_suite_or_case)
    except TypeError:
        yield test_suite_or_case
    else:
        for test in suite:
            for subtest in iterate_tests(test):
                yield subtest


def findTests(path):
    '''
    Find all the tests in the selenium tests path
    and return an interable.
    '''
    loader = unittest.TestLoader()
    return iterate_tests(loader.discover(path))


def handleImageDifference(**kw):
    hasDiff = False
    if kw['iImage'] < 0:
        because = 'no base line images ' + \
            'were found in the datastore.'
    elif kw.get('diffPath') is None:
        because = 'no images in the data store had the ' + \
                  'same size as the screenshot.'
    else:
        hasDiff = True
        because = 'the nearest image in the data store differed ' + \
                  'from the screenshot by %f.' % kw['difference']
    s = ('The test %s failed because ' % kw['testName']) + because
    print '\n'.join(textwrap.wrap(s))

    print ''
    print 'Would you like to view the screenshot?'
    yesorno = raw_input('[y/n]: ')
    if yesorno.lower() == 'y':
        testImage = Image.open(kw['testPath'])
        testImage.show()

    if kw.get('basePath'):
        s = 'Would you like to see the base line image?'
        print '\n'.join(textwrap.wrap(s))
        yesorno = raw_input('[y/n]: ')
        if yesorno.lower() == 'y':
            baseImage = Image.open(kw['basePath'])
            baseImage.show()

    if hasDiff:
        s = 'Would you like to see the difference image?'
        print '\n'.join(textwrap.wrap(s))
        yesorno = raw_input('[y/n]: ')
        if yesorno.lower() == 'y':
            diffImage = Image.open(kw['diffPath'])
            diffImage.show()

    s = 'Would you like to upload this image to the data store at "%s"?' % \
        '/'.join(kw['midas_path'])
    print '\n'.join(textwrap.wrap(s))
    yesorno = raw_input('[y/n]: ')
    if yesorno.lower() == 'y':
        fileobj = StringIO()
        testImage.save(fileobj, 'png')
        fileobj.seek(0)
        BaseTest.midas.uploadFile(
            fileobj.read(),
            kw['midas_path'],
            kw['revision']
        )


def exceptionHandler(func):
    '''
    Decorator function to catch ImageDifferenceExceptions
    and prompt the user to upload test images to the midas
    data store.  Catch all other exceptions and warn the
    user.
    '''
    def wrapped(*arg, **kw):
        try:
            func(*arg, **kw)
        except ImageDifferenceException as e:
            handleImageDifference(**e.stats)
        except Exception as e:
            print >> sys.stderr, "Test failed with an unknown exception."
            print >> sys.stderr, str(e)
    return wrapped


@exceptionHandler
def runTest(test):
    print >> sys.stderr, "Running '%s'." % str(test)
    testMethod = getattr(test, test._testMethodName)
    test.setUp()
    try:
        testMethod()
    finally:  # always call the tear down method
        test.tearDown()
    print "Test passed!"


def main(paths):
    paths = [os.path.abspath(p) for p in paths]
    BaseTest.startServer()
    try:
        for path in paths:
            for test in findTests(path):
                try:
                    runTest(test)
                except Exception as e:
                    # just to make sure no exceptions leak
                    print >> sys.stderr, "Exception caught"
                    print >> sys.stderr, str(e)
    finally:
        BaseTest.stopServer()

if __name__ == '__main__':
    main(sys.argv[1:])
