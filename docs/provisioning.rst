============================
Provisioning for Development
============================

.. _ubuntu-development:

Ubuntu 14.04
-------------

This shows how to set up a build and test environment in Ubuntu 14.04.

These instructions will probably work for any Ubuntu release from 14.04
onward.  They assume a basic installation, as, for instance, from the
`HashiCorp ubuntu/trusty64 image <https://atlas.hashicorp.com/ubuntu/boxes/trusty64>`_.

Add nodejs to the sources so it can be installed ::

    wget -qO- https://deb.nodesource.com/setup_4.x | sudo bash -

Install required packages (you may want to also include cmake-curses-gui for
convenience in configuring CMake options) ::

    sudo apt-get install --yes \
        cmake \
        firefox \
        imagemagick \
        git \
        libjpeg8-dev \
        libpango1.0-dev \
        mesa-utils \
        nodejs \
        python-pip \
        xvfb

Install node-gyp, which is required to build the node canvas module ::

    sudo npm install -g node-gyp-install && /usr/lib/node_modules/node-gyp-install/bin.js

Checkout the GeoJS source and change to the source directory ::

    git clone https://github.com/OpenGeoscience/geojs.git
    cd geojs

Install node modules ::

    npm install

Build GeoJS and run some basic tests ::

    npm run build
    npm run lint
    npm run test

Note that some of the tests measure speed, and therefore may fail if you are
running on slow hardware or in a limited virtual machine.

Use CMake to create additional tests and make to download test data ::

    cmake .
    make

Run the headless WebGL tests ::

    xvfb-run -s '-ac -screen 0 1280x1024x24' ctest -VV -R ffheadless

Run all tests ::

    xvfb-run -s '-ac -screen 0 1280x1024x24' ctest --output-on-failure

Install python packages ::

    pip install --user girder-client

Generate new baseline images for the headless WebGL tests ::

    python test/baseline_images.py --xvfb --generate --upload --verbose
