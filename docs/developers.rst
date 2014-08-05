========================
Geojs testing frameworks
========================

Geojs employs several different frameworks for unit testing.  These
frameworks have been designed to make it easy for developers to
add more tests as new features are added to the api.

Code quality tests
------------------

All javascript source files included in the library for deployment are
checked against `jshint <http://www.jshint.com/>`_ for uniform styling
and strict for common errors patterns.  The style rules for geojs are
located in the ``.jshintrc`` file in the root of the repository.  These
tests are preformed automatically for every file added to the build; no
additional configuration is required.

Headless browser testing
------------------------

Geojs uses `PhantomJS <http://phantomjs.org/>`_ for headless browser
testing of core utilities.  Unfortunately because PhantomJS does not
support webgl at this time, it is not possible to do headless testing
for any code that requires instantiating the ``geo.map`` class.  These
tests are run automatically on `Travis <http://travis-ci.org/>`_ for
every pull request so they should be used whenever possible.

The headless unit tests should be placed in the ``testing/test-cases/phantomjs-tests``
directory.  All javascript files in this directory are automatically
added as test cases by CMake.  They are run in PhantomJS using
the `Jasmine <http://jasmine.github.io/1.3/introduction.html>`_ test
framework.  The output from Jasmine is automatically detected by the
test runner, which sets it's return status to ``0`` if (and only if)
all tests passed.  You can run these tests manually in the browser by
starting up a test server ::

    python test/geojs_test_runner.py

and navigating to `<http://localhost:50100/test/phantomjs>`_ in your
browser.

For tests that require webgl, there is a similar framework for running
Jasmine unittests inside selenium.  For these cases, you can add your
tests inside the ``testing/test-cases/jasmine-tests``.  CMake will
automatically pick up the scripts in the directory and generate a test
case for them.

Selenium testing
----------------

Most tests for geojs require a full browser with webgl support.
For these test, a framework based on `Selenium <http://docs.seleniumhq.org/>`_
is provided.  This test framework is intentionally lightweight to allow
for many different kinds of testing from simple Jasmine style unit tests
to complicated mouse interactions with screenshot comparisons.

All selenium based tests should be placed inside subdirectories of
``testing/test-cases/selenium-tests``.  All subdirectories are assumed
to be selenium tests by CMake and will be instrumented and run accordingly.
Each subdirectory should, at a minimum, contain the following three files,
which may be empty:

1.  ``include.css``: CSS that will be concatenated into a ``style`` node
    in the ``head``.

2.  ``include.html``: HTML that will be concatenated into the ``body``.

3.  ``include.js``: Javascript source that will be concatenated into a ``script``
    node in the ``head`` after the inclusion of the geojs source and all dependent
    libraries.

Generally, developers are free to put arbitrary content into these files; however,
one convention **must** be followed for the default instrumentation to work correctly.
The javascript source should be wrapped in a global function called ``startTest``.
This function will be called automatically by the testing framework after all of
the instrumentation is in place and the page is loaded.  The ``startTest`` function will
be called with function as an argument that should be called when page is ready to
run the unit tests.  This is provided as a convenience for the default behavior
of :py:func:`selenium_test.BaseTest.wait` with no arguments.  Developers can
extend this behavior as necessary to provide more complicated use cases.  As an
example, see the ``d3Animation`` test case which sets a custom variable in a callback
script for a test that is run asynchronously.

The compiled version of these
tests are placed inside the deployment root so the users can manually see the test
results.  The path to each test is derived from the relative path inside
``testing/test-cases/selenium-tests/``.  For example, the test page in
``testing/test-cases/selenium-tests/osmLayer/`` is available at
`<http://localhost:50100/test/selenium/osmLayer/>`_ after starting the test web server.

The unit tests themselves are derived from Python's 
`unittest <https://docs.python.org/2/library/unittest.html>`_ module via a customized
subclass :py:class:`selenium_test.BaseTest`.  Detailed documentation of the methods
this class provides is given in the next section.  Developers should feel free to
extend this class with any generally useful methods as they become necessary for
a wider variety test cases.

Example unit test
^^^^^^^^^^^^^^^^^

The following is a minimal example of a selenium unit test using the testing framework.
More complicated examples can be found by examining the existing tests present
in the source.

``hello/index.html``:

.. code-block:: html

    <div id="div-node"></div>

``hello/index.css``:

.. code-block:: css

    #div-node {
        text-align: center;
    }

``hello/index.js``:

.. code-block:: js

    window.startTest = function (done) {
        $("#div-node").text("Hello, World!");
        done();
    };

``hello/testHelloWorld.py``:

.. code-block:: python

    # Importing setupModule and tearDownModule will start up and 
    # shut down the web server automatically.
    from selenium_test import FirefoxTest, setupModule, tearDownModule

    # This test will run on firefox only.
    class HelloWorld(FirefoxTest):
        testCase = ('hello', 'world')

        def test_main(self):
            # Resize the window to have consistent results.
            self.resizeWindow(640, 480)

            # Load the main html for this test directory.
            self.loadUrl('hello/index.html')

            # Wait for it to be loaded.
            self.wait()

            # Now we are ready to test the page.
            # The base class provide easy methods to test a screen shot.
            # This will take a screen shot and compare it against any
            # screenshots in the test image store at revision number 1.
            # Any failure here will raise an exception that will mark the
            # test as failed.
            self.screenshotTest('helloWorldScreenshot', revision=1)

Uploading screenshots to the image store
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

A script is provided in the source to help developers upload
images to the data store in a way that they can be loaded automatically
by the testing infrastructure.  The script is built into ``test/upload_test_cases.py``
when selenium testing is enabled in CMake.  When creating a new test
(or updating a revision), the following is the recommended method for uploading
test data for the example test ``hello/`` described above. ::

    # inside the build directory
    python test/upload_test_cases.py ../testing/test-cases/selenium-tests/hello

The script will run all the tests in this directory and prompt you if you want to upload a new image
in the event that a screenshot test has failed.  If you intend to start a new
revision, then the revision number should be changed in the unit test source
before running this script.  Note: you must have write permission in the MIDAS
GeoJS community before you can upload new images.  Contact a community administrator
for an invitation.

Code coverage
-------------

Code coverage information is accumulated automatically through custom
`blankejs <http://blanketjs.org/>`_ instrumentation when ``COVERAGE_TESTS``
are enabled in CMake.  As long as the recommendations in this guide have
been followed, all phantomjs and selenium unit tests will be instrumented
for coverage reporting.
