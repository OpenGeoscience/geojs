var inherit = require('./inherit');
var featureLayer = require('./featureLayer');
var geo_action = require('./action');
var geo_event = require('./event');
var registry = require('./registry');
var $ = require('jquery');

var annotationId = 0;

/////////////////////////////////////////////////////////////////////////////
/**
 * Layer to handle direct interactions with different features.
 *
 * @class geo.annotationLayer
 * @extends geo.featureLayer
 * @returns {geo.annotationLayer}
 */
/////////////////////////////////////////////////////////////////////////////
var annotationLayer = function (args) {
  'use strict';
  if (!(this instanceof annotationLayer)) {
    return new annotationLayer(args);
  }
  featureLayer.call(this, args);

  var mapInteractor = require('./mapInteractor');
  var timestamp = require('./timestamp');
  var util = require('./util');

  var m_this = this,
      s_init = this._init,
      s_exit = this._exit,
      s_update = this._update,
      m_buildTime = timestamp(),
      m_options,
      m_actions,
      m_annotations = [],
      m_features = [];

  m_options = $.extend(true, {}, {
    actions: [{
      action: 'annotationmenu',  // this will redirect to the appropriate menu
      input: 'right'
    }],
    generalMenuOptions: { // null on a menu entry prevents it from showing that item
      default: 'rectangle',
      metakeys: '',
      togeojson: true,
      fromgeojson: true,
      deleteall: true,
      showall: true,
      hideall: true
    },
    generalMenuText: {  // override for different locales
      default: 'Make %s',
      metakeys: '',
      togeojson: 'Copy to Clipboard',
      fromgeojson: 'Copy from Clipboard',
      deleteall: 'Delete Annotations',
      showall: 'Show All',
      hideall: 'Hide All'
    },
    annotationMenuOptions: {
      name: true,
      delete: true,
      rename: true,
      style: true,
      move: true, // move to top, up, down, to bottom
      hide: true
    },
    annotationMenuText: {
      name: 'Name: %s',
      delete: 'Delete',
      rename: 'Rename',
      style: 'Options Dialog',
      movetotop: 'Move to Top',
      moveup: 'Move Up',
      movedown: 'Move Down',
      movetobottom: 'Move to Bottom'
    }
  }, args);

  this._processSelection = function (event) {
    if (m_this.mode === 'rectangle') {
      m_this.map().node().css('cursor', '');
      m_this.map().interactor().removeAction(m_actions.rectangle);
      if (event.state.action === geo_action.annotation_rectangle) {
        var map = m_this.map();
        var params = {
          corners: [
            /* Keep in map gcs, not interface gcs to avoid wrapping issues */
            map.displayToGcs({x: event.lowerLeft.x, y: event.lowerLeft.y}, null),
            map.displayToGcs({x: event.lowerLeft.x, y: event.upperRight.y}, null),
            map.displayToGcs({x: event.upperRight.x, y: event.upperRight.y}, null),
            map.displayToGcs({x: event.upperRight.x, y: event.lowerLeft.y}, null)
          ]
        };
        this.addAnnotation(rectangleAnnotation(params));
      }
    }
  };

  this._handleMouseMove = function (evt) {
    switch (m_this.mode && m_this.currentAnnotation) {
      case 'polygon':
        var vertices = m_this.currentAnnotation.options().vertices;
        if (vertices.length) {
          vertices[vertices.length - 1] = evt.mapgcs;
        }
        m_this.modified();
        m_this._update();
        m_this.draw();
        break;
      default:
        return;
    }
  };

  this._handleMouseClick = function (evt) {
    console.log('event', evt, m_this.currentAnnotation);  //DWM::

    if (m_this.mode !== 'polygon') {
      console.log('--------START----------');  //DWM::
      m_this.mode = 'polygon';
      m_this.map().node().css('cursor', 'crosshair');
      m_this.currentAnnotation = polygonAnnotation({state: 'create'});
      this.addAnnotation(m_this.currentAnnotation);
      return;
    }
    if (m_this.mode === 'polygon') {
      // if right click or click near first point, end the polygon
      var vertices = m_this.currentAnnotation.options().vertices;
      if (vertices.length) {
        vertices[vertices.length - 1] = evt.mapgcs;
      }
      vertices.push(evt.mapgcs);
      m_this.modified();
      m_this._update();
      m_this.draw();

      return;
    }

    if (!m_this.map().interactor().removeAction(m_actions.rectangle)) {
      m_this.mode = 'rectangle';
      m_this.map().node().css('cursor', 'crosshair');
      m_this.map().interactor().addAction(m_actions.rectangle);
    }
    m_this.mode = null;
  };

  this.addAnnotation = function (annotation) {
    m_annotations.push(annotation);
    this.modified();
    this._update();
    this.draw();
  };

  ///////////////////////////////////////////////////////////////////////////
  /**
   * Update layer
   */
  ///////////////////////////////////////////////////////////////////////////
  this._update = function (request) {
    if (m_this.getMTime() > m_buildTime.getMTime()) {
      $.each(m_features, function (idx, featureLevel) {
        $.each(featureLevel, function (type, feature) {
          feature.data = [];
        });
      });
      $.each(m_annotations, function (annotation_idx, annotation) {
        var features = annotation.features();
        $.each(features, function (idx, featureLevel) {
          if (m_features[idx] === undefined) {
            m_features[idx] = {};
          }
          $.each(featureLevel, function (type, featureSpec) {
            if (!m_features[idx][type]) {
              var feature = m_this.createFeature(type, {
                gcs: m_this.map().gcs(),
                polygon: function (d) {
                  return d.polygon;
                }
              });
              var style = {};
              $.each(['fill', 'fillColor', 'fillOpacity', 'stroke',
                      'strokeColor', 'strokeOpacity', 'strokeWidth',
                      'uniformPolygon'
                  ], function (keyidx, key) {
                var origFunc;
                if (feature.style()[key] !== undefined) {
                  origFunc = feature.style.get(key);
                }
                style[key] = function (d, i, d2, i2) {
                  var style = (
                    (d && d.style) ? d.style : (d && d[2] && d[2].style) ?
                    d[2].style : d2.style);
                  var result = style[key];
                  if (util.isFunction(result)) {
                    result = result(d, i, d2, i2);
                  }
                  if (result === undefined && origFunc) {
                    result = origFunc(d, i, d2, i2);
                  }
                  return result;
                };
              });
              feature.style(style);
              m_features[idx][type] = {
                feature: feature,
                style: style,
                data: []
              };
            }
            m_features[idx][type].data.push(featureSpec);
          });
        });
      });
      $.each(m_features, function (idx, featureLevel) {
        $.each(featureLevel, function (type, feature) {
          feature.feature.data(feature.data);
        });
      });
      m_buildTime.modified();
    }
    s_update.call(m_this, request);
  };

  ///////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ///////////////////////////////////////////////////////////////////////////
  this._init = function () {
    /// Call super class init
    s_init.call(m_this);

    if (!m_this.map().interactor()) {
      m_this.map().interactor(mapInteractor({actions: []}));
    }
    m_this.geoOn(geo_event.actionselection, m_this._processSelection);

    console.log('get mouse click'); //DWM::
    m_this.geoOn(geo_event.mouseclick, m_this._handleMouseClick);
    m_this.geoOn(geo_event.mousemove, m_this._handleMouseMove);

    //DWM:: capture mouse actions on the layer and on child features.
    console.log(m_options); //DWM::
    return m_this;
  };

  ///////////////////////////////////////////////////////////////////////////
  /**
   * Free all resources
   */
  ///////////////////////////////////////////////////////////////////////////
  this._exit = function () {
    /// Call super class exit
    s_exit.call(m_this);
    return m_this;
  };

  m_actions = {
    rectangle: {
      action: geo_action.annotation_rectangle,
      owner: 'annotationLayer',
      input: 'left',
      modifiers: {shift: false, ctrl: false},
      selectionRectangle: true
    }
  };

  return m_this;
};

inherit(annotationLayer, featureLayer);
registry.registerLayer('annotation', annotationLayer);
module.exports = annotationLayer;

/////////////////////////////////////////////////////////////////////////////
/**
 * Base annotation class
 */
/////////////////////////////////////////////////////////////////////////////
var annotation = function (type, args) {
  'use strict';
  if (!(this instanceof annotation)) {
    return new annotation(type, args);
  }

  var m_options = $.extend({}, args || {}),
      m_id = annotationId,
      m_name = args.name || (args.type + ' ' + annotationId),
      m_type = type,
      m_state = args.state || 'done';  /* create, done, edit */
  annotationId += 1;

  this.id = function () {
    return m_id;
  };

  this.name = function (arg) {
    if (arg === undefined) {
      return m_name;
    }
    m_name = arg;
    return this;
  };

  this.state = function (arg) {
    if (arg === undefined) {
      return m_state;
    }
    m_state = arg;
    return this;
  };

  this.options = function () {
    return m_options;
  };

  this.type = function () {
    return m_type;
  };

  // features //DWM::

  this.dragControls = function () {
    /* return a list of drag control structures.  This is the four corners, the
     * four edges, the central region, and a rotation handle.  The drag
     * controls should always use the adjustment styling, and could also
     * specify the appropriate cursor to show over them. */
    //DWM::
  };

  this.geojson = function () {
    // return the annotation as a geojson object
    //DWM:
  };
};

/////////////////////////////////////////////////////////////////////////////
/**
 * Rectangle annotation class
 */
/////////////////////////////////////////////////////////////////////////////
var rectangleAnnotation = function (args) {
  'use strict';
  if (!(this instanceof rectangleAnnotation)) {
    return new rectangleAnnotation(args);
  }
  /* Must specify:
   *   corners: a list of four corners {x: x, y: y} in map gcs coordinates.
   * May specify:
   *   fill, fillColor, fillOpacity, stroke, strokeWidth, strokeColor,
   *   strokeOpacity
   */
  args = $.extend(true, {}, {
    style: {
      fill: true,
      fillColor: {r: 0, g: 1, b: 0},
      fillOpacity: 0.25,
      stroke: true,
      strokeColor: {r: 0, g: 0, b: 0},
      strokeOpacity: 1,
      strokeWidth: 3,
      uniformPolygon: true
    }
  }, args || {});
  annotation.call(this, 'rectangle', args);

  this.features = function () {
    var opt = this.options();
    return [{
      polygon: {
        polygon: opt.corners,
        style: opt.style
      }
    }];
  };
};
inherit(rectangleAnnotation, annotation);

/////////////////////////////////////////////////////////////////////////////
/**
 * Polygon annotation class
 */
/////////////////////////////////////////////////////////////////////////////
var polygonAnnotation = function (args) {
  'use strict';
  if (!(this instanceof polygonAnnotation)) {
    return new polygonAnnotation(args);
  }
  /* Must specify:
   *   vertices: a list of vertices {x: x, y: y} in map gcs coordinates.
   * May specify:
   *   fill, fillColor, fillOpacity, stroke, strokeWidth, strokeColor,
   *   strokeOpacity
   */
  args = $.extend(true, {}, {
    vertices: [],
    style: {
      fill: true,
      fillColor: {r: 0, g: 1, b: 0},
      fillOpacity: 0.25,
      stroke: true,
      strokeColor: {r: 0, g: 0, b: 0},
      strokeOpacity: 1,
      strokeWidth: 3,
      uniformPolygon: true
    },
    editstyle: {
      closed: false,
      fill: true,
      fillColor: {r: 0.3, g: 0.3, b: 0.3},
      fillOpacity: 0.25,
      stroke: false,
      strokeColor: {r: 0, g: 0.843, b: 0},
      strokeOpacity: 1,
      strokeWidth: 3,
      uniformPolygon: true
    }
  }, args || {});
  annotation.call(this, 'polygon', args);

  this.features = function () {
    var opt = this.options();
    var state = this.state();
    var features;
    switch (state) {
      case 'create':
        features = [];
        if (opt.vertices && opt.vertices.length >= 3) {
          features[0] = {
            polygon: {
              polygon: opt.vertices,
              style: opt.editstyle
            }
          };
        }
        if (opt.vertices && opt.vertices.length >= 2) {
          features[1] = {
            line: {
              line: opt.vertices,
              style: opt.editstyle
            }
          };
        }
        break;
      default:
        features = [{
          polygon: {
            polygon: opt.vertices,
            style: opt.style
          }
        }];
        break;
    }
    return features;
  };
};
inherit(polygonAnnotation, annotation);

