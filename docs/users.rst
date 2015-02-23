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
sources manually or bundle them yourself.  The following is a list
of required libraries.  The versions listed are what is provided
in the bundle, but other versions may work as well.

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

.. _jQuery: http://jquery.com/
.. _proj4: http://proj4js.org/
.. _GL matrix: http://glmatrix.net/
.. _pnltri: https://github.com/jahting/pnltri.js/
.. _jQuery mousewheel: https://github.com/jquery/jquery-mousewheel/
.. _d3: http://d3js.org/


GeoJS conventions
-----------------


API documentation
-----------------
    
