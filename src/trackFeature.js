var inherit = require('./inherit');
var feature = require('./feature');
var registry = require('./registry');
var util = require('./util');

/**
 * Track feature specification.
 *
 * @typedef {geo.feature.spec} geo.trackFeature.spec
 * @property {geo.geoPosition|function} [position] Position of the data.
 *   Default is (data).
 * @property {float|function} [time] Time of the data.  Default is `(data).t`.
 * @property {object|function} [track] Tracks from the data.  Default is
 *   (data).  Typically, the data is an array of tracks, each of which is an
 *   array of points, each of which has a position and time.  The position and
 *   time functions are called for each point as `position(trackPoint,
 *   pointIndex, trackEntry, trackEntryIndex)`.
 * @property {float|null} [startTime=null] Start time.  Used for styling.  If
 *   `null`, this is the duration before the end time if `duration` is not
 *  `null` and the minimum time in any track if `duration` is `null`.
 * @property {float} [endTime=null] End time.  Used for styling and position of
 *   the track head.  If `null` and either of `startTime` or `duration` are
 *   `null`, this is the maximum time in any track.
 * @property {float} [duration=null] Duration between start and end times.
 *   Ignored if both start and end times are specified.
 * @property {float|function} [text] Text to use for the head of the track.  If
 *   specified, the track head is rendered as text.  If `undefined` a marker is
 *   used instead.  If `null` or an empty string (`''`), neither a marker nor
 *   text is used.
 * @property {geo.trackFeature.styleSpec} [style] Style object with default
 *   style options.
 * @property {geo.lineFeature.styleSpec} [pastStyle] Style object with
 *   style options for the track before the start time.
 * @property {geo.lineFeature.styleSpec} [currentStyle] Style object with
 *   style options for the track between the start and end time.
 * @property {geo.lineFeature.styleSpec} [futureStyle] Style object with
 *   style options for the track after the end time.
 * @property {geo.markerFeature.styleSpec} [markerStyle] Style object with
 *  style options for the track head marker.
 * @property {geo.textFeature.styleSpec} [textStyle] Style object with style
 *  options for the track head text.
 */

/**
 * Style specification for a track feature.  Extends
 * {@link geo.lineFeasture.styleSpec}.
 *
 * @typedef {geo.feature.styleSpec} geo.trackFeature.styleSpec
 * @extends geo.feature.styleSpec
 * @extends geo.lineFeature.styleSpec
 */

/**
 * Create a new instance of class trackFeature.
 *
 * @class
 * @alias geo.trackFeature
 * @extends geo.feature
 * @param {geo.trackFeature.spec} arg
 * @returns {geo.trackFeature}
 */
var trackFeature = function (arg) {
  'use strict';
  if (!(this instanceof trackFeature)) {
    return new trackFeature(arg);
  }

  var $ = require('jquery');
  var transform = require('./transform');

  arg = arg || {};
  feature.call(this, arg);

  /**
   * @private
   */
  var m_this = this,
      m_styles = {},
      m_tracks = {
        // user specified
        startTime: arg.startTime !== undefined ? arg.startTime : null,
        endTime: arg.endTime !== undefined ? arg.endTime : null,
        duration: arg.duration !== undefined ? arg.duration : null,
        // internal
        start: 0,
        end: 0
      },
      m_lineFeatures,
      m_markerLayer,
      m_markerFeature,
      m_textLayer,
      m_textFeature,
      s_draw = this.draw,
      s_exit = this._exit,
      s_init = this._init,
      s_modified = this.modified,
      s_style = this.style,
      s_update = this._update;

  this.featureType = 'track';

  /**
   * Return a function for position of a dependent line feature.
   *
   * @param {string} key One of `past`, `current` or `future`.
   * @returns {function} The position function.
   */
  this._linePosition = function (key) {
    return function (d, i, l, j) {
      var time = m_tracks.timeFunc(d, i, l, j);
      if ((key === 'past' && time >= m_tracks.start) ||
          (key === 'current' && time < m_tracks.start)) {
        return m_tracks.startPosition[j];
      }
      if ((key === 'current' && time > m_tracks.end) ||
          (key === 'future' && time < m_tracks.end)) {
        return m_tracks.endPosition[j];
      }
      return m_tracks.positionFunc(d, i, l, j);
    };
  };

  /**
   * Return the position for the head of the track.
   *
   * @param {object} d The data object.
   * @param {number} i The data idex.
   * @returns {geo.geoPosition} The position.
   */
  this._headPosition = function (d, i) {
    return m_tracks.endPosition[i];
  };

  /**
   * Return the text associated with a track.
   *
   * @param {object} d The data object.
   * @param {number} i The data idex.
   * @returns {string|undefined} The text.
   */
  this._headText = function (d, i) {
    return m_tracks.text[i];
  };

  /**
   * Based on the user-specified start time, end time, and duration, and the
   * maximum and minimum track times, compute the functional track start and
   * end times.
   */
  this._updateTimeRange = function () {
    if (m_tracks.endTime !== null || (m_tracks.endTime === null && (m_tracks.startTime === null || m_tracks.duration == null))) {
      m_tracks.end = m_tracks.endTime !== null ? m_tracks.endTime : m_tracks.timeExtents.end;
      if (m_tracks.startTime !== null && (m_tracks.endTime === null || m_tracks.startTime <= m_tracks.endTime)) {
        m_tracks.start = m_tracks.startTime;
      } else if (m_tracks.duration !== null) {
        m_tracks.start = m_tracks.end - m_tracks.duration;
      } else {
        m_tracks.start = m_tracks.timeExtents.start;
      }
    } else {
      m_tracks.start = m_tracks.startTime;
      m_tracks.end = m_tracks.start + m_tracks.duration;
    }
  };

  /**
   * Calculate an interpolated position given a time.  If the time is outside
   * the range of a track, the first or last point is returned.
   *
   * @param {float} time The time to compute a position array for.
   * @param {string|geo.transform|null} [gcs] `undefined` to use the feature
   *    gcs, `null` to use the map gcs, or any other transform.  This transform
   *    is used for the interpolation; the results are still in feature gcs.
   * @param {boolean} [calcAngle] If truthy, also calculate the angle.
   * @returns {geo.geoPosition[]} An array of positions, one per track.  If the
   *    angle is computed, these position objects are supplemented with an
   *    `angle` key in radians.
   */
  this.calculateTimePosition = function (time, gcs, calcAngle) {
    if (m_this.dataTime().timestamp() >= m_this.buildTime().timestamp()) {
      m_this._build();
    }
    gcs = (gcs === null ? m_this.layer().map().gcs() : (gcs === undefined ? m_this.gcs() : gcs));
    var trans = transform({source: m_this.gcs(), target: gcs});
    var data = m_this.data();
    var tracks = [];
    var positions = data.map((d, i) => {
      var track = m_tracks.trackFunc(d, i);
      tracks.push(track);
      if (!track.length) {
        return {x: 0, y: 0, z: 0, posidx: -1};
      }
      var lowidx = 0, lowt, highidx = track.length - 1, hight, testidx, testt;
      if (track.length === 1) {
        return {posidx: lowidx, angidx0: lowidx, angidx1: lowidx};
      }
      lowt = m_tracks.timeFunc(track[lowidx], lowidx, d, i);
      if (lowt >= time) {
        return {posidx: lowidx, angidx0: lowidx, angidx1: lowidx + 1};
      }
      hight = m_tracks.timeFunc(track[highidx], highidx, d, i);
      if (hight <= time) {
        return {posidx: highidx, angidx0: highidx - 1, angidx1: highidx};
      }
      while (highidx - lowidx > 1) {
        testidx = Math.floor((highidx + lowidx) / 2);
        testt = m_tracks.timeFunc(track[testidx], testidx, d, i);
        if (testt === time) {
          return {posidx: testidx, angidx0: testidx - 1, angidx1: testidx + 1};
        }
        if (testt < time) {
          lowt = testt;
          lowidx = testidx;
        } else {
          hight = testt;
          highidx = testidx;
        }
      }
      var fh = (time - lowt) / (hight - lowt), fl = 1 - fh;
      return {posidx0: lowidx, posidx1: highidx, factor0: fl, factor1: fh, angidx0: lowidx, angidx1: highidx};
    });
    positions.forEach((d, i) => {
      if (d.posidx < 0) {
        return;
      }
      var pos, pos0, pos1;
      if (d.posidx1 === undefined) {
        pos = m_tracks.positionFunc(tracks[i][d.posidx], d.posidx, tracks[i], i);
      } else {
        pos0 = trans.forward(m_tracks.positionFunc(tracks[i][d.posidx0], d.posidx0, tracks[i], i));
        pos1 = trans.forward(m_tracks.positionFunc(tracks[i][d.posidx1], d.posidx1, tracks[i], i));
        pos = trans.inverse({
          x: pos0.x * d.factor0 + pos1.x * d.factor1,
          y: pos0.y * d.factor0 + pos1.y * d.factor1,
          z: (pos0.z || 0) * d.factor0 + (pos1.z || 0) * d.factor1
        });
      }
      d.x = pos.x;
      d.y = pos.y;
      d.z = pos.z || 0;
      if (calcAngle) {
        if (d.posidx1 === undefined) {
          pos0 = trans.forward(d.angidx0 === d.posidx ? pos : m_tracks.positionFunc(tracks[i][d.angidx0], d.angidx0, tracks[i], i));
          pos1 = trans.forward(d.angidx1 === d.posidx ? pos : m_tracks.positionFunc(tracks[i][d.angidx1], d.angidx1, tracks[i], i));
        }
        d.angle = Math.atan2(pos1.y - pos0.y, pos1.x - pos0.x);
      }
    });
    return positions;
  };

  /**
   * Build.  Generate the tracks.  Create sub-features if necessary and
   * update it.
   *
   * @returns {this}
   */
  this._build = function () {
    m_this.buildTime().modified();
    if (!m_lineFeatures) {
      /* This determines the z-order of the time segments */
      m_lineFeatures = {
        past: m_this.layer().createFeature('line'),
        future: m_this.layer().createFeature('line'),
        current: m_this.layer().createFeature('line')
      };
      m_this.dependentFeatures([m_lineFeatures.past, m_lineFeatures.current, m_lineFeatures.future]);
    }
    var data = m_this.data();
    m_tracks.data = data;
    m_tracks.timeFunc = m_this.style.get('time');
    m_tracks.positionFunc = m_this.style.get('position');
    m_tracks.trackFunc = m_this.style.get('track');
    m_tracks.textFunc = m_this.style.get('text');
    ['past', 'current', 'future'].forEach(key => {
      m_lineFeatures[key]
        .style(m_this[key + 'Style']())
        .style(m_this.style())
        .line(m_this.style('track'))
        .gcs(m_this.gcs())
        .data(data)
        .position(m_this._linePosition(key));
    });
    var timeExtents = {};
    data.forEach((d, i) => {
      var track = m_tracks.trackFunc(d, i);
      var time;
      if (track.length) {
        time = m_tracks.timeFunc(track[0], 0, d, i);
        if (timeExtents.start === undefined || time < timeExtents.start) {
          timeExtents.start = time;
        }
        if (track.length > 1) {
          time = m_tracks.timeFunc(track[track.length - 1], track.length - 1, d, i);
        }
        if (timeExtents.end === undefined || time > timeExtents.end) {
          timeExtents.end = time;
        }
      }
    });
    m_tracks.timeExtents = timeExtents;
    m_this._updateTimeRange();
    m_tracks.startPosition = m_this.calculateTimePosition(m_tracks.start, null);
    m_tracks.endPosition = m_this.calculateTimePosition(m_tracks.end, null, true);

    var hasMarker, hasText;
    m_tracks.text = data.map((d, i) => {
      var val = m_tracks.textFunc(d, i);
      hasMarker |= (val === undefined || val === null);
      if (val === undefined || val === null || val === '') {
        return '';
      }
      hasText = true;
      if (m_tracks.startPosition[i].posidx < 0) {
        val = '';
      }
      return val;
    });
    if (hasMarker && !m_markerFeature) {
      if (!(registry.registries.features[m_this.layer().rendererName()] || {}).marker) {
        let renderer = registry.rendererForFeatures(['marker']);
        m_markerLayer = registry.createLayer('feature', m_this.layer().map(), {renderer: renderer});
        m_this.layer().addChild(m_markerLayer);
        m_this.layer().node().append(m_markerLayer.node());
      }
      m_markerFeature = (m_markerLayer || m_this.layer()).createFeature('marker');
      let df = m_this.dependentFeatures();
      df.push(m_markerFeature);
      m_this.dependentFeatures(df);
    }
    if (hasText && !m_textFeature) {
      if (!(registry.registries.features[m_this.layer().rendererName()] || {}).text) {
        let renderer = registry.rendererForFeatures(['text']);
        m_textLayer = registry.createLayer('feature', m_this.layer().map(), {renderer: renderer});
        m_this.layer().addChild(m_textLayer);
        m_this.layer().node().append(m_textLayer.node());
      }
      m_textFeature = (m_textLayer || m_this.layer()).createFeature('text');
      let df = m_this.dependentFeatures();
      df.push(m_textFeature);
      m_this.dependentFeatures(df);
    }
    if (m_markerFeature) {
      m_markerFeature.headData = m_tracks.endPosition;
      m_markerFeature
        .style(m_this.markerStyle())
        .gcs(m_this.gcs())
        .data(data)
        .position(m_this._headPosition);
      let radiusFunc = m_markerFeature.style.get('radius');
      m_markerFeature.style('radius', (d, i) => {
        if (m_tracks.text[i] || m_tracks.startPosition[i].posidx < 0) {
          return 0;
        }
        return radiusFunc(d, i);
      });
    }
    if (m_textFeature) {
      m_textFeature.headData = m_tracks.endPosition;
      m_textFeature
        .style(m_this.textStyle())
        .gcs(m_this.gcs())
        .data(data)
        .text(m_this._headText)
        .position(m_this._headPosition);
    }
    return m_this;
  };

  /**
   * Update the time and position and mark features as modified.
   */
  this._updateTimeAndPosition = function () {
    if (!m_lineFeatures) {
      return;
    }
    m_this._updateTimeRange();
    m_tracks.startPosition = m_this.calculateTimePosition(m_tracks.start, null);
    m_tracks.endPosition = m_this.calculateTimePosition(m_tracks.end, null, true);
    m_lineFeatures.past.modified();
    m_lineFeatures.current.modified();
    m_lineFeatures.future.modified();
    if (m_markerFeature) {
      m_markerFeature.modified();
    }
    if (m_textFeature) {
      m_textFeature.modified();
    }
    m_this.updateTime().modified();
    m_this.modified();
  };

  /**
   * Update.  Rebuild if necessary.
   *
   * @returns {this}
   */
  this._update = function () {
    s_update.call(m_this);

    if (m_this.dataTime().timestamp() >= m_this.buildTime().timestamp() ||
        m_this.updateTime().timestamp() <= m_this.timestamp()) {
      m_this._build();
    }
    m_this.updateTime().modified();
    return m_this;
  };

  /**
   * Redraw the object.
   *
   * @returns {object} The results of the superclass draw function.
   */
  this.draw = function () {
    var result = s_draw();
    if (m_lineFeatures) {
      m_lineFeatures.past.draw();
      m_lineFeatures.current.draw();
      m_lineFeatures.future.draw();
    }
    if (m_markerFeature) {
      m_markerFeature.draw();
    }
    if (m_textFeature) {
      m_textFeature.draw();
    }
    return result;
  };

  /**
   * Update the timestamp to the next global timestamp value.  Mark
   * sub-features as modified, too.
   *
   * @returns {object} The results of the superclass modified function.
   */
  this.modified = function () {
    var result = s_modified();
    if (m_lineFeatures) {
      m_lineFeatures.past.modified();
      m_lineFeatures.current.modified();
      m_lineFeatures.future.modified();
    }
    if (m_markerFeature) {
      m_markerFeature.modified();
    }
    if (m_textFeature) {
      m_textFeature.modified();
    }
    return result;
  };

  /**
   * Set or get style.
   *
   * @param {string|object} [arg1] If `undefined`, return the current style
   *    object.  If a string and `arg2` is undefined, return the style
   *    associated with the specified key.  If a string and `arg2` is defined,
   *    set the named style to the specified value.  Otherwise, extend the
   *    current style with the values in the specified object.
   * @param {*} [arg2] If `arg1` is a string, the new value for that style.
   * @param {string} [styleType='style'] The name of the style type, such as
   *    `markerStyle`, `textStyle`, `pastStyle`, `currentStyle`, or
   *    `futureStyle`.
   * @returns {object|this} Either the entire style object, the value of a
   *    specific style, or the current class instance.
   */
  this.style = function (arg1, arg2, styleType) {
    styleType = styleType || 'style';
    if (styleType === 'style') {
      return s_style(arg1, arg2);
    }
    if (arg1 === undefined) {
      return m_styles[styleType];
    }
    if (typeof arg1 === 'string' && arg2 === undefined) {
      return (m_styles[styleType] || {})[arg1];
    }
    if (m_styles[styleType] === undefined) {
      m_styles[styleType] = {};
    }
    if (arg2 === undefined) {
      m_styles[styleType] = $.extend(true, m_styles[styleType], arg1);
    } else {
      m_styles[styleType][arg1] = arg2;
    }
    m_this.modified();
    return m_this;
  };

  this.style.get = s_style.get;

  /**
   * Calls {@link geo.annotation#style} with `styleType='markerStyle'`.
   * @function markerStyle
   * @memberof geo.trackFeature
   * @instance
   */
  /**
   * Calls {@link geo.annotation#style} with `styleType='textStyle'`.
   * @function textStyle
   * @memberof geo.trackFeature
   * @instance
   */
  /**
   * Calls {@link geo.annotation#style} with `styleType='pastStyle'`.
   * @function pastStyle
   * @memberof geo.trackFeature
   * @instance
   */
  /**
   * Calls {@link geo.annotation#style} with `styleType='currentStyle'`.
   * @function currentStyle
   * @memberof geo.trackFeature
   * @instance
   */
  /**
   * Calls {@link geo.annotation#style} with `styleType='futureStyle'`.
   * @function futureStyle
   * @memberof geo.trackFeature
   * @instance
   */
  ['markerStyle', 'textStyle', 'pastStyle', 'currentStyle', 'futureStyle'
  ].forEach(function (styleType) {
    m_this[styleType] = function (arg1, arg2) {
      return m_this.style(arg1, arg2, styleType);
    };
  });

  /**
   * Get/set track accessor.
   *
   * @param {object|function} [val] If not specified, return the current track
   *    accessor.  If specified, use this for the track accessor and return
   *    `this`.  If a function is given, the function is passed `(dataElement,
   *    dataIndex)` and returns an array of vertex elements.
   * @returns {object|function|this} The current track accessor or this feature.
   */
  this.track = function (val) {
    if (val === undefined) {
      return m_this.style('track');
    } else {
      m_this.style('track', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Get/Set position accessor.
   *
   * @param {geo.geoPosition|function} [val] If not specified, return the
   *    current position accessor.  If specified, use this for the position
   *    accessor and return `this`.  If a function is given, this is called
   *    with `(vertexElement, vertexIndex, dataElement, dataIndex)`.
   * @returns {geo.geoPosition|function|this} The current position or this
   *    feature.
   */
  this.position = function (val) {
    if (val === undefined) {
      return m_this.style('position');
    } else {
      m_this.style('position', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Get/Set time accessor.
   *
   * @param {float} [val] If not specified, return the current time accessor.
   *    If specified, use this for the time accessor and return `this`.  If a
   *    function is given, this is called with `(vertexElement, vertexIndex,
   *    dataElement, dataIndex)`.
   * @returns {float|function|this} The current time or this feature.
   */
  this.time = function (val) {
    if (val === undefined) {
      return m_this.style('time');
    } else {
      m_this.style('time', val);
      m_this.dataTime().modified();
      m_this.modified();
    }
    return m_this;
  };

  /**
   * Set or query the time range for the tracks.  Tracks are rendered
   * differently before the start time and after the end time.  The track's
   * marker or text is rendered at the position corresponding to the end time.
   *
   * @param {object} [val] An object with any of `startTime`, `endTime`, and
   *    `duration`.  A value of `undefined` won't change that field.  A value
   *    of `null` uses the default.  If `val` is `undefined`, the existsing
   *    settings are returned.
   * @returns {object|this} Either the instance or the current settings.  If
   *    the current settings, `start` and `end` are included with the
   *    calculated start and end times, and `minimum` and `maximum` are values
   *    computed from the data.
   */
  this.timeRange = function (val) {
    if (val === undefined) {
      return {
        startTime: m_tracks.startTime,
        endTime: m_tracks.endTime,
        duration: m_tracks.duration,
        start: m_tracks.start,
        end: m_tracks.end,
        minimum: (m_tracks.timeExtents || {}).start,
        maximum: (m_tracks.timeExtents || {}).end
      };
    }
    let update = false;
    if (val.startTime !== undefined && val.startTime !== m_tracks.startTime) {
      m_tracks.startTime = val.startTime === null ? val.startTime : +val.startTime;
      update = true;
    }
    if (val.endTime !== undefined && val.endTime !== m_tracks.endTime) {
      m_tracks.endTime = val.endTime === null ? val.endTime : +val.endTime;
      update = true;
    }
    if (val.duration !== undefined && val.duration !== m_tracks.duration) {
      m_tracks.duration = val.duration === null ? val.duration : +val.duration;
      update = true;
    }
    if (update) {
      m_this._updateTimeAndPosition();
    }
    return m_this;
  };

  /**
   * Get or set the start time.
   *
   * @param {float|null} [val] If specified, the new start time.
   * @returns {float|null|this} If set, the instance.  Otherwise, the current
   *    start time value.
   */
  this.startTime = function (val) {
    if (val === undefined) {
      return m_tracks.startTime;
    }
    if (val !== m_tracks.startTime) {
      m_tracks.startTime = val === null ? val : +val;
      m_this._updateTimeAndPosition();
    }
    return m_this;
  };

  /**
   * Get or set the end time.
   *
   * @param {float|null} [val] If specified, the new end time.
   * @returns {float|null|this} If set, the instance.  Otherwise, the current
   *    end time value.
   */
  this.endTime = function (val) {
    if (val === undefined) {
      return m_tracks.endTime;
    }
    if (val !== m_tracks.endTime) {
      m_tracks.endTime = val === null ? val : +val;
      m_this._updateTimeAndPosition();
    }
    return m_this;
  };

  /**
   * Get or set the duration.
   *
   * @param {float|null} [val] If specified, the new duration.
   * @returns {float|null|this} If set, the instance.  Otherwise, the current
   *    duration.
   */
  this.duration = function (val) {
    if (val === undefined) {
      return m_tracks.duration;
    }
    if (val !== m_tracks.duration) {
      m_tracks.duration = val === null ? val : +val;
      m_this._updateTimeAndPosition();
    }
    return m_this;
  };

  /**
   * Merge search results from multiple features.
   *
   * @param {object} result The result from the base feature.
   * @param {object[]} additional A list of additional feature search results.
   *    Each entry has `key`, the name of the feature, and `value`, the value
   *    of the search results.
   * @returns {object} The combined search results.
   */
  this._mergeSearchResults = function (result, additional) {
    result.extra = result.extra || {};
    additional.forEach(add => add.value.index.forEach((index, i) => {
      if (result.index.indexOf(index) < 0) {
        result.index.push(index);
        result.found.push(add.value.found[i]);
        result.where = result.where || {};
        if (add.value.extra && add.value.extra[index]) {
          result.extra[index] = add.value.extra[index];
        }
        if (!util.isObject(result.extra[index])) {
          result.extra[index] = {value: result.extra[index]};
        }
        result.extra[index].where = add.key;
      }
    }));
    return result;
  };

  /**
   * Returns an array of datum indices that contain the given point.
   *
   * @param {geo.geoPosition} p point to search for in map interface gcs.
   * @returns {object} An object with `index`: a list of track indices, `found`:
   *    a list of tracks that contain the specified coordinate, `extra`: an
   *    object with keys that are track indices and values that are the first
   *    segement index for which the track was matched, and `where`: an
   *    object with keys that are track indices and values that are `past`,
   *    `future`, or `marker` if the point was found in that part of the track,
   *    or unset if the point was found in the current part of the track.
   */
  this.pointSearch = function (p) {
    let result = m_lineFeatures.current.pointSearch(p),
        past = m_lineFeatures.past.pointSearch(p),
        future = m_lineFeatures.future.pointSearch(p),
        marker = m_markerFeature ? m_markerFeature.pointSearch(p) : {index: []};
    return this._mergeSearchResults(result, [
      {key: 'marker', value: marker},
      {key: 'past', value: past},
      {key: 'future', value: future}]);
  };

  /**
   * Returns tracks that are contained in the given polygon.
   *
   * @param {geo.polygonObject} poly A polygon as an array of coordinates or an
   *    object with `outer` and optionally `inner` parameters.  All coordinates
   *    are in map interface gcs.
   * @param {object} [opts] Additional search options.
   * @param {boolean} [opts.partial=false] If truthy, include tracks that are
   *    partially in the polygon, otherwise only include tracks that are fully
   *    within the region.
   * @returns {object} An object with `index`: a list of track indices,
   *    `found`: a list of tracks within the polygon, `extra`: an object with
   *    index keys containing an object with a `segment` key with a value
   *    indicating one of the track segments that is inside the polygon and
   *    `partial` key and a boolean value to indicate if the track is on the
   *    polygon's border, and `where`: an object with keys that are track
   *    indices and values that are `past`, `future`, or `marker` if the point
   *    was found in that part of the track, or unset if the point was found in
   *    the current part of the track.
   */
  this.polygonSearch = function (poly, opts) {
    let result = m_lineFeatures.current.polygonSearch(poly, opts),
        past = m_lineFeatures.past.polygonSearch(poly, opts),
        future = m_lineFeatures.future.polygonSearch(poly, opts),
        marker = m_markerFeature ? m_markerFeature.polygonSearch(poly, opts) : {index: []};
    return this._mergeSearchResults(result, [
      {key: 'marker', value: marker},
      {key: 'past', value: past},
      {key: 'future', value: future}]);
  };

  /**
   * Destroy.
   */
  this._exit = function () {
    if (m_lineFeatures && m_this.layer()) {
      m_this.layer().deleteFeature(m_lineFeatures.past);
      m_this.layer().deleteFeature(m_lineFeatures.current);
      m_this.layer().deleteFeature(m_lineFeatures.future);
    }
    m_lineFeatures = null;
    if (m_markerLayer || m_this.layer()) {
      if (m_markerFeature) {
        (m_markerLayer || m_this.layer()).deleteFeature(m_markerFeature);
      }
    }
    if (m_markerLayer && m_this.layer()) {
      m_this.layer().removeChild(m_markerLayer);
    }
    m_markerLayer = null;
    if (m_textLayer || m_this.layer()) {
      if (m_textFeature) {
        (m_textLayer || m_this.layer()).deleteFeature(m_textFeature);
      }
    }
    if (m_textLayer && m_this.layer()) {
      m_this.layer().removeChild(m_textLayer);
    }
    m_textLayer = null;
    m_this.dependentFeatures([]);
    s_exit();
  };

  /**
   * Initialize.
   *
   * @param {geo.trackFeature.spec} arg The track feature specification.
   */
  this._init = function (arg) {
    arg = arg || {};
    s_init.call(m_this, arg);

    var style = $.extend(
      true,
      {},
      {
        track: (d) => d,
        position: (d) => d,
        time: (d, i) => (d.t !== undefined ? d.t : i)
      },
      arg.style === undefined ? {} : arg.style
    );
    var markerStyle = $.extend(
      true,
      {},
      {
        rotateWithMap: true,
        rotation: (d, i) => -m_tracks.endPosition[i].angle || 0
      },
      arg.markerStyle === undefined ? {} : arg.markerStyle
    );
    var textStyle = $.extend(
      true,
      {},
      {
        rotateWithMap: true,
        rotation: (d, i) => m_tracks.endPosition[i].angle !== undefined ? -m_tracks.endPosition[i].angle + Math.PI / 2 : 0
      },
      arg.textStyle === undefined ? {} : arg.textStyle
    );
    var pastStyle = $.extend(
      true,
      {},
      {
        strokeOpacity: 0.25
      },
      arg.pastStyle === undefined ? {} : arg.pastStyle
    );
    var currentStyle = $.extend(
      true,
      {},
      {
        // defaults go here
      },
      arg.currentStyle === undefined ? {} : arg.currentStyle
    );
    var futureStyle = $.extend(
      true,
      {},
      {
        strokeOpacity: 0.25
      },
      arg.futureStyle === undefined ? {} : arg.futureStyle
    );
    ['track', 'position', 'time'].forEach((key) => {
      if (arg[key] !== undefined) {
        style[key] = arg[key];
      }
    });

    m_this.style(style);
    m_this.markerStyle(markerStyle);
    m_this.textStyle(textStyle);
    m_this.pastStyle(pastStyle);
    m_this.currentStyle(currentStyle);
    m_this.futureStyle(futureStyle);
  };

  return this;
};

inherit(trackFeature, feature);
module.exports = trackFeature;
