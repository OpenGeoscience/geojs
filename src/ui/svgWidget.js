geo.gui.svgWidget = function (arg) {
  'use strict';
  if (!(this instanceof geo.gui.svgWidget)) {
    return new geo.gui.svgWidget(arg);
  }

  geo.gui.domWidget.call(this, arg);

  var m_this = this,
      m_width = null,
      m_height = null,
      m_corners = null,
      m_features = {},
      m_scale = 1,
      m_dx = 0,
      m_dy = 0,
      m_id = 'd3-' + geo.d3.uniqueID();

  this._d3id = function () {
    return m_id;
  };

  this.scaleFactor = function () {
    return m_scale;
  };

  this.draw = function () {};

  function setAttrs(select, attrs) {
    var key;
    for (key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        select.attr(key, attrs[key]);
      }
    }
  }

  function initCorners() {
    var layer = m_this.layer(),
        map = layer.map(),
        width = m_this.layer().width(),
        height = m_this.layer().height();

    m_width = width;
    m_height = height;
    if (!m_width || !m_height) {
      throw 'Map layer has size 0';
    }
    m_corners = {
      'upperLeft': map.displayToGcs({'x': 0, 'y': 0}),
      'lowerRight': map.displayToGcs({'x': width, 'y': height})
    };
  }

  function setTransform() {
    if (!m_corners) {
      initCorners();
    }

    if (!m_this.args.sticky) {
      return;
    }

    var layer = m_this.layer(),
        map = layer.map(),
        upperLeft = map.gcsToDisplay(m_corners.upperLeft),
        lowerRight = map.gcsToDisplay(m_corners.lowerRight),
        dx, dy, scale;

    // calculate the translation
    dx = upperLeft.x;
    dy = upperLeft.y;

    // calculate the scale
    scale = (lowerRight.y - upperLeft.y) / m_height;

    // set the group transform property
    //group.attr('transform', 'matrix(' + [scale, 0, 0, scale, dx, dy].join() + ')');

    // set internal variables
    m_scale = scale;
    m_dx = dx;
    m_dy = dy;
  }

  this._createCanvas = function () {
    if (!m_this.canvas()) {
      m_this.canvas(d3.select(m_this.parentCanvas()).append('svg')[0][0]);

      d3.select(m_this.canvas()).attr('class', m_this._d3id());

      // @todo do we want these defs to be defined for *every* svg widget?
      var m_defs = d3.select(m_this.canvas()).append('defs');

      var shadow = m_defs
            .append('filter')
            .attr('id', 'geo-highlight')
            .attr('x', '-100%')
            .attr('y', '-100%')
            .attr('width', '300%')
            .attr('height', '300%');
      shadow
        .append('feMorphology')
        .attr('operator', 'dilate')
        .attr('radius', 2)
        .attr('in', 'SourceAlpha')
        .attr('result', 'dilateOut');
      shadow
        .append('feGaussianBlur')
        .attr('stdDeviation', 5)
        .attr('in', 'dilateOut')
        .attr('result', 'blurOut');
      shadow
        .append('feColorMatrix')
        .attr('type', 'matrix')
        .attr('values', '-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0')
        .attr('in', 'blurOut')
        .attr('result', 'invertOut');
      shadow
        .append('feBlend')
        .attr('in', 'SourceGraphic')
        .attr('in2', 'invertOut')
        .attr('mode', 'normal');

      shadow = m_defs.append('filter')
        .attr('id', 'geo-blur')
        .attr('x', '-100%')
        .attr('y', '-100%')
        .attr('width', '300%')
        .attr('height', '300%');

      shadow
        .append('feGaussianBlur')
        .attr('stdDeviation', 20)
        .attr('in', 'SourceGraphic');

      // sticky, class, width, height, grouping
    }
  };

  this._appendChild = function () {
    m_this.parentCanvas().appendChild(m_this.canvas());
  };

  this._resize = function (x, y, w, h) {
    if (!m_corners) {
      initCorners();
    }
    d3.select(m_this.canvas()).attr('width', w);
    d3.select(m_this.canvas()).attr('height', h);
    setTransform();
    m_this.layer().geoTrigger(geo.event.d3Rescale, { scale: m_scale }, true);
  };

  this._init = function () {
    arg = arg || {};
    m_this.args = arg;
    m_this.args.sticky = arg.sticky || false;
    m_this.args.positionType = arg.positionType || 'viewport';

    if (arg.hasOwnProperty('parent') && arg.parent instanceof geo.gui.widget) {
      arg.parent.addChild(m_this);
    }

    m_this._createCanvas();
    m_this._appendChild();

    m_this.canvas().addEventListener('mousedown', function (e) {
      e.stopPropagation();
    });

    this.reposition();
  };

  // @todo docs lost
  this._removeFeature = function (id) {
    m_this.select(id).remove();
    delete m_features[id];
    return m_this;
  };

  this._drawFeatures = function (arg) {
    m_features[arg.id] = {
      data: arg.data,
      index: arg.dataIndex,
      style: arg.style,
      attributes: arg.attributes,
      classes: arg.classes,
      append: arg.append
    };
    return m_this.__render(arg.id);
  };

  function setStyles(selection, style) {
    selection = style = null;
    console.log('setStyles not yet implemented from renderer');
  }

  this.__render = function (id) {
    var key;
    if (id === undefined) {
      for (key in m_features) {
        if (m_features.hasOwnProperty(key)) {
          m_this.__render(key);
        }
      }
      return m_this;
    }
    var data = m_features[id].data,
        index = m_features[id].index,
        style = m_features[id].style,
        attributes = m_features[id].attributes,
        classes = m_features[id].classes,
        append = m_features[id].append,
        selection = m_this.select(id).data(data, index);
    selection.enter().append(append);
    selection.exit().remove();
    setAttrs(selection, attributes);
    selection.attr('class', classes.concat([id]).join(' '));
    setStyles(selection, style);
    return m_this;
  };


  this.layer().geoOn(geo.event.pan, setTransform);

  this.layer().geoOn(geo.event.resize, function (event) {
    m_this._resize(event.x, event.y, event.width, event.height);
  });

  this.layer().geoOn(geo.event.zoom, function () {
    setTransform();
    m_this.__render();
    m_this.layer().geoTrigger(geo.event.d3Rescale, { scale: m_scale }, true);
  });

  return this;
};

inherit(geo.gui.svgWidget, geo.gui.domWidget);

geo.registerWidget('dom', 'svg', geo.gui.svgWidget);
