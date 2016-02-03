var quadDebug = {};

// Run after the DOM loads
$(function () {
  'use strict';

  var map = geo.map({
    node: '#map',
    center: {
      x: -88.0,
      y: 29
    },
    zoom: 4
  });
  var layer = map.createLayer('feature', {renderer: 'vgl'});
  var quads = layer.createFeature('quad', {selectionAPI: true});
  var previewImage = new Image();
  previewImage.onload = function () {

    quads
      .data([{
        ll: {x: -108, y: 29},
        ur: {x: -88, y: 49},
        image: '/data/tilefancy.png'
      }, {
        ll: {x: -88, y: 29},
        ur: {x: -58, y: 49},
        image: '../tiles/thumb.jpg',
        opacity: 0.75
      }, {
        ul: {x: -108, y: 29},
        ur: {x: -58, y: 29},
        ll: {x: -98, y: 9},
        lr: {x: -68, y: 9},
        previewImage: null,
        image: '../deepzoom/thumb.jpg'
      }, {
        lr: {x: -58, y: 29},
        ur: {x: -58, y: 49},
        ul: {x: -38, y: 54},
        ll: {x: -33, y: 34},
        image: '../choropleth/thumb.jpg',
        opacity: 0.15
      }, {
        ll: {x: -33, y: 34},
        lr: {x: -33, y: 9},
        ur: {x: -68, y: 9},
        ul: {x: -58, y: 29},
        image: '/data/tilefancy.png'
      }, {
        ll: {x: -128, y: 29},
        ur: {x: -108, y: 49},
        image: '/data/nosuchimage.png'
      }, {
        ul: {x: -128, y: 29},
        ur: {x: -108, y: 29},
        ll: {x: -123, y: 9},
        lr: {x: -98, y: 9},
        previewImage: null,
        image: '/data/nosuchimage.png'
      }, {
        ul: {x: -148, y: 29},
        ur: {x: -128, y: 29},
        ll: {x: -148, y: 9},
        lr: {x: -123, y: 9},
        previewImage: previewImage,
        image: '/data/nosuchimage.png'
      }, {
        ll: {x: -138, y: 29},
        ur: {x: -128, y: 39},
        color: '#FF0000'
      }, {
        ll: {x: -148, y: 39},
        ur: {x: -138, y: 49},
        color: '#FF0000'
      }, {
        ll: {x: -138, y: 39},
        ur: {x: -128, y: 49},
        color: '#00FFFF'
      }, {
        ll: {x: -148, y: 29},
        ur: {x: -138, y: 39},
        opacity: 0.25,
        color: '#0000FF'
      /* You can specify quads so that the corners are 'twisted' and the quad
       * would be non-convex.  In this case, the quads are each rendered as a
       * pair of triangles, but they probably aren't what is desired.
      }, {
        ll: {x: -108, y: 49},
        lr: {x: -88, y: 49},
        ur: {x: -108, y: 59},
        ul: {x: -88, y: 59},
        image: '/data/tilefancy.png'
      }, {
        ll: {x: -88, y: 49},
        ur: {x: -68, y: 49},
        ul: {x: -88, y: 59},
        lr: {x: -68, y: 59},
        image: '/data/tilefancy.png'
      */
      }])
      .style({
        opacity: function (d) {
          return d.opacity !== undefined ? d.opacity : 1;
        },
        color: function (d) {
          return d.color;
        },
        previewColor: {r: 1, g: 0.75, b: 0.75},
        previewImage: function (d) {
          return d.previewImage !== undefined ? d.previewImage : previewImage;
        }
      })
      .geoOn(geo.event.feature.mouseover, function (evt) {
        if (evt.data.orig_opacity === undefined) {
          evt.data.orig_opacity = (evt.data.opacity || null);
        }
        evt.data.opacity = 0.5;
        // we either have to clear the internal cache on the item, or have
        // asked for it not to have been cached to begin with.
        delete evt.data._cachedQuad;
        this.modified();
        layer.map().draw();
      })
      .geoOn(geo.event.feature.mouseout, function (evt) {
        if (evt.data.orig_opacity === undefined) {
          evt.data.orig_opacity = (evt.data.opacity || null);
        }
        evt.data.opacity = evt.data.orig_opacity || undefined;
        delete evt.data._cachedQuad;
        this.modified();
        layer.map().draw();
      })
      .draw();

    map.draw();

    quadDebug.map = map;
    quadDebug.layer = layer;
    quadDebug.quads = quads;
  };

  previewImage.src = '/data/grid.jpg';
});
