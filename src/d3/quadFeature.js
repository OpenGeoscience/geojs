var inherit = require('../inherit');
var registerFeature = require('../registry').registerFeature;
var quadFeature = require('../quadFeature');

/**
 * Create a new instance of class quadFeature.
 *
 * @class geo.d3.quadFeature
 * @param {geo.quadFeature.spec} arg Options object.
 * @extends geo.quadFeature
 * @returns {geo.d3.quadFeature}
 */
var d3_quadFeature = function (arg) {
  'use strict';
  if (!(this instanceof d3_quadFeature)) {
    return new d3_quadFeature(arg);
  }

  var $ = require('jquery');
  var d3 = require('./d3Renderer').d3;
  var object = require('./object');

  quadFeature.call(this, arg);
  object.call(this);

  var m_this = this,
      s_exit = this._exit,
      s_init = this._init,
      s_update = this._update,
      m_quads;

  /**
   * Build this feature.
   */
  this._build = function () {
    if (!this.position()) {
      return;
    }
    var renderer = this.renderer(),
        map = renderer.layer().map();

    m_quads = this._generateQuads();

    var data = [];
    $.each(m_quads.clrQuads, function (idx, quad) {
      data.push({type: 'clr', quad: quad, zIndex: quad.pos[2]});
    });
    $.each(m_quads.imgQuads, function (idx, quad) {
      if (quad.image) {
        data.push({type: 'img', quad: quad, zIndex: quad.pos[2]});
      }
    });

    var feature = {
      id: this._d3id(),
      data: data,
      dataIndex: function (d) {
        return d.quad.quadId;
      },
      append: function (d) {
        var ns = this.namespaceURI,
            element = d.type === 'clr' ? 'polygon' : 'image';
        return (ns ? document.createElementNS(ns, element) :
                document.createElement(element));
      },
      attributes: {
        fill: function (d) {
          if (d.type === 'clr') {
            return d3.rgb(255 * d.quad.color.r, 255 * d.quad.color.g,
                          255 * d.quad.color.b);
          }
          /* set some styles here */
          if (d.quad.opacity !== 1) {
            d3.select(this).style('opacity', d.quad.opacity);
          }
        },
        height: function (d) {
          return d.type === 'clr' ? undefined : 1;
        },
        points: function (d) {
          if (d.type === 'clr' && !d.points) {
            var points = [], i;
            for (i = 0; i < d.quad.pos.length; i += 3) {
              var p = {
                x: d.quad.pos[i],
                y: d.quad.pos[i + 1],
                z: d.quad.pos[i + 2]
              };
              /* We don't use 'p = m_this.featureGcsToDisplay(p);' because the
               * quads have already been converted to the map's gcs (no longer
               * the feature's gcs or map's ingcs). */
              p = map.gcsToDisplay(p, null);
              p = renderer.baseToLocal(p);
              points.push('' + p.x + ',' + p.y);
            }
            d.points = (points[0] + ' ' + points[1] + ' ' + points[3] + ' ' +
                        points[2]);
          }
          return d.type === 'clr' ? d.points : undefined;
        },
        preserveAspectRatio: function (d) {
          return d.type === 'clr' ? undefined : 'none';
        },
        reference: function (d) {
          return d.quad.reference;
        },
        stroke: false,
        transform: function (d) {
          if (d.type === 'img' && d.quad.image && !d.svgTransform) {
            var pos = [], area, maxarea = -1, maxv, i, imgscale,
                imgw = d.quad.image.width, imgh = d.quad.image.height;
            for (i = 0; i < d.quad.pos.length; i += 3) {
              var p = {
                x: d.quad.pos[i],
                y: d.quad.pos[i + 1],
                z: d.quad.pos[i + 2]
              };
              /* We don't use 'p = m_this.featureGcsToDisplay(p);' because the
               * quads have already been converted to the map's gcs (no longer
               * the feature's gcs or map's ingcs). */
              p = map.gcsToDisplay(p, null);
              p = renderer.baseToLocal(p);
              pos.push(p);
            }
            /* We can only fit three corners of the quad to the image, but we
             * get to pick which three.  We choose to always include the
             * largest of the triangles formed by a set of three vertices.  The
             * image is always rendered as a parallelogram, so it may be larger
             * than desired, and, for convex quads, miss some of the intended
             * area. */
            for (i = 0; i < 4; i += 1) {
              area = Math.abs(
                pos[(i + 1) % 4].x * (pos[(i + 2) % 4].y - pos[(i + 3) % 4].y) +
                pos[(i + 2) % 4].x * (pos[(i + 3) % 4].y - pos[(i + 1) % 4].y) +
                pos[(i + 3) % 4].x * (pos[(i + 1) % 4].y - pos[(i + 2) % 4].y)) / 2;
              if (area > maxarea) {
                maxarea = area;
                maxv = i;
              }
            }
            d.svgTransform = [
              maxv === 3 || maxv === 2 ? pos[1].x - pos[0].x : pos[3].x - pos[2].x,
              maxv === 3 || maxv === 2 ? pos[1].y - pos[0].y : pos[3].y - pos[2].y,
              maxv === 0 || maxv === 2 ? pos[1].x - pos[3].x : pos[0].x - pos[2].x,
              maxv === 0 || maxv === 2 ? pos[1].y - pos[3].y : pos[0].y - pos[2].y,
              maxv === 2 ? pos[3].x + pos[0].x - pos[1].x : pos[2].x,
              maxv === 2 ? pos[3].y + pos[0].y - pos[1].y : pos[2].y
            ];
            if (Math.abs(d.svgTransform[1] / imgw) < 1e-6 &&
                Math.abs(d.svgTransform[2] / imgh) < 1e-6) {
              imgscale = d.svgTransform[0] / imgw;
              d.svgTransform[4] = Math.round(d.svgTransform[4] / imgscale) * imgscale;
              imgscale = d.svgTransform[3] / imgh;
              d.svgTransform[5] = Math.round(d.svgTransform[5] / imgscale) * imgscale;
            }
          }
          return ((d.type !== 'img' || !d.quad.image) ? undefined :
                  'matrix(' + d.svgTransform.join(' ') + ')');
        },
        width: function (d) {
          return d.type === 'clr' ? undefined : 1;
        },
        x: function (d) {
          return d.type === 'clr' ? undefined : 0;
        },
        'xlink:href': function (d) {
          return ((d.type === 'clr' || !d.quad.image) ? undefined :
                  d.quad.image.src);
        },
        y: function (d) {
          return d.type === 'clr' ? undefined : 0;
        }
      },
      style: {
        fillOpacity: function (d) {
          return d.type === 'clr' ? d.quad.opacity : undefined;
        }
      },
      onlyRenderNew: !this.style('previewColor') && !this.style('previewImage'),
      sortByZ: true,
      visible: m_this.visible,
      classes: ['d3QuadFeature']
    };
    renderer._drawFeatures(feature);

    this.buildTime().modified();
  };

  /**
   * Update the feature.
   *
   * @returns {this}
   */
  this._update = function () {
    s_update.call(m_this);
    if (m_this.buildTime().getMTime() <= m_this.dataTime().getMTime() ||
        m_this.buildTime().getMTime() < m_this.getMTime()) {
      m_this._build();
    }
    return m_this;
  };

  /**
   * Initialize.
   */
  this._init = function () {
    s_init.call(m_this, arg);
  };

  /**
   * Destroy.
   */
  this._exit = function () {
    s_exit.call(m_this);
  };

  m_this._init(arg);
  return this;
};

inherit(d3_quadFeature, quadFeature);

// Now register it
var capabilities = {};
capabilities[quadFeature.capabilities.color] = true;
capabilities[quadFeature.capabilities.image] = true;
capabilities[quadFeature.capabilities.imageCrop] = false;
capabilities[quadFeature.capabilities.imageFixedScale] = false;
capabilities[quadFeature.capabilities.imageFull] = false;
capabilities[quadFeature.capabilities.canvas] = false;
capabilities[quadFeature.capabilities.video] = false;

registerFeature('d3', 'quad', d3_quadFeature, capabilities);
module.exports = d3_quadFeature;
