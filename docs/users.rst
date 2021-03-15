============
User's guide
============

Dependencies
------------

See the package.json file for a list of required and optional dependencies used by GeoJS.
All libraries listed as optional dependencies are built into the main ``geo.min.js`` bundle,
but are not present in the ``geo.lean.min.js`` bundle. If you want to use a subset of the
optional dependencies, you can use the lean bundle and import any required dependency
libraries into your page before the lean bundle, making sure that the library is exposed
under its standard name in global scope.

.. note::

    JQuery is included in the distributed bundle.  Internally, this
    version will always be used and exposed as ``geo.jQuery``.  GeoJS
    will also set the global variable ``window.$`` if no other version
    is detected.


Software conventions
--------------------

At its core, GeoJS is an object oriented framework designed to be extended
and customized.  The inheritance mechanism used provides an isolated closure
inside the constructor to maintain private methods and variables.  Prototypical
inheritance is performed by a helper method called ``geo.inherit``.  This
method copies public methods declared on the parent class's prototype.  In general,
classes inside GeoJS do not declare methods on the class prototype.  Instead,
methods are typically bound to the instance inside the constructor.  This
provides access to the private scope.  As a consequence, a class should
always call its parent's constructor before extending the implementation.

Another convention used by GeoJS eliminates the need to use the ``new`` keyword
when constructing a new instance.  This is done by checking ``this``
of the current context.  If it is not an instance of the current class, then
the constructor is called again on a new object and the result is returned
to the caller.

The conventions we use result in the following boilerplate code in every
class definition inside GeoJS.

.. code-block:: js

    // New class, 'B', added to the geo module derived from class, 'A'.
    geo.B = function (args) {

        // Constructors take a single object to hold options passed to each
        // constructor in the class hierarchy.  The default is usually an
        // empty object.
        args = args || {};

        // Here we handle calling the constructor again with a new object
        // when necessary.
        if (!(this instanceof geo.B)) {

            // Note: this will only happen in the constructor called by the
            // user directly, not by all the constructors in the hierarchy.
            return new geo.B(args);
        }

        // Call the parent class's constructor.
        geo.A.call(this, args);

        // Declare private variables and save overridden superclass methods.
        var m_this = this,
            s_func = this.func,
            m_var = 1;

        this.func = function () {

            // Call the super method.
            s_func();

            m_var += 1;
            return m_this;
        };

        return this;
    };

    // Static methods and variables can be added here.
    geo.B.name = 'Class B';

    // Initialize the class prototype.
    geo.inherit(geo.B, geo.A);

.. note::

        * Variable naming conventions

            * The instance (``this``) is saved as ``m_this``.
            * Super class methods are saved with the prefix ``s_``.
            * Private variables are prefixed with ``m_``.

        * Methods beginning with ``_`` are meant to be protected so they should
          only be called from within the class itself or by an inherited class.
        * Use ``m_this`` to reference the instantiation inside public methods.
        * Constructor options are passed inside a single object argument.  Defaults
          should be used whenever possible.
        * When possible, functions should return the class instance to support method
          chaining.  This is particularly true for class property setters.
        * In many cases, class methods return ``null`` to indicate an error.

Class overview
---------------

The latest version of the full API documentation is at
`https://opengeoscience.github.io/geojs/apidocs/geo.html <https://opengeoscience.github.io/geojs/apidocs/geo.html>`_.

GeoJS is made up of the following core classes.  Click on the link to go to the
documentation for each of the classes.

`geo.map <https://opengeoscience.github.io/geojs/apidocs/geo.map.html>`_
    The map object is attached to a DOM element and contains all visible layers and
    features.

`geo.renderer <https://opengeoscience.github.io/geojs/apidocs/geo.renderer.html>`_
    A renderer is responsible for drawing geometries and images on the map.  This is an
    abstract class which serves to define the minimal interface for a renderer.
    Not all features are available in all renderers, and an appropriate
    renderer must be selected for a layer based on the features that will be
    used.
    If a renderer is requested when creating a layer, and that renderer is not
    supported by the current installation, a fallback renderer may be used
    instead and a warning sent to the console.
    `geo.webgl.webglRenderer <https://opengeoscience.github.io/geojs/apidocs/geo.webgl.webglRenderer.html>`_
    requires webGL support.
    `geo.svg.svgRenderer <https://opengeoscience.github.io/geojs/apidocs/geo.svg.svgRenderer.html>`_
    requires the d3 library to be present.

`geo.layer <https://opengeoscience.github.io/geojs/apidocs/geo.layer.html>`_
    Layer objects are created by the map's ``createLayer`` method.  This is an abstract
    class defining the interfaces required for all layers.  Every layer must have a
    specific renderer.  The following are useful layer implementations.

    `geo.featureLayer <https://opengeoscience.github.io/geojs/apidocs/geo.featureLayer.html>`_
        This is the primary container for features such as lines, points, etc.

    `geo.osmLayer <https://opengeoscience.github.io/geojs/apidocs/geo.osmLayer.html>`_
        This layer displays tiled imagery from an openstreetmaps compatible tile server.

    `geo.gui.uiLayer <https://opengeoscience.github.io/geojs/apidocs/geo.gui.uiLayer.html>`_
        This layer contains user interface widgets that should generally be placed on
        top of all other layers.

`geo.feature <https://opengeoscience.github.io/geojs/apidocs/geo.feature.html>`_
    Feature objects are created by the featureLayers's ``createFeature`` method.  Features
    are created from an arbitrary array of objects given by the ``feature.data`` method.
    Properties of the features can be given as constant values or as functional accessors
    into the provided data object.  The styles provided are largely independent of the
    renderer used; however, some differences are necessary due to internal limitations.
    The following are feature types currently available.

        * `geo.pointFeature <https://opengeoscience.github.io/geojs/apidocs/geo.pointFeature.html>`_
        * `geo.lineFeature <https://opengeoscience.github.io/geojs/apidocs/geo.lineFeature.html>`_
        * `geo.pathFeature <https://opengeoscience.github.io/geojs/apidocs/geo.pathFeature.html>`_
        * `geo.graphFeature <https://opengeoscience.github.io/geojs/apidocs/geo.graphFeature.html>`_
        * `geo.vectorFeature <https://opengeoscience.github.io/geojs/apidocs/geo.vectorFeature.html>`_

.. note::

    Some features types are only available for specific renderers.

`geo.gui.widget <https://opengeoscience.github.io/geojs/apidocs/geo.gui.widget.html>`_
    This is an abstract interface for creating widgets that the user can interact with.

        * `geo.gui.domWidget <https://opengeoscience.github.io/geojs/apidocs/geo.gui.domWidget.html>`_
        * `geo.gui.svgWidget <https://opengeoscience.github.io/geojs/apidocs/geo.gui.svgWidget.html>`_

         * `geo.gui.sliderWidget <https://opengeoscience.github.io/geojs/apidocs/geo.gui.sliderWidget.html>`_
         * `geo.gui.legendWidget <https://opengeoscience.github.io/geojs/apidocs/geo.gui.legendWidget.html>`_


`geo.mapInteractor <https://opengeoscience.github.io/geojs/apidocs/geo.mapInteractor.html>`_
    This class handles all mouse and keyboard events for the map.  Users can customize
    the mouse and keyboard bindings through this class.

`geo.fileReader <https://opengeoscience.github.io/geojs/apidocs/geo.fileReader.html>`_
    This is an abstract class defining the interface for file readers.  Currently,
    the only implemented reader is
    `geo.geojsonReader <https://opengeoscience.github.io/geojs/apidocs/geo.geojsonReader.html>`_,
    which is an extendable geojson reader.

Coordinate systems
------------------

A major component of GeoJS's core library involves managing several coordinate systems that
are used to keep layers aligned on the screen.  The following conventions are used in GeoJS's
documentation and codebase when referring to coordinates:

Latitude/longitude coordinates
    Expressed in degrees relative to the WGS84 datum as objects using keys ``x`` for longitude and ``y``
    for latitude.  Longitudes are assumed to be in the range ``[-180, 180]``.  Some map projections
    (such as the default ``EPSG:3857``) are periodic in ``x`` and handle automatic wrapping of
    longitudes.

GCS coordinates
    Expressed in standard units (usually meters) as defined by Proj.4, which is used to perform coordinate
    transformations internally.  The coordinate system ``EPSG:4326`` is equivalent to latitude/longitude
    coordinates described above.  Points in these coordinate systems are given as an object with keys
    x and y providing the horizontal (left to right) and vertical (bottom to top) positions respectively.
    GCS coordinates have an optional ``z`` value that is ``0`` by default.  The units of ``z`` should
    be expressed in the same units as ``x`` and ``y``.

Display coordinates
    Expressed in units of pixels relative to the top-left corner of the current viewport from top to bottom.

World coordinates
    These are the coordinates used internally as coordinates of the 3D scene in much the sense as defined
    in 3D graphics.  The world coordinates are a rescaled and translated version of the GCS coordinates so
    that the world coordinates of the current viewport is near ``1`` in each axis.  This is done to
    provide well conditioned transformation matrices that can be used accurately in contexts of limited precision
    such as WebGL or CSS.  In order to achieve this, the world coordinate system is dynamic at run time
    and will change as the user pans and zooms the map.  By convention, the world coordinates are given
    relative to a dynamic "scale" and "origin".  Changes to these values trigger events on the map that
    allow layers and features to respond and update their views as necessary.

Layer coordinates
    To allow flexibility for layer/renderer implementation, layers are allowed to use their own custom
    coordinate system via the functions ``toLocal`` and ``fromLocal``.  Features inside a layer should
    always pass coordinates through these methods to access the coordinates inside the layer's context.

Feature coordinates
    Features have a GCS property attached to them that should be taken to mean a geographic coordinate
    system for the data passed into the feature.  For features such as points, coordinates are automatically
    transformed into the map's GCS by Proj.4, then transformed into world coordinates, and finally into
    layer coordinates before being passed to the layer's rendering methods.

Coordinate transformation methods
---------------------------------

To facilitate uniform transformation between the many coordinate systems used inside a map object,
there are many available transformation methods provided in the core API.  These methods vary
from being useful to all users of the library to methods that are only relevant to developers
interacting with low level renderers or wishing to optimize performance.  The following is a list
of transform methods present in the library as well as example uses for them.

``geo.map.gcsToDisplay/displayToGcs(c, gcs)``
    This is the most common transformation method that converts from a geographic coordinate system into
    pixel coordinates on the map.  If no GCS is given, the method will assume the coordinate system of
    the map.  For example, to get the lat/lon of the point under the mouse you would get the pixel
    coordinates relative to the map's container and pass them to this method as ``c`` in
    ``map.displayToGcs(c, 'EPSG:4326')``.

``geo.map.gcsToWorld/worldToGcs(c, gcs)``
    This performs the conversion to internal world coordinates that are scaled and translated to deal
    with round off errors.  This method is made available so that layers can use a consistent base
    coordinate system from which the camera transforms are derived.

``geo.layer.fromLocal/toLocal(c)``
    This converts between world space and a custom coordinates system defined by each layer.  The
    default implementation of these methods returns the original coordinate unmodified, but layers
    can choose to override this behavior as needed.  Users generally do not need to call this method
    unless they are interacting with the low level context of the layer.

``geo.camera.worldToDisplay/displayToWorld(c, width, height)``
    This converts between world space coordinates and display pixel coordinates given a viewport
    size.  In addition to these methods, the camera class provides access to the raw transformation
    matrices for layers that can make use of them directly.  For layers supporting CSS
    there is also a ``camera.css`` property that returns a CSS transform representing the current
    camera state.
