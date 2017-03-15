/* globals Image */

describe('glQuad', function () {
  var imageTest = require('../image-test');
  var common = require('../test-common');

  var myMap;

  beforeEach(function () {
    imageTest.prepareImageTest();
  });

  afterEach(function () {
    myMap.exit();
  });

  it('quads', function (done) {
    var mapOptions = {center: {x: -83.0, y: 39}, zoom: 3.5};
    myMap = common.createOsmMap(mapOptions, {}, true);

    var layer = myMap.createLayer('feature', {renderer: 'vgl'});
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
          image: '/examples/quads/flower1.jpg',
          opacity: 0.75
        }, {
          ul: {x: -108, y: 29},
          ur: {x: -58, y: 29},
          ll: {x: -98, y: 9},
          lr: {x: -68, y: 9},
          previewImage: null,
          image: '/examples/quads/flower3.jpg'
        }, {
          lr: {x: -58, y: 29},
          ur: {x: -58, y: 49},
          ul: {x: -38, y: 54},
          ll: {x: -33, y: 34},
          image: '/examples/quads/flower2.jpg',
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
        .draw();

      myMap.draw();

      imageTest.imageTest('glQuad', null, 0.0015, done, myMap.onIdle, 0, 2);
    };

    previewImage.src = '/data/grid.jpg';
  });
});
