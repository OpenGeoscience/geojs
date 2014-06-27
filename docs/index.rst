.. geojs documentation master file, created by
   sphinx-quickstart on Fri Jun 27 13:44:49 2014.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

=================================
Welcome to geojs's documentation!
=================================

Quick start
===========

Software dependencies
---------------------

The following software is required to build geojs from source:

* `Make <http://www.gnu.org/software/make/>`_
* `CMake <http://www.cmake.org/>`_
* `Git <http://git-scm.com/>`_
* `Node.js <http://nodejs.org/>`_
* `Python 2.7 <http://www.python.org/>`_

In addition, the following python modules are recommended for development
and testing of geojs.

* `Pillow <http://pillow.readthedocs.org/en/latest/>`_
* `Requests <http://docs.python-requests.org/en/latest/>`_
* `Selenium <http://docs.seleniumhq.org/>`_

Getting the source code
-----------------------

Get the latest geojs source code from our `GitHub repository`_
by issue this command in your terminal. ::

    git clone https://github.com/OpenGeoscience/geojs.git

This will put all of the source code in a new directory called
``geojs``.  Geojs depepends on another repository called `vgl`_.
In order to get the vgl source code as well you will need to go
into the ``geojs`` directory and tell git to download the
vgl submodule. ::

    git submodule init
    git submodule update

.. _GitHub repository: https://github.com/OpenGeoscience/geojs
.. _vgl: https://github.com/OpenGeoscience/vgl

Building the source
-------------------

Inside the new ``geojs`` directory, you should create a new directory
for building the source. ::

    mkdir build
    cd build

Now issue the ``cmake`` and ``make`` command to configure and build
the source. ::

    cmake ..
    make

.. toctree::
   :maxdepth: 2


Indices and tables
==================

* :ref:`genindex`
* :ref:`search`

