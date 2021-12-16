============================
Provisioning for Development
============================

.. _ubuntu-development:

Ubuntu 20.04
------------

This shows how to set up a build and test environment in Ubuntu 20.04.

These instructions will probably work for other Ubuntu releases.  They assume a
basic installation.

Add nodejs to the sources so it can be installed ::

    wget -qO- https://deb.nodesource.com/setup_15.x | sudo bash -

Install required packages ::

    sudo apt-get install --yes \
        cpio \
        firefox-esr \
        fonts-dejavu \
        git \
        imagemagick \
        mesa-utils \
        nodejs \
        optipng \
        software-properties-common \
        unzip \
        xauth \
        xvfb \
        # these packages are needed for Chrome \
        fonts-liberation \
        libappindicator3-1 \
        libasound2 \
        libgbm1 \
        libnspr4 \
        libnss3 \
        libxss1 \
        libxtst6 \
        xdg-utils

Install Chrome ::

    export CHROME_SOURCE_URL=https://dl.google.com/dl/linux/direct/google-chrome-stable_current_amd64.deb && \
    wget --no-verbose -O /tmp/$(basename $CHROME_SOURCE_URL) $CHROME_SOURCE_URL && \
    dpkg -i /tmp/$(basename $CHROME_SOURCE_URL)

Checkout the GeoJS source and change to the source directory ::

    git clone https://github.com/OpenGeoscience/geojs.git
    cd geojs

Install node modules ::

    npm install

Build GeoJS and run all the tests ::

    npm run ci-xvfb

Build the website ::

    npm run setup-website
    npm run build-website

Install python packages ::

    pip install --user girder-client

Remove old baseline and generate new baseline images for the WebGL tests ::

    rm -r dist/data/base-images
    python tests/runners/baseline_images.py --xvfb --generate --upload --verbose _build
