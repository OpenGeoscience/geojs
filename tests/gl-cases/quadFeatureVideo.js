// Test video quadFeature

/* global HTMLVideoElement */

var geo = require('../test-utils').geo;
var createMap = require('../test-utils').createMap;
var waitForIt = require('../test-utils').waitForIt;

describe('geo.util.isReadyVideo', function () {
  'use strict';

  it('isReadyVideo', function (done) {
    var video = document.createElement('video'),
        video2 = document.createElement('video'),
        video3 = document.createElement('video'),
        image = document.createElement('image');
    video3.onerror = function () {
      video.onloadeddata = function () {
        expect(geo.util.isReadyVideo(video)).toBe(true);
        expect(geo.util.isReadyVideo(video2)).toBe(false);
        expect(geo.util.isReadyVideo(video3)).toBe(false);
        expect(geo.util.isReadyVideo(image)).toBe(false);
        expect(geo.util.isReadyVideo(video, true)).toBe(true);
        expect(geo.util.isReadyVideo(video2, true)).toBe(false);
        expect(geo.util.isReadyVideo(video3, true)).toBe(true);
        expect(geo.util.isReadyVideo(image, true)).toBe(false);
        done();
      };
      video.src = '/data/earthquakes-video.webm';
    };
    video3.src = 'nosuchvideo';
  });
});

describe('geo.quadFeature video', function () {
  'use strict';

  var map, layer, quads;

  it('single video quad', function (done) {
    var videoWidth = 640, videoHeight = 360;
    var params = geo.util.pixelCoordinateParams('#map', videoWidth, videoHeight);
    map = createMap(params.map);
    layer = map.createLayer('feature', {features: ['quad.video']});
    quads = layer.createFeature('quad');
    quads.data([{
      ul: {x: 0, y: 0},
      lr: {x: videoWidth, y: videoHeight},
      video: '/data/earthquakes-video.webm'
    }]);
    expect(quads.video(0) instanceof HTMLVideoElement).toBe(true);
    quads.draw();
    map.onIdle(function () {
      expect(quads.video(0) instanceof HTMLVideoElement).toBe(true);
      expect(quads.video(quads.data()[0])).toBe(quads.video(0));
      // test playing
      expect(quads.video(0).currentTime).toBe(0);
      expect(quads.video(0).paused).toBe(true);
      quads.video(0).play();
      expect(quads.video(0).paused).toBe(false);
      done();
    });
  });
  waitForIt('playing', function () {
    return quads.video(0).currentTime > 0;
  });
  it('check playing', function () {
    expect(quads.video(0).currentTime).toBeGreaterThan(0);
    // seeking (setting currentTime) is not tested as it doesn't appear to work
    // in the headless environment
  });

  it('video element', function (done) {
    var video = document.createElement('video');
    video.onloadeddata = function () {
      map = createMap({});
      layer = map.createLayer('feature', {features: ['quad.video']});
      quads = layer.createFeature('quad');
      quads.data([{
        ul: {x: -129.0625, y: 42.13468456089552},
        lr: {x: -100.9375, y: 29.348416310781797},
        video: video
      }]);
      expect(quads.video(0) instanceof HTMLVideoElement).toBe(true);
      quads.draw();
      expect(quads.video(0) instanceof HTMLVideoElement).toBe(true);
      expect(quads.video(0)).toBe(video);
      done();
    };
    video.src = '/data/earthquakes-video.webm';
  });

  it('preview colors and bad urls', function (done) {
    map = createMap({});
    layer = map.createLayer('feature', {features: ['quad.video']});
    quads = layer.createFeature('quad');
    quads.style({
      previewColor: function (d) {
        return d.previewColor;
      },
      drawOnAsyncResourceLoaded: function (d) {
        return d.asyncload !== undefined ? d.asyncload : true;
      }
    });
    quads.data([{
      ul: {x: -110, y: 40},
      lr: {x: -100, y: 30},
      previewColor: 'pink',
      video: 'nosuchvideo'
    }, {
      ul: {x: -120, y: 40},
      lr: {x: -110, y: 30},
      previewColor: 'notacolor',
      video: 'nosuchvideo'
    }, {
      ul: {x: -130, y: 40},
      lr: {x: -120, y: 30},
      video: 'nosuchvideo'
    }, {
      ul: {x: -140, y: 40},
      lr: {x: -130, y: 30},
      previewColor: 'pink',
      video: '/data/earthquakes-video.webm'
    }, {
      ul: {x: -150, y: 40},
      lr: {x: -140, y: 30},
      previewColor: 'notacolor',
      video: '/data/earthquakes-video.webm'
    }, {
      ul: {x: -160, y: 40},
      lr: {x: -150, y: 30},
      video: '/data/earthquakes-video.webm'
    }, {
      ul: {x: -170, y: 40},
      lr: {x: -160, y: 30},
      previewColor: 'pink',
      asyncload: false,
      video: '/data/earthquakes-video.webm'
    }, {
      ul: {x: -180, y: 40},
      lr: {x: -170, y: 30},
      previewColor: 'notacolor',
      asyncload: false,
      video: '/data/earthquakes-video.webm'
    }, {
      ul: {x: -190, y: 40},
      lr: {x: -180, y: 30},
      asyncload: false,
      video: '/data/earthquakes-video.webm'
    }]);
    var gq = quads._generateQuads();
    expect(gq.clrQuads.length).toBe(3);
    expect(gq.vidQuads.length).toBe(7);
    quads.draw();
    map.onIdle(function () {
      expect(quads.video(0) instanceof HTMLVideoElement).toBe(false);
      expect(quads.video(1) instanceof HTMLVideoElement).toBe(false);
      expect(quads.video(2) instanceof HTMLVideoElement).toBe(false);
      expect(quads.video(3) instanceof HTMLVideoElement).toBe(true);
      expect(quads.video(4) instanceof HTMLVideoElement).toBe(true);
      expect(quads.video(5) instanceof HTMLVideoElement).toBe(true);
      expect(quads.video(6) instanceof HTMLVideoElement).toBe(false);
      expect(quads.video(7) instanceof HTMLVideoElement).toBe(true);
      expect(quads.video(8) instanceof HTMLVideoElement).toBe(true);
      expect(gq.clrQuads.length).toBe(2);
      expect(gq.vidQuads.length).toBe(7);
      done();
    });
  });
});
