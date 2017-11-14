/* globals $, geo, utils */

var quadDebug = {};

// Run after the DOM loads
$(function () {
  'use strict';

  var query = utils.getQuery();
  var map = geo.map({
    node: '#map',
    center: {
      x: -88.0,
      y: 29
    },
    zoom: 4
  });
  var layer = map.createLayer('feature', {
    renderer: query.renderer ? (query.renderer === 'html' ? null : query.renderer) : undefined,
    features: query.renderer ? undefined : ['quad']
  });
  var previewImage = new Image();
  var quads = layer.createFeature('quad', {selectionAPI: true});
  var quadData = [{
    ll: {x: -108, y: 29},
    ur: {x: -88, y: 49},
    image: '../../data/tilefancy.png'
  }, {
    ll: {x: -88, y: 29},
    ur: {x: -58, y: 49},
    image: 'flower1.jpg',
    opacity: 0.75
  }, {
    ul: {x: -108, y: 29},
    ur: {x: -58, y: 29},
    ll: {x: -98, y: 9},
    lr: {x: -68, y: 9},
    previewImage: null,
    image: 'flower3.jpg'
  }, {
    lr: {x: -58, y: 29},
    ur: {x: -58, y: 49},
    ul: {x: -38, y: 54},
    ll: {x: -33, y: 34},
    image: 'flower2.jpg',
    opacity: 0.15
  }, {
    ll: {x: -33, y: 34},
    lr: {x: -33, y: 9},
    ur: {x: -68, y: 9},
    ul: {x: -58, y: 29},
    image: '../../data/tilefancy.png'
  }, {
    ll: {x: -128, y: 29},
    ur: {x: -108, y: 49},
    image: '../../data/nosuchimage.png'
  }, {
    ul: {x: -128, y: 29},
    ur: {x: -108, y: 29},
    ll: {x: -123, y: 9},
    lr: {x: -98, y: 9},
    previewImage: null,
    image: '../../data/nosuchimage.png'
  }, {
    ul: {x: -148, y: 29},
    ur: {x: -128, y: 29},
    ll: {x: -148, y: 9},
    lr: {x: -123, y: 9},
    previewImage: previewImage,
    image: '../../data/nosuchimage.png'
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
  }];
  if (query.canvas === 'true') {
    // You can render a canvas on a quad, but only on the canvas and vgl
    // renderers.  On the vgl renderer, it may not update when the quad's
    // canvas element is changed.
    var canvasElement = document.createElement('canvas');
    canvasElement.width = 640;
    canvasElement.height = 480;
    var context = canvasElement.getContext('2d');
    var gradient = context.createRadialGradient(320, 240, 0, 320, 240, 320);
    gradient.addColorStop(0, 'black');
    gradient.addColorStop(1, 'green');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 640, 480);
    quadData.push({
      ul: {x: -98, y: 9},
      ur: {x: -68, y: 9},
      ll: {x: -98, y: -11},
      lr: {x: -68, y: -11},
      image: canvasElement
    });
    // change the gradient after 10 seconds
    window.setTimeout(function () {
      var gradient = context.createRadialGradient(320, 240, 0, 320, 240, 320);
      gradient.addColorStop(0, 'green');
      gradient.addColorStop(1, 'black');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 640, 480);
      quads.draw();
    }, 10000);
  }
  if (query.video === 'true') {
    /* You can render videos on a quad.  This is currently only supported on
     * the canvas renderer. */
    quadData.push({
      ul: {x: -128, y: 9},
      lr: {x: -98, y: -11},
      video: '../../data/earthquakes-video.webm'
    });
    /* Add the same video via a video element and flip it vertically. */
    var vid = document.createElement('video');
    vid.src = '../../data/earthquakes-video.webm';
    quadData.push({
      ll: {x: -158, y: 9},
      ur: {x: -128, y: -11},
      video: vid
    });
  }
  if (query.warped === 'true') {
    /* You can specify quads so that the corners are 'twisted' and the quad
     * would be non-convex.  In this case, the quads are each rendered as a
     * pair of triangles, but they probably aren't what is desired. */
    quadData.push({
      ll: {x: -108, y: 49},
      lr: {x: -88, y: 49},
      ur: {x: -108, y: 59},
      ul: {x: -88, y: 59},
      image: '../../data/tilefancy.png'
    });
    quadData.push({
      ll: {x: -88, y: 49},
      ur: {x: -68, y: 49},
      ul: {x: -88, y: 59},
      lr: {x: -68, y: 59},
      image: '../../data/tilefancy.png'
    });
  }
  previewImage.onload = function () {

    quads
      .data(quadData)
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
        this.cacheUpdate(evt.data);
        this.draw();
        // if this is a video element, start it playing
        if (quads.video(evt.data)) {
          quads.video(evt.data).currentTime = 0;
          quads.video(evt.data).play();
        }
      })
      .geoOn(geo.event.feature.mouseout, function (evt) {
        if (evt.data.orig_opacity === undefined) {
          evt.data.orig_opacity = (evt.data.opacity || null);
        }
        evt.data.opacity = evt.data.orig_opacity || undefined;
        this.cacheUpdate(evt.data);
        this.draw();
      })
      .draw();

    quadDebug.map = map;
    quadDebug.layer = layer;
    quadDebug.quads = quads;
  };

  previewImage.src = '../../data/grid.jpg';
});
