============
User's guide
============

Dependencies
------------

GeoJS depends on several Javascript libraries that must be loaded
prior to use as well as a few recommended libraries for optional
features.  As a convenience, we provide a bundle containing all
required and optional dependencies in a single minified file.
This bundle is built as ``dist/built/geo.ext.min.js``.  If you
are just building a simple page out of GeoJS like in the
:ref:`quick start guide <quick-start-guide>`, this will probably
work well; however, when using GeoJS as part of an application,
you may need to customize the loading order or versions of the
bundled applications.  In this case, you may need to include the
sources manually or bundle them yourself.  The following is a
list of libraries used by GeoJS.

.. table:: GeoJS dependencies

    +---------------------------+------------+---------------------------+
    | Library                   | Version    | Component                 |
    +===========================+============+===========================+
    | `jQuery`_                 | 2.1        | Core                      |
    +---------------------------+------------+---------------------------+
    | `proj4`_                  | 2.2        | Core                      |
    +---------------------------+------------+---------------------------+
    | `GL matrix`_              | 2.1        | GL renderer               |
    +---------------------------+------------+---------------------------+
    | `pnltri`_                 | 2.1        | GL renderer               |
    +---------------------------+------------+---------------------------+
    | `jQuery mousewheel`_      | 3.1        | Mouse interactor          |
    +---------------------------+------------+---------------------------+
    | `d3`_                     | 3.3        | D3 renderer, UI widgets   |
    +---------------------------+------------+---------------------------+

.. note::

    The versions listed are what is provided in the bundle,
    but other versions may work as well.

.. _jQuery: http://jquery.com/
.. _proj4: http://proj4js.org/
.. _GL matrix: http://glmatrix.net/
.. _pnltri: https://github.com/jahting/pnltri.js/
.. _jQuery mousewheel: https://github.com/jquery/jquery-mousewheel/
.. _d3: http://d3js.org/


Software conventions
--------------------

At it's core, GeoJS is an object oriented framework designed to be extended
and customized.  The inheritance mechanism used provides an isolated closure
inside the constructor to maintain private methods and variables.  Prototypal
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

        // Declare private variables and save overriden superclass methods.
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

        * Use ``m_this`` to reference the instantiation inside public methods.
        * Constructor options are passed inside a single object argument.  Defaults
          should be used whenever possible.
        * When possible, functions should return the class instance to support method
          chaining.  This is particularly true for class property setters.

Class hierarchy
---------------

.. graphviz:: core.dot

API documentation
-----------------
