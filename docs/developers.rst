=================
Developer's guide
=================

.. note::

    This guide assumes you have cloned and built the geojs repository
    according to the :ref:`Quick start guide <project-setup-guide>`.

    To run all of the tests, you will need the optional packages and python
    modules listed there.

Geojs employs several different frameworks for unit testing.  These
frameworks have been designed to make it easy for developers to
add more tests as new features are added to the api.

Code quality tests
------------------

All javascript source files included in the library for deployment are
checked against `ESLint <http://eslint.org/>`_ for uniform styling
and strict for common errors patterns.  The style rules for geojs are
located in the ``.eslintrc`` file in the root of the repository.  These
tests are preformed automatically for every file added to the build; no
additional configuration is required.  You can run a quick check of the
code style outside of CMake by running ``npm run lint``.

Code coverage
-------------

Code coverage information is generated automatically for all headless unit tests
by Karma's test runner when running ``npm run test``.  The coverage information is
submitted to `codecov <https://codecov.io/github/OpenGeoscience/geojs>`_ and
`cdash <http://my.cdash.org/index.php?project=geojs>`_ after every
successful Travis run.

Headless browser testing
------------------------

Geojs uses `PhantomJS <http://phantomjs.org/>`_ for headless browser
testing of core utilities.  Unfortunately because PhantomJS does not
support webgl at this time, so code paths requiring gl must be either
mocked or run in an environment such as xvfb.

The headless unit tests should be placed in the ``tests/cases/``
directory.  All javascript files in this directory will be detected
by the `Karma <http://karma-runner.github.io/0.13/index.html>`_ test
runner and executed automatically when you run ``npm run test``.  It
is possible to debug these tests in a normal browser as well.  Just run
``npm run start`` and browse to `<http://localhost:9876/debug.html>`_.  The
test runner will automatically rebuild the tests as you modify files
so there is no need to rerun this command unless you add a new file.

There are a number of utilities present in the file ``tests/test-utils.js``
that developers can use to make better unit tests.  For example, a mocked
vgl renderer can be used to hit code paths within gl rendered layers.  There
are also methods for mocking global methods like ``requestAnimationFrame``
to test complex, asynchronous code paths in a stable and repeatable manner.
The `Sinon <http://sinonjs.org/>`_ testing library is also available to
generate stubs, spies, and mocked methods.  Because all tests share
a global scope, they should be careful to clean up all mocking and
instrumentation after running.  Ideally, each test should be runnable
independently and use jasmines ``beforeEach`` and ``afterEach`` methods
for setup and tear down.

Headless WebGL testing
----------------------

To fully test code that uses WebGL, a browser with WebGL is required.
If xvfb, osmesa, and Firefox are installed, some tests can be run in a virtual
frame buffer that doesn't require a display.  May of these tests depend on
additional data which can be downloaded by using CMake and running ctest.

For example, running ::

    cmake /path/to/geojs
    make
    xvfb-run -s '-ac -screen 0 1280x1024x24' ctest -VV -R ffheadless

will run the headless WebGL tests.  After the data for tests is downloaded,
the tests can also be run via ``npm run test-webgl``, which assumes that
``xvfb-run`` is available.

The headless unit tests that require WebGL should be placed in the
``tests/gl-cases/`` directory.  When tests are run in a normal browser via
``npm run start``, the webgl tests are included.

Many of these tests compare against a baseline image.  If a test is changed or
added, new baselines can be generated and optionally uploaded via the script
built into ``test/baseline_images.py``.

If a test fails, the specific test will be reported by the test runner, and the
base and test images are saved in the ``images`` subdirectory of the build
directory.  The images have the base name of the test and end in ``-base.png``
for the reference image, ``-test.png`` for the current test, and ``-diff.png``
for a difference image where areas that are different are highlight (using
resemblejs, the default highlight color is pink).

Unless an image comparison test fails, images are not automatically saved.  To
save all images, add the environment variable ``TEST_SAVE_IMAGE=all`` to the
test command or set this parameter in CMake.

.. note::

    Typically, CMake is used to build outside of the source tree.  This
    means you would create a new directory somewhere and point cmake
    to the geojs source directory.  You may need to rerun ``cmake`` and
    ``make`` after making changes to your code for everything to
    build correctly.  Try running ``ccmake /path/to/geojs`` for a full
    list of configuration options.

Examples and tests that need to run in a standard browser should be tested by
creating an entry in the ``tests/headed-cases/`` directory.  To run these tests
in a normal browser, run ``npm run start`` and browse to 
`<http://localhost:9876/debug.html?test=all>`_.  Since the browser's direct 
screen output is used, the browser must be running on the same machine as the
``npm run start`` command.

