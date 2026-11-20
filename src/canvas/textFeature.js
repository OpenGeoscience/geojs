var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var textFeature = require('../textFeature');
var timestamp = require('../timestamp');
var util = require('../util');
var KDBush = require('kdbush');
KDBush = KDBush.__esModule ? KDBush.default : KDBush;
var mat3 = require('gl-mat3');
var vec3 = require('gl-vec3');

/**
 * Create a new instance of class canvas.textFeature.
 *
 * @class
 * @alias geo.canvas.textFeature
 * @extends geo.textFeature
 * @extends geo.canvas.object
 *
 * @param {geo.textFeature.spec} [arg] Options for the feature.
 * @returns {geo.canvas.textFeature} The created feature.
 */
var canvas_textFeature = function (arg) {
  'use strict';
  if (!(this instanceof canvas_textFeature)) {
    return new canvas_textFeature(arg);
  }

  var object = require('./object');

  arg = arg || {};
  textFeature.call(this, arg);
  object.call(this);

  /**
   * @private
   */
  var m_this = this,
      m_defaultFont = 'bold 16px sans-serif',
      m_measureContext, m_measureFont, m_measureBaseline,
      m_measureCache = new Map(),
      m_measureCacheLimit = 50000,
      m_lineHeightCache = new Map(),
      m_searchInfo = null,
      m_searchTime = timestamp(),
      /* This regexp parses css font specifications into style, variant,
       * weight, stretch, size, line height, and family.  It is based on a
       * regexp here: https://stackoverflow.com/questions/10135697/regex-to-parse-any-css-font,
       * but has been modified to fix some issues and handle font stretch. */
      m_cssFontRegExp = new RegExp(
        '^\\s*' +
        '(?=(?:(?:[-a-z0-9]+\\s+){0,3}(italic|oblique))?)' +
        '(?=(?:(?:[-a-z0-9]+\\s+){0,3}(small-caps))?)' +
        '(?=(?:(?:[-a-z0-9]+\\s+){0,3}(bold(?:er)?|lighter|[1-9]00))?)' +
        '(?=(?:(?:[-a-z0-9]+\\s+){0,3}((?:ultra-|extra-|semi-)?(?:condensed|expanded)))?)' +
        '(?:(?:normal|\\1|\\2|\\3|\\4)\\s+){0,4}' +
        '((?:xx?-)?(?:small|large)|medium|smaller|larger|[.\\d]+(?:\\%|in|[cem]m|ex|p[ctx]))' +
        '(?:/(normal|[.\\d]+(?:\\%|in|[cem]m|ex|p[ctx])))?\\s+' +
        '([-,\\"\\sa-z]+?)\\s*$', 'i');

  /**
   * Get the font for a specific data item.  This falls back to the default
   * font if the value is unset or doesn't contain sufficient information.
   *
   * @param {boolean} useSubValues If truthy, check all font styles (such as
   *    `fontSize`, `lineHeight`, etc., and override the code `font` style
   *    with those values.  If falsy, only use `font`.
   * @param {object} d The current data element.
   * @param {number} i The index of the current data element.
   * @returns {string} The font style.
   */
  this.getFontFromStyles = function (useSubValues, d, i) {
    var font = m_this.style.get('font')(d, i) || m_defaultFont;
    if (useSubValues) {
      var parts = m_cssFontRegExp.exec(font);
      if (parts === null) {
        parts = m_cssFontRegExp.exec(m_defaultFont);
      }
      parts[1] = m_this.style.get('fontStyle')(d, i) || parts[1];
      parts[2] = m_this.style.get('fontVariant')(d, i) || parts[2];
      parts[3] = m_this.style.get('fontWeight')(d, i) || parts[3];
      parts[4] = m_this.style.get('fontStretch')(d, i) || parts[4];
      parts[5] = m_this.style.get('fontSize')(d, i) || parts[5] || '16px';
      parts[6] = m_this.style.get('lineHeight')(d, i) || parts[6];
      parts[7] = m_this.style.get('fontFamily')(d, i) || parts[7] || 'sans-serif';
      font = (parts[1] || '') + ' ' + (parts[2] || '') + ' ' +
             (parts[3] || '') + ' ' + (parts[4] || '') + ' ' +
             (parts[5] || '') + (parts[6] ? '/' + parts[6] : '') + ' ' +
             parts[7];
      font = font.trim().replace(/\s\s+/g, ' ');
    }
    return font;
  };

  /**
   * Measure a text string.  Results are cached, since measuring text is slow
   * compared to the rest of the computations needed for searching.
   *
   * @private
   * @param {string} font The css font specification.
   * @param {string} baseline The canvas text baseline.
   * @param {string} text The text to measure.
   * @returns {object} An object with the `width` of the text and the `ascent`
   *    and `descent` of the font relative to the baseline, all in pixels.
   */
  function measureText(font, baseline, text) {
    var key = font + '\n' + baseline + '\n' + text,
        result = m_measureCache.get(key),
        metrics, ascent, descent, parts, size;
    if (result) {
      return result;
    }
    if (!m_measureContext) {
      m_measureContext = document.createElement('canvas').getContext('2d');
    }
    if (m_measureFont !== font) {
      m_measureContext.font = m_measureFont = font;
    }
    if (m_measureBaseline !== baseline) {
      m_measureContext.textBaseline = m_measureBaseline = baseline;
    }
    metrics = m_measureContext.measureText(text);
    ascent = metrics.fontBoundingBoxAscent;
    descent = metrics.fontBoundingBoxDescent;
    if (!util.isNonNullFinite(ascent) || !util.isNonNullFinite(descent)) {
      ascent = metrics.actualBoundingBoxAscent;
      descent = metrics.actualBoundingBoxDescent;
    }
    if (!util.isNonNullFinite(ascent) || !util.isNonNullFinite(descent)) {
      /* Some browsers only report the width.  Estimate the rest from the
       * font size. */
      parts = m_cssFontRegExp.exec(font);
      size = parts && /^[.\d]+px$/.test(parts[5]) ? parseFloat(parts[5]) : 16;
      switch (baseline) {
        case 'top': case 'hanging':
          ascent = 0;
          descent = size * 1.15;
          break;
        case 'bottom': case 'ideographic':
          ascent = size * 1.15;
          descent = 0;
          break;
        case 'middle':
          ascent = descent = size * 0.575;
          break;
        default:
          ascent = size * 0.9;
          descent = size * 0.25;
          break;
      }
    }
    result = {width: metrics.width, ascent: ascent, descent: descent};
    if (m_measureCache.size >= m_measureCacheLimit) {
      m_measureCache.clear();
    }
    m_measureCache.set(key, result);
    return result;
  }

  /**
   * Get the distance between the baselines of consecutive lines of multiline
   * text.  If the font specifies a line height in pixels or as a percentage
   * of a font size that is in pixels, that is used.  Otherwise, this is the
   * sum of the ascent and descent of the font.
   *
   * @private
   * @param {string} font The css font specification.
   * @returns {number} The line height in pixels.
   */
  function fontLineHeight(font) {
    var result = m_lineHeightCache.get(font),
        parts, size, metrics;
    if (result !== undefined) {
      return result;
    }
    parts = m_cssFontRegExp.exec(font);
    if (parts && /^[.\d]+px$/.test(parts[6] || '')) {
      result = parseFloat(parts[6]);
    } else if (parts && /^[.\d]+%$/.test(parts[6] || '') && /^[.\d]+px$/.test(parts[5])) {
      result = parseFloat(parts[5]) * parseFloat(parts[6]) / 100;
    }
    if (!util.isNonNullFinite(result) || result <= 0) {
      size = parts && /^[.\d]+px$/.test(parts[5]) ? parseFloat(parts[5]) : 16;
      metrics = measureText(font, 'alphabetic', 'M');
      result = metrics.ascent + metrics.descent;
      if (!util.isNonNullFinite(result) || result < size) {
        result = size * 1.2;
      }
    }
    if (m_lineHeightCache.size >= m_measureCacheLimit) {
      m_lineHeightCache.clear();
    }
    m_lineHeightCache.set(font, result);
    return result;
  }

  /**
   * Get the vertical offset of a line of multiline text.  The text baseline
   * determines how the block of lines is positioned: `top` and `hanging`
   * place the first line at the text position, `middle` centers the lines,
   * and all other values place the last line at the text position.
   *
   * @private
   * @param {number} line The 0-based line number.
   * @param {number} count The number of lines.
   * @param {number} lineHeight The line height in pixels.
   * @param {string} baseline The canvas text baseline.
   * @returns {number} The vertical offset in pixels.
   */
  function lineOffset(line, count, lineHeight, baseline) {
    if (baseline === 'top' || baseline === 'hanging') {
      return line * lineHeight;
    }
    if (baseline === 'middle') {
      return (line - (count - 1) / 2) * lineHeight;
    }
    return (line - (count - 1)) * lineHeight;
  }

  /**
   * Update the information used for searching.  This measures each text item
   * and builds a spatial index of the text positions.  It is only recomputed
   * if the data or styles have changed.
   *
   * The bounds of each text item are based on the advance width of the text
   * and on the ascent and descent of the font, not on the specific glyphs that
   * are drawn.  Shadows and strokes are not included.  Multiline text has
   * separate bounds for each line.
   *
   * @private
   * @returns {object} The search information.  `items` is an array with one
   *    entry per data item, each of which is either `null` if the text is not
   *    rendered or an object with the position in the feature's gcs and the
   *    extent of the text relative to that position.  For multiline text,
   *    `lines` is a list of the extents of each line that isn't empty.  `tree`
   *    is a spatial index of the positions in the feature's gcs.  The other
   *    values are used to determine the maximum distance in display pixels
   *    from a position to the furthest point of its text.
   */
  this._updateSearchInfo = function () {
    if (m_searchInfo && m_searchTime.timestamp() >= m_this.dataTime().timestamp() &&
        m_searchTime.timestamp() >= m_this.timestamp()) {
      return m_searchInfo;
    }
    var data = m_this.data() || [],
        posFunc = m_this.style.get('position'),
        textFunc = m_this.style.get('text'),
        visibleFunc = m_this.style.get('visible'),
        colorFunc = m_this.style.get('color'),
        opacityFunc = m_this.style.get('textOpacity'),
        strokeFunc = m_this.style.get('textStrokeColor'),
        alignFunc = m_this.style.get('textAlign'),
        baselineFunc = m_this.style.get('textBaseline'),
        rotationFunc = m_this.style.get('rotation'),
        rotateWithMapFunc = m_this.style.get('rotateWithMap'),
        scaledFunc = m_this.style.get('textScaled'),
        offsetFunc = m_this.style.get('offset'),
        items = new Array(data.length),
        tree = new KDBush(data.length),
        info = {items: items, tree: tree, maxFixed: 0, maxScaled: 0, maxScaledOffset: 0},
        fontFromSubValues;

    fontFromSubValues = [
      'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
      'lineHeight', 'fontFamily'
    ].some(function (key) {
      return m_this.style(key) !== null && m_this.style(key) !== undefined;
    });
    data.forEach(function (d, i) {
      var pos = posFunc(d, i),
          visible = visibleFunc(d, i),
          text, opacity, font, baseline, align, metrics, left, right, ascent,
          descent, lines, lineHeight, gap, offset, scaled, radius, offsetLength;

      tree.add(pos.x, pos.y);
      items[i] = null;
      if (!visible && visible !== undefined) {
        return;
      }
      text = textFunc(d, i);
      if (text === undefined || text === null || text === '') {
        return;
      }
      opacity = opacityFunc(d, i);
      if (util.convertColorAndOpacity(colorFunc(d, i), opacity).a === 0 &&
          util.convertColorAndOpacity(strokeFunc(d, i), opacity, {r: 0, g: 0, b: 0, a: 0}).a === 0) {
        return;
      }
      font = m_this.getFontFromStyles(fontFromSubValues, d, i);
      baseline = baselineFunc(d, i) || 'middle';
      align = alignFunc(d, i) || 'center';
      /* text is measured left-to-right */
      align = (align === 'left' || align === 'start') ? 0 : (
        (align === 'right' || align === 'end') ? 1 : 0.5);
      if (typeof text === 'string' && text.indexOf('\n') >= 0) {
        lines = text.split('\n');
        lineHeight = fontLineHeight(font);
        lines = lines.map(function (line, idx) {
          var dy = lineOffset(idx, lines.length, lineHeight, baseline);
          if (line === '') {
            return null;
          }
          metrics = measureText(font, baseline, line);
          /* make adjacent lines touch so there aren't gaps between them */
          gap = Math.max(0, lineHeight - metrics.ascent - metrics.descent) / 2;
          return {
            left: metrics.width * align,
            right: metrics.width * (1 - align),
            ascent: metrics.ascent - dy + (idx ? gap : 0),
            descent: metrics.descent + dy + (idx < lines.length - 1 ? gap : 0)
          };
        }).filter(function (line) { return line; });
        if (!lines.length) {
          return;
        }
        left = Math.max.apply(Math, lines.map(function (line) { return line.left; }));
        right = Math.max.apply(Math, lines.map(function (line) { return line.right; }));
        ascent = Math.max.apply(Math, lines.map(function (line) { return line.ascent; }));
        descent = Math.max.apply(Math, lines.map(function (line) { return line.descent; }));
      } else {
        lines = null;
        metrics = measureText(font, baseline, text);
        left = metrics.width * align;
        right = metrics.width - left;
        ascent = metrics.ascent;
        descent = metrics.descent;
      }
      offset = offsetFunc(d, i);
      scaled = scaledFunc(d, i);
      scaled = util.isNonNullFinite(scaled) ? scaled : null;
      items[i] = {
        x: pos.x,
        y: pos.y,
        left: left,
        right: right,
        ascent: ascent,
        descent: descent,
        lines: lines,
        rotation: rotationFunc(d, i) || 0,
        rotateWithMap: !!rotateWithMapFunc(d, i),
        scaled: scaled,
        offsetX: offset && offset.x ? +offset.x : 0,
        offsetY: offset && offset.y ? +offset.y : 0
      };
      radius = Math.sqrt(
        Math.pow(Math.max(left, right), 2) +
        Math.pow(Math.max(ascent, descent), 2));
      offsetLength = Math.sqrt(Math.pow(items[i].offsetX, 2) + Math.pow(items[i].offsetY, 2));
      if (scaled === null) {
        info.maxFixed = Math.max(info.maxFixed, radius + offsetLength);
      } else {
        info.maxScaled = Math.max(info.maxScaled, radius * Math.pow(2, -scaled));
        info.maxScaledOffset = Math.max(info.maxScaledOffset, offsetLength);
      }
    });
    tree.finish();
    m_searchInfo = info;
    m_searchTime.modified();
    return m_searchInfo;
  };

  /**
   * Get the indices of the text items that could be within a rectangle in
   * display coordinates.
   *
   * @private
   * @param {object} info The search information from `_updateSearchInfo`.
   * @param {geo.screenPosition} min The minimum display coordinates.
   * @param {geo.screenPosition} max The maximum display coordinates.
   * @returns {number[]} A sorted list of data indices.
   */
  function searchCandidates(info, min, max) {
    var map = m_this.layer().map(),
        fgcs = m_this.gcs(),
        /* the furthest any part of the text is from its position */
        radius = Math.max(
          info.maxFixed,
          info.maxScaled * Math.pow(2, map.zoom()) + info.maxScaledOffset),
        // check all corners to make sure we handle rotations
        corners = [
          map.displayToGcs({x: min.x - radius, y: min.y - radius}, fgcs),
          map.displayToGcs({x: max.x + radius, y: min.y - radius}, fgcs),
          map.displayToGcs({x: max.x + radius, y: max.y + radius}, fgcs),
          map.displayToGcs({x: min.x - radius, y: max.y + radius}, fgcs)
        ];
    return info.tree.range(
      Math.min(corners[0].x, corners[1].x, corners[2].x, corners[3].x),
      Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y),
      Math.max(corners[0].x, corners[1].x, corners[2].x, corners[3].x),
      Math.max(corners[0].y, corners[1].y, corners[2].y, corners[3].y)
    ).sort(function (a, b) { return a - b; });
  }

  /**
   * Get the corners of the bounding box of a text item or of one of its lines
   * in display coordinates.  This uses the same transform as rendering.
   *
   * @private
   * @param {object} item An entry from the search information.
   * @param {object} extent Either the item or one of its lines.
   * @param {geo.screenPosition} pos The position of the item in display
   *    coordinates.
   * @param {number} mapZoom The current map zoom.
   * @param {number} mapRotation The current map rotation.
   * @returns {geo.screenPosition[]} The four corners of the text.
   */
  function textDisplayBox(item, extent, pos, mapZoom, mapRotation) {
    var scale = item.scaled !== null ? Math.pow(2, mapZoom - item.scaled) : 1,
        cosr = Math.cos(item.rotation),
        sinr = Math.sin(item.rotation),
        cosm = item.rotateWithMap ? Math.cos(mapRotation) : 1,
        sinm = item.rotateWithMap ? Math.sin(mapRotation) : 0;
    return [
      [-extent.left, -extent.ascent], [extent.right, -extent.ascent],
      [extent.right, extent.descent], [-extent.left, extent.descent]
    ].map(function (pt) {
      var x = pt[0] * scale, y = pt[1] * scale,
          rx = x * cosr - y * sinr + item.offsetX,
          ry = x * sinr + y * cosr + item.offsetY;
      return {
        x: pos.x + rx * cosm - ry * sinm,
        y: pos.y + rx * sinm + ry * cosm
      };
    });
  }

  /**
   * Returns an array of datum indices that contain the given point.  The
   * bounding box of the text is used.  This is based on the advance width of
   * the text and on the ascent and descent of the font, and takes the
   * alignment, baseline, offset, rotation, and scale into account.  Shadows
   * and strokes are not included.  For multiline text, the bounding box of
   * each line is used, so a point next to a short line is not in the text even
   * if other lines are longer.
   *
   * @param {geo.geoPosition} p point to search for.
   * @param {string|geo.transform|null} [gcs] Input gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {geo.feature.searchResult} An object with a list of features and
   *    feature indices that are located at the specified point.
   */
  this.pointSearch = function (p, gcs) {
    var data = m_this.data(),
        found = [], ifound = [],
        map, fgcs, info, pt, mapZoom, mapRotation;

    if (!data || !data.length) {
      return {found: [], index: []};
    }
    map = m_this.layer().map();
    fgcs = m_this.gcs();
    info = m_this._updateSearchInfo();
    pt = map.gcsToDisplay(p, gcs);
    mapZoom = map.zoom();
    mapRotation = map.rotation();
    searchCandidates(info, pt, pt).forEach(function (i) {
      var item = info.items[i],
          pos, x, y, tx, scale, cosv, sinv;
      if (!item) {
        return;
      }
      /* Convert the point to the coordinates of the unrotated, unscaled text
       * by applying the inverse of the transform used in rendering. */
      pos = map.gcsToDisplay(item, fgcs);
      x = pt.x - pos.x;
      y = pt.y - pos.y;
      if (item.rotateWithMap && mapRotation) {
        cosv = Math.cos(mapRotation);
        sinv = Math.sin(mapRotation);
        tx = x * cosv + y * sinv;
        y = -x * sinv + y * cosv;
        x = tx;
      }
      x -= item.offsetX;
      y -= item.offsetY;
      if (item.rotation) {
        cosv = Math.cos(item.rotation);
        sinv = Math.sin(item.rotation);
        tx = x * cosv + y * sinv;
        y = -x * sinv + y * cosv;
        x = tx;
      }
      scale = item.scaled !== null ? Math.pow(2, mapZoom - item.scaled) : 1;
      x /= scale;
      y /= scale;
      if (x >= -item.left && x <= item.right && y >= -item.ascent && y <= item.descent && (
        !item.lines || item.lines.some(function (line) {
          return x >= -line.left && x <= line.right && y >= -line.ascent && y <= line.descent;
        }))) {
        found.push(data[i]);
        ifound.push(i);
      }
    });
    return {found: found, index: ifound};
  };

  /**
   * Returns text items that are contained in the given polygon.  The bounding
   * box of the text or of each line of multiline text is used; see
   * `pointSearch` for details.
   *
   * @param {geo.polygonObject} poly A polygon as an array of coordinates or an
   *    object with `outer` and optionally `inner` parameters.  All coordinates
   *    are in map interface gcs.
   * @param {object} [opts] Additional search options.
   * @param {boolean|string} [opts.partial] If truthy, include text that is
   *    partially in the polygon, otherwise only include text that is fully
   *    within the region.  If 'center', only text whose bounding box center is
   *    inside the polygon is returned.
   * @param {string|geo.transform|null} [gcs] Input gcs.  `undefined` to use
   *    the interface gcs, `null` to use the map gcs, or any other transform.
   * @returns {geo.feature.searchResult} An object with a list of features and
   *    feature indices that are located at the specified point.
   */
  this.polygonSearch = function (poly, opts, gcs) {
    var data = m_this.data(),
        found = [], ifound = [], extra = {},
        map, fgcs, info, mapZoom, mapRotation, min, max;

    if (!poly.outer) {
      poly = {outer: poly, inner: []};
    }
    if (poly.outer.length < 3 || !data || !data.length) {
      return {found: [], index: [], extra: {}};
    }
    opts = opts || {};
    map = m_this.layer().map();
    fgcs = m_this.gcs();
    info = m_this._updateSearchInfo();
    mapZoom = map.zoom();
    mapRotation = map.rotation();
    poly = {outer: map.gcsToDisplay(poly.outer, gcs), inner: (poly.inner || []).map(inner => map.gcsToDisplay(inner, gcs))};
    poly.outer.forEach(p => {
      if (!min) {
        min = {x: p.x, y: p.y};
        max = {x: p.x, y: p.y};
      }
      if (p.x < min.x) { min.x = p.x; }
      if (p.x > max.x) { max.x = p.x; }
      if (p.y < min.y) { min.y = p.y; }
      if (p.y > max.y) { max.y = p.y; }
    });
    searchCandidates(info, min, max).forEach(function (i) {
      var item = info.items[i],
          pos, box, boxes, corners, inside, crosses, partial;
      if (!item) {
        return;
      }
      pos = map.gcsToDisplay(item, fgcs);
      boxes = (item.lines || [item]).map(function (extent) {
        return textDisplayBox(item, extent, pos, mapZoom, mapRotation);
      });
      corners = boxes.length * 4;
      inside = 0;
      crosses = false;
      boxes.forEach(function (lbox) {
        inside += lbox.filter(pt => util.distanceToPolygon2d(pt, poly, true) >= 0).length;
        /* if nothing crosses, a hole can still be entirely inside the text */
        crosses = crosses ||
          lbox.some((pt, idx) => util.crossedLineSegmentPolygon2d(pt, lbox[(idx + 1) % lbox.length], poly)) ||
          poly.inner.some(inner => inner.length && util.distanceToPolygon2d(inner[0], lbox, true) >= 0);
      });
      partial = inside < corners || crosses;
      if (partial) {
        if (!opts.partial) {
          return;
        }
        if (opts.partial === 'center') {
          box = item.lines ? textDisplayBox(item, item, pos, mapZoom, mapRotation) : boxes[0];
          if (util.distanceToPolygon2d({x: (box[0].x + box[2].x) / 2, y: (box[0].y + box[2].y) / 2}, poly, true) < 0) {
            return;
          }
        } else if (!inside && !crosses && !boxes.some(lbox => poly.outer.some(pt => util.distanceToPolygon2d(pt, lbox, true) >= 0))) {
          /* No corner of the text is in the polygon, no vertex of the polygon
           * is in the text, and no edges cross. */
          return;
        }
      }
      found.push(data[i]);
      ifound.push(i);
      extra[i] = {partial: partial};
    });
    return {found: found, index: ifound, extra: extra};
  };

  /**
   * Render the data on the canvas.
   *
   * Text that contains line breaks is drawn as multiple lines.  Each line is
   * aligned separately based on `textAlign`, and `textBaseline` determines how
   * the lines are positioned as a group: `top` and `hanging` place the first
   * line at the text position, `middle` centers the lines, and all other
   * values place the last line at the text position.  The line spacing is the
   * line height of the font if it is specified in pixels or as a percentage of
   * a font size that is in pixels, and otherwise is the height of the font.
   *
   * This does not currently support word wrapping, since canvas doesn't
   * implement that directly.  To support this, the width of the text would
   * need to be calculated with context2d.measureText to determine where to
   * wrap.
   *
   * @protected
   * @param {CanvasRenderingContext2D} context2d The canvas context to draw in.
   * @param {geo.map} map The parent map object.
   */
  this._renderOnCanvas = function (context2d, map) {
    var data = m_this.data(),
        posFunc = m_this.style.get('position'),
        renderThreshold = m_this.style.get('renderThreshold')(data),
        textFunc = m_this.style.get('text'),
        mapRotation = map.rotation(),
        mapZoom = map.zoom(),
        mapSize = map.size(),
        fontFromSubValues, text, posArray, pos, visible, color, blur, stroke,
        width, rotation, rotateWithMap, scale, offset, font, baseline, lines,
        lineHeight,
        transform, lastTransform = util.mat3AsArray();

    /* If any of the font styles other than `font` have values, then we need to
     * construct a single font value from the subvalues.  Otherwise, we can
     * skip it. */
    fontFromSubValues = [
      'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
      'lineHeight', 'fontFamily'
    ].some(function (key) {
      return m_this.style(key) !== null && m_this.style(key) !== undefined;
    });
    /* Clear the canvas property buffer */
    m_this._canvasProperty();
    posArray = m_this.featureGcsToDisplay(data.map(posFunc));
    data.forEach(function (d, i) {
      /* If the position is far enough outside of the map viewport, don't
       * render it, even if the offset of size would be sufficient to make it
       * appear in the viewport. */
      pos = posArray[i];
      if (renderThreshold > 0 && (
        pos.x < -renderThreshold || pos.x > mapSize.width + renderThreshold ||
        pos.y < -renderThreshold || pos.y > mapSize.height + renderThreshold)) {
        return;
      }
      visible = m_this.style.get('visible')(d, i);
      if (!visible && visible !== undefined) {
        return;
      }
      color = util.convertColorAndOpacity(
        m_this.style.get('color')(d, i), m_this.style.get('textOpacity')(d, i));
      stroke = util.convertColorAndOpacity(
        m_this.style.get('textStrokeColor')(d, i), m_this.style.get('textOpacity')(d, i), {r: 0, g: 0, b: 0, a: 0});
      if (color.a === 0 && stroke.a === 0) {
        return;
      }
      m_this._canvasProperty(context2d, 'fillStyle', util.convertColorToRGBA(color));
      text = textFunc(d, i);
      if (text === undefined || text === null || text === '') {
        return;
      }
      font = m_this.getFontFromStyles(fontFromSubValues, d, i);
      baseline = m_this.style.get('textBaseline')(d, i) || 'middle';
      m_this._canvasProperty(context2d, 'font', font);
      m_this._canvasProperty(context2d, 'textAlign', m_this.style.get('textAlign')(d, i) || 'center');
      m_this._canvasProperty(context2d, 'textBaseline', baseline);
      /* Only split text that has line breaks to keep the common case fast */
      if (typeof text === 'string' && text.indexOf('\n') >= 0) {
        lines = text.split('\n');
        lineHeight = fontLineHeight(font);
      } else {
        lines = null;
      }
      /* rotation, scale, and offset */
      rotation = m_this.style.get('rotation')(d, i) || 0;
      rotateWithMap = m_this.style.get('rotateWithMap')(d, i) && mapRotation;
      scale = m_this.style.get('textScaled')(d, i);
      scale = util.isNonNullFinite(scale) ? Math.pow(2, mapZoom - scale) : null;
      offset = m_this.style.get('offset')(d, i);
      transform = util.mat3AsArray();
      if (rotation || rotateWithMap || (scale && scale !== 1) || (offset && (offset.x || offset.y))) {
        mat3.translate(transform, transform, [pos.x, pos.y]);
        if (rotateWithMap && mapRotation) {
          mat3.rotate(transform, transform, mapRotation);
        }
        mat3.translate(transform, transform, [
          offset && offset.x ? +offset.x : 0,
          offset && offset.y ? +offset.y : 0]);
        if (rotation) {
          mat3.rotate(transform, transform, rotation);
        }
        if (scale && scale !== 1) {
          mat3.scale(transform, transform, [scale, scale]);
        }
        mat3.translate(transform, transform, [-pos.x, -pos.y]);
      }
      if (lastTransform[0] !== transform[0] || lastTransform[1] !== transform[1] ||
          lastTransform[3] !== transform[3] || lastTransform[4] !== transform[4] ||
          lastTransform[6] !== transform[6] || lastTransform[7] !== transform[7]) {
        context2d.setTransform(transform[0], transform[1], transform[3], transform[4], transform[6], transform[7]);
        mat3.copy(lastTransform, transform);
      }
      /* shadow */
      color = util.convertColorAndOpacity(
        m_this.style.get('shadowColor')(d, i), undefined, {r: 0, g: 0, b: 0, a: 0});
      if (color.a) {
        offset = m_this.style.get('shadowOffset')(d, i);
        blur = m_this.style.get('shadowBlur')(d, i);
      }
      if (color.a && ((offset && (offset.x || offset.y)) || blur)) {
        m_this._canvasProperty(context2d, 'shadowColor', util.convertColorToRGBA(color));
        if (offset && (rotation || rotateWithMap) && m_this.style.get('shadowRotate')(d, i)) {
          transform = [+offset.x, +offset.y, 0];
          vec3.rotateZ(transform, transform, [0, 0, 0],
                       rotation + (rotateWithMap ? mapRotation : 0));
          offset = {x: transform[0], y: transform[1]};
        }
        m_this._canvasProperty(context2d, 'shadowOffsetX', offset && offset.x ? +offset.x : 0);
        m_this._canvasProperty(context2d, 'shadowOffsetY', offset && offset.y ? +offset.y : 0);
        m_this._canvasProperty(context2d, 'shadowBlur', blur || 0);
      } else {
        m_this._canvasProperty(context2d, 'shadowColor', 'rgba(0,0,0,0)');
      }
      /* draw the text */
      if (stroke.a) {
        width = m_this.style.get('textStrokeWidth')(d, i);
        if (isFinite(width) && width > 0) {
          m_this._canvasProperty(context2d, 'strokeStyle', util.convertColorToRGBA(stroke));
          m_this._canvasProperty(context2d, 'lineWidth', width);
          if (!lines) {
            context2d.strokeText(text, pos.x, pos.y);
          } else {
            lines.forEach(function (line, idx) {
              if (line !== '') {
                context2d.strokeText(line, pos.x, pos.y + lineOffset(idx, lines.length, lineHeight, baseline));
              }
            });
          }
          m_this._canvasProperty(context2d, 'shadowColor', 'rgba(0,0,0,0)');
        }
      }
      if (!lines) {
        context2d.fillText(text, pos.x, pos.y);
      } else {
        lines.forEach(function (line, idx) {
          if (line !== '') {
            context2d.fillText(line, pos.x, pos.y + lineOffset(idx, lines.length, lineHeight, baseline));
          }
        });
      }
    });
    m_this._canvasProperty(context2d, 'globalAlpha', 1);
    context2d.setTransform(1, 0, 0, 1, 0, 0);
  };

  return this;
};

inherit(canvas_textFeature, textFeature);

// Now register it
var capabilities = {};

registerFeature('canvas', 'text', canvas_textFeature, capabilities);

module.exports = canvas_textFeature;
