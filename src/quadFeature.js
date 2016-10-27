var $ = require('jquery');
var inherit = require('./inherit');
var feature = require('./feature');

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of class quadFeature
 *
 * @class geo.quadFeature
 * @param {Object} arg Options object
 * @extends geo.feature
 * @param {Object|string|Function} [color] Color for quads without images.
 *   Default is white ({r: 1, g: 1, b: 1}).
 * @param {number|Function} [opacity=1] Opacity for quad
 * @param {number|Function} [depth=0] Default z-coordinate for positions that
 *   don't explicitly specify one.
 * @param {boolean|Function} [drawOnAsyncResourceLoaded=true] Redraw quads
 *   when images are loaded after initial render.
 * @param {Image|string|Function} [image] Image for each data item.  If
 *   undefined or null, the quad is a solid color.  Default is (data).image.
 * @param {Object|string|Function} [previewColor=null] If specified, a color to
 *   show on image quads while waiting for the image to load.
 * @param {Image|string|Function} [previewImage=null] If specified, an image to
 *   show on image quads while waiting for the quad-specific image to load.
 *   This will only be shown if it is already loaded.
 * @param {Object|Function} [position] Position of the quad.  Default is
 *   (data).  The position is an Object which specifies the corners of the
 *   quad: ll, lr, ur, ul.  At least two opposite corners must be specified.
 *   The corners do not have to physically correspond to the order specified,
 *   but rather correspond to that part of an image (if there is one).  If a
 *   corner is unspecified, it will use the x coordinate from one adjacent
 *   corner, the y coordinate from the other adjacent corner, and the average
 *   z value of those two corners.  For instance, if ul is unspecified, it is
 *   {x: ll.x, y: ur.y}.  Note that each quad is rendered as a pair of
 *   triangles: (ll, lr, ul) and (ur, ul, lr).  Nothing special is done for
 *   quads that are not convex or quads that have substantially different
 *   transformations for those two triangles.
 * @param {boolean} [cacheQuads=true] If true, a set of internal information is
 *   stored on each data item in the _cachedQuad attribute.  If this is false,
 *   the data item is not altered.  If the data (positions, opacity, etc,) of
 *   individual quads will change, set this to false or delete the _cachedQuad
 *   attribute of the data item.
 * @returns {geo.quadFeature}
 */
//////////////////////////////////////////////////////////////////////////////
var quadFeature = function (arg) {
  'use strict';

  var transform = require('./transform');
  var util = require('./util');

  if (!(this instanceof quadFeature)) {
    return new quadFeature(arg);
  }
  arg = arg || {};
  feature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_this = this,
      s_init = this._init,
      m_cacheQuads,
      m_nextQuadId = 0,
      m_images = [],
      m_quads;

  /**
   * Track a list of object->object mappings.  The mappings are kept in a list.
   * This marks all known mappings as unused.  If they are not marked used
   * before _objectListEnd is called, that function will remove them.
   *
   * @param {array} list the list of mappings.
   */
  this._objectListStart = function (list) {
    $.each(list, function (idx, item) {
      item.used = false;
    });
  };

  /**
   * Get the value from a list of object->object mappings.  If the key object
   * is not present, return undefined.  If found, the entry is marked as being
   * in use.
   *
   * @param {array} list the list of mappings.
   * @param {object} entry the key to search for.
   * @returns {object} the associated object or undefined.
   */
  this._objectListGet = function (list, entry) {
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].entry === entry) {
        list[i].used = true;
        return list[i].value;
      }
    }
    return undefined;
  };

  /**
   * Add a new object to a list of object->object mappings.  The key object
   * should not exist, or this will create a duplicate.  The new entry is
   * marked as being in use.
   *
   * @param {array} list the list of mappings.
   * @param {object} entry the key to add.
   * @param {object} value the value to store with the entry.
   */
  this._objectListAdd = function (list, entry, value) {
    list.push({entry: entry, value: value, used: true});
  };

  /**
   * Remove all unused entries from a list of object->object mappings.
   *
   * @param {array} list the list of mappings.
   */
  this._objectListEnd = function (list) {
    for (var i = list.length - 1; i >= 0; i -= 1) {
      if (!list[i].used) {
        list.splice(i, 1);
      }
    }
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Point search method for selection api.  Returns markers containing the
   * given point.
   *
   * @memberof geo.quadFeature
   * @param {Object} coordinate coordinate in input gcs to check if it is
   *    located in any quad.
   * @returns {Object} an object with 'index': a list of quad indices, and
   *    'found': a list of quads that contain the specified coordinate.
   */
  ////////////////////////////////////////////////////////////////////////////
  this.pointSearch = function (coordinate) {
    var found = [], indices = [], extra = {},
        poly1 = [{}, {}, {}, {}], poly2 = [{}, {}, {}, {}],
        order1 = [0, 1, 2, 0], order2 = [1, 2, 3, 1],
        data = m_this.data(),
        map = m_this.layer().map(),
        i, coordbasis;
    coordinate = transform.transformCoordinates(
        map.ingcs(), map.gcs(), coordinate);
    if (!m_quads) {
      this._generateQuads();
    }
    $.each([m_quads.clrQuads, m_quads.imgQuads], function (idx, quadList) {
      quadList.forEach(function (quad, idx) {
        for (i = 0; i < order1.length; i += 1) {
          poly1[i].x = quad.pos[order1[i] * 3];
          poly1[i].y = quad.pos[order1[i] * 3 + 1];
          poly1[i].z = quad.pos[order1[i] * 3 + 2];
          poly2[i].x = quad.pos[order2[i] * 3];
          poly2[i].y = quad.pos[order2[i] * 3 + 1];
          poly2[i].z = quad.pos[order2[i] * 3 + 2];
        }
        if (util.pointInPolygon(coordinate, poly1) ||
            util.pointInPolygon(coordinate, poly2)) {
          indices.push(quad.idx);
          found.push(data[quad.idx]);
          /* If a point is in the quad (based on pointInPolygon, above), check
           * where in the quad it is located.  We want to output coordinates
           * where the upper-left is (0, 0) and the lower-right is (1, 1). */
          coordbasis = util.pointTo2DTriangleBasis(
            coordinate, poly1[0], poly1[1], poly1[2]);
          if (!coordbasis || coordbasis.x + coordbasis.y > 1) {
            coordbasis = util.pointTo2DTriangleBasis(
              coordinate, poly2[2], poly2[1], poly2[0]);
            if (coordbasis) {
              /* In the second triangle, (0, 0) is upper-right, (1, 0) is
               * upper-left, and (0, 1) is lower-right.  Invert x to get to
               * the desired output coordinates. */
              coordbasis.x = 1 - coordbasis.x;
            }
          } else {
            /* In the first triangle, (0, 0) is lower-left, (1, 0) is lower-
             * right, and (0, 1) is upper-left.  Invert y to get to the
             * desired output coordinates. */
            coordbasis.y = 1 - coordbasis.y;
          }
          if (coordbasis) {
            extra[quad.idx] = {basis: coordbasis};
          }
        }
      });
    });
    return {
      index: indices,
      found: found,
      extra: extra
    };
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Get/Set position
   *
   * @memberof geo.quadFeature
   * @param {object|function} [position] object or function that returns the
   *    position of each quad.
   * @returns {geo.quadFeature}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.position = function (val) {
    if (val === undefined) {
      return m_this.style('position');
    } else {
      m_this.style('position', util.ensureFunction(val));
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Given a data item and its index, fetch its position and ensure we have
   * complete information for the quad.  This generates missing corners and z
   * values.
   *
   * @param {function} posFunc a function to call to get the position of a data
   *   item.  It is passed (d, i).
   * @param {function} depthFunc a function to call to get the z-value of a
   *   data item.  It is passed (d, i).
   * @param d a data item.  Used to fetch position and possibly depth.
   * @param i the index within the data.  Used to fetch position and possibly
   *   depth.
   * @returns {Object|undefined} either an object with all four corners, or
   *   undefined if no such object can be generated.  The coordinates have been
   *   converted to map coordinates.
   */
  this._positionToQuad = function (posFunc, depthFunc, d, i) {
    var initPos = posFunc.call(m_this, d, i);
    if ((!initPos.ll || !initPos.ur) && (!initPos.ul || !initPos.lr)) {
      return;
    }
    var gcs = m_this.gcs(),
        map_gcs = m_this.layer().map().gcs(),
        pos = {};
    $.each(['ll', 'lr', 'ul', 'ur'], function (idx, key) {
      if (initPos[key] !== undefined) {
        pos[key] = {};
        if (initPos[key].x === undefined) {
          pos[key] = [initPos[key][0], initPos[key][1], initPos[key][2]];
        } else {
          pos[key] = [initPos[key].x, initPos[key].y, initPos[key].z];
        }
        if (pos[key][2] === undefined) {
          pos[key][2] = depthFunc.call(m_this, d, i);
        }
        if (gcs !== map_gcs && gcs !== false) {
          pos[key] = transform.transformCoordinates(
              gcs, map_gcs, pos[key]);
        }
      }
    });
    pos.ll = pos.ll || [pos.ul[0], pos.lr[1], (pos.ul[2] + pos.lr[2]) / 2];
    pos.lr = pos.lr || [pos.ur[0], pos.ll[1], (pos.ur[2] + pos.ll[2]) / 2];
    pos.ur = pos.ur || [pos.lr[0], pos.ul[1], (pos.lr[2] + pos.ul[2]) / 2];
    pos.ul = pos.ul || [pos.ll[0], pos.ur[1], (pos.ll[2] + pos.ur[2]) / 2];
    return pos;
  };

  /**
   * Convert the current data set to a pair of arrays, one of quads that are
   * solid color and one of quads that have an image.  All quads are objects
   * with pos (a 12 value array containing 4 three-dimensional position
   * coordinates), and opacity.  Color quads also have a color.  Image quads
   * may have an image element, if the image is loaded.  If it isn't, this
   * element will be missing.  For preview images, the image quad will have a
   * reference to the preview element that may later be removed.  If a preview
   * color is used, the quad will be in both lists, but may be removed from the
   * color quad list once the image is loaded.
   *
   * The value for origin is one of an ll corner from one of the quads with the
   * smallest sum of diagonals.  The assumption is that, if using the origin to
   * improve precision, the smallest quads are the ones most in need of this
   * benefit.
   *
   * @returns {Object} An object with clrQuads and imgQuads, each of which is
   *   an array, and origin, which is a triplet that is guaranteed to be one of
   *   the quads corners for a quad with the smallest sum of diagonal lengths.
   */
  this._generateQuads = function () {
    var posFunc = m_this.position(),
        imgFunc = util.ensureFunction(m_this.style('image')),
        colorFunc = util.ensureFunction(m_this.style('color')),
        depthFunc = util.ensureFunction(m_this.style('depth')),
        opacityFunc = util.ensureFunction(m_this.style('opacity')),
        loadedFunc = util.ensureFunction(m_this.style(
            'drawOnAsyncResourceLoaded')),
        previewColorFunc = util.ensureFunction(m_this.style(
            'previewColor')),
        previewImageFunc = util.ensureFunction(m_this.style(
            'previewImage')),
        data = m_this.data(),
        clrQuads = [], imgQuads = [],
        origin = [0, 0, 0], origindiag2, diag2;
    /* Keep track of images that we are using.  This prevents creating
     * additional Image elements for repeated urls. */
    m_this._objectListStart(m_images);
    $.each(data, function (i, d) {
      if (d._cachedQuad) {
        diag2 = d._cachedQuad.diag2;
        if (origindiag2 === undefined || (d._cachedQuad.diag2 &&
            d._cachedQuad.diag2 < origindiag2)) {
          origin = d._cachedQuad.ll;
          origindiag2 = d._cachedQuad.diag2;
        }
        if (d._cachedQuad.clrquad) {
          clrQuads.push(d._cachedQuad.clrquad);
        }
        if (d._cachedQuad.imgquad) {
          imgQuads.push(d._cachedQuad.imgquad);
        }
        return;
      }
      var quad, reload, image, prev_onload,
          pos, img, opacity, previewColor, previewImage, quadinfo = {};

      pos = m_this._positionToQuad(posFunc, depthFunc, d, i);
      opacity = opacityFunc.call(m_this, d, i);
      if (pos === undefined || !opacity) {
        return;
      }
      diag2 = Math.pow(pos.ll[0] - pos.ur[0], 2) + Math.pow(pos.ll[1] -
          pos.ur[1], 2) + Math.pow(pos.ll[2] - pos.ur[0], 2) + Math.pow(
          pos.lr[0] - pos.ur[0], 2) + Math.pow(pos.lr[1] - pos.ur[1], 2) +
          Math.pow(pos.lr[2] - pos.ur[0], 2);
      quadinfo.diag2 = diag2;
      quadinfo.ll = pos.ll;
      if (origindiag2 === undefined || (diag2 && diag2 < origindiag2)) {
        origin = pos.ll;
        origindiag2 = diag2;
      }
      pos = [pos.ll[0], pos.ll[1], pos.ll[2],
             pos.lr[0], pos.lr[1], pos.lr[2],
             pos.ul[0], pos.ul[1], pos.ul[2],
             pos.ur[0], pos.ur[1], pos.ur[2]];
      img = imgFunc.call(m_this, d, i);
      if (!img) {
        quad = {
          idx: i,
          pos: pos,
          opacity: opacity,
          color: util.convertColor(colorFunc.call(m_this, d, i))
        };
        if (d.reference) {
          quad.reference = d.reference;
        }
        clrQuads.push(quad);
        quadinfo.clrquad = quad;
      } else {
        image = m_this._objectListGet(m_images, img);
        if (image === undefined) {
          if (img instanceof Image || img instanceof HTMLCanvasElement) {
            image = img;
          } else {
            image = new Image();
            image.src = img;
          }
          m_this._objectListAdd(m_images, img, image);
        }
        quad = {
          idx: i,
          pos: pos,
          opacity: opacity
        };
        if (d.reference) {
          quad.reference = d.reference;
        }
        if (d.crop) {
          quad.crop = d.crop;
        }
        if ((image.complete && image.naturalWidth && image.naturalHeight) ||
             image instanceof HTMLCanvasElement) {
          quad.image = image;
        } else {
          previewColor = undefined;
          previewImage = previewImageFunc.call(m_this, d, i);
          if (previewImage && previewImage instanceof Image &&
              previewImage.complete && previewImage.naturalWidth &&
              previewImage.naturalHeight) {
            quad.image = previewImage;
          } else {
            previewColor = previewColorFunc.call(m_this, d, i);
            if (previewColor === null) {
              previewColor = undefined;
            }
            if (previewColor !== undefined) {
              quad.color = util.convertColor(previewColor);
              clrQuads.push(quad);
              quadinfo.keep = false;
            }
          }
          reload = loadedFunc.call(m_this, d, i);
          if (reload) {
            prev_onload = image.onload;
            image.onload = function () {
              if (previewColor !== undefined) {
                if ($.inArray(quad, clrQuads) >= 0) {
                  clrQuads.splice($.inArray(quad, clrQuads), 1);
                }
              }
              quad.image = image;
              m_this.dataTime().modified();
              m_this.modified();
              m_this._update();
              m_this.layer().draw();
              if (prev_onload) {
                return prev_onload.apply(this, arguments);
              }
            };
          } else if (previewColor === undefined && !quad.image) {
            return;
          }
        }
        imgQuads.push(quad);
        quadinfo.imgquad = quad;
      }
      if (m_cacheQuads !== false && quadinfo.keep !== false) {
        if (quadinfo.clrquad) {
          m_nextQuadId += 1;
          quadinfo.clrquad.quadId = m_nextQuadId;
        }
        if (quadinfo.imgquad) {
          m_nextQuadId += 1;
          quadinfo.imgquad.quadId = m_nextQuadId;
        }
        d._cachedQuad = quadinfo;
      }
    });
    m_this._objectListEnd(m_images);
    m_quads = {clrQuads: clrQuads, imgQuads: imgQuads, origin: origin};
    return m_quads;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function (arg) {
    arg = arg || {};
    s_init.call(m_this, arg);

    m_cacheQuads = (arg.cacheQuads !== false);

    var style = $.extend(
      {},
      {
        color: { r: 1.0, g: 1, b: 1 },
        opacity: 1,
        depth: 0,
        drawOnAsyncResourceLoaded: true,
        previewColor: null,
        previewImage: null,
        image: function (d) { return d.image; },
        position: function (d) { return d; }
      },
      arg.style === undefined ? {} : arg.style
    );

    if (arg.position !== undefined) {
      style.position = util.ensureFunction(arg.position);
    }
    m_this.style(style);
    m_this.dataTime().modified();
  };

  return m_this;
};

/**
 * Object specification for a quad feature.
 *
 * @extends geo.feature.spec // need to make a jsdoc plugin for this to work
 * @typedef geo.quadFeature.spec
 * @type {object}
 */

/**
 * Create a quadFeature from an object.
 *
 * @see {@link geo.feature.create}
 * @param {geo.layer} layer The layer to add the feature to
 * @param {geo.quadFeature.spec} spec The object specification
 * @returns {geo.quadFeature|null}
 */
quadFeature.create = function (layer, spec) {
  'use strict';

  spec = spec || {};
  spec.type = 'quad';
  return feature.create(layer, spec);
};

quadFeature.capabilities = {
  /* support for solid-colored quads */
  color: 'quad.color',
  /* support for parallelogram images */
  image: 'quad.image',
  /* support for cropping quad images */
  imageCrop: 'quad.imageCrop',
  /* support for fixed-scale quad images */
  imageFixedScale: 'quad.imageFixedScale',
  /* support for arbitrary quad images */
  imageFull: 'quad.imageFull',
  /* support for canvas as content in image quads*/
  canvas: 'quad.canvas'
};

inherit(quadFeature, feature);
module.exports = quadFeature;
