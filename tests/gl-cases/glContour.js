var $ = require('jquery');

describe('glContour', function () {
  var imageTest = require('../image-test');
  var common = require('../test-common');

  var myMap;

  beforeEach(function () {
    imageTest.prepareImageTest();
  });

  afterEach(function () {
    myMap.exit();
  });

  /** Test contours
   *
   * @param {string} imageName: name used for the image test.
   * @param {object} opts: display options, including:
   *    url: the url to load.  Defaults to oahu.json.
   *    range: one of false, true, 'nonlinear', or 'iso'.  Default false.
   *    stepped: boolean, default true.
   * @param {function} done: function to call when the test is complete.
   */
  function testContour(imageName, opts, done) {
    var mapOptions = {center: {x: -157.965, y: 21.482}, zoom: 10};
    myMap = common.createOsmMap(mapOptions, {}, true);

    var layer = myMap.createLayer('feature', {renderer: 'vgl'});
    var url = '/data/' + (opts.url || 'oahu.json');
    $.getJSON(url, {format: 'json'}).done(function (data) {

      var contour = layer.createFeature('contour')
        .data(data.position || data.values)
        .style({
          opacity: 0.75
        })
        .contour({
          gridWidth: data.gridWidth,
          gridHeight: data.gridHeight,
          min: 0
        });
      if (data.position) {
        contour
          .position(function (d) { return {x: d.x, y: d.y, z: d.z}; })
          .style({
            value: function (d) { return d.z > -9999 ? d.z : null; }
          });
      } else {
        contour
          .style({
            value: function (d) { return d > -9999 ? d : null; }
          })
          .contour({
            /* The geometry can be specified using 0-point coordinates and
             * deltas since it is a regular grid. */
            x0: data.x0, y0: data.y0, dx: data.dx, dy: data.dy
          });
      }
      if (opts.range) {
        contour
        .style({
          opacity: 1
        })
        .contour({
          minColor: 'blue',
          minOpacity: 0.5,
          maxColor: 'red',
          maxOpacity: 0.5
        });
        switch (opts.range) {
          case 'nonlinear':
            contour
            .contour({
              rangeValues: [0, 25, 50, 75, 100, 125, 250, 500, 750, 2000]
            });
            break;
          case 'iso':
            contour
            .contour({
              rangeValues: [100, 100, 200, 200, 300, 300, 400, 400, 500, 500],
              opacityRange: [1, 0, 1, 0, 1, 0, 1, 0, 1],
              minOpacity: 0,
              maxOpacity: 0
            });
            break;
          default:
            contour
            .contour({
              min: 100,
              max: 500,
              colorRange: [
                '#FF00FF', '#CC33CC', '#996699',
                '#669966', '#33CC33', '#00FF00'
              ],
              opacityRange: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
            });
            break;
        }
      }
      if (opts.stepped === false) {
        contour
        .contour({
          stepped: false
        });
      }
      myMap.draw();

      imageTest.imageTest(imageName, null, 0.0015, done, myMap.onIdle, 0, 2);
    });
  }

  it('contours', function (done) {
    testContour('glContour', {}, done);
  });

  it('contours with options', function (done) {
    // geo from x0, specified min-max, set color range, smooth
    testContour('glContourOptions', {
      url: 'oahu-dense.json',
      range: true,
      stepped: false
    }, done);
  });

  it('contours with options', function (done) {
    // geo from x0, specified min-max, set color range, smooth
    testContour('glContourOptions', {
      url: 'oahu-dense.json',
      range: true,
      stepped: false
    }, done);
  });

  it('contours with nonlinear range', function (done) {
    // geo from x0, non-linear range
    testContour('glContourRange', {
      url: 'oahu-dense.json',
      range: 'nonlinear'
    }, done);
  });

  it('contours with iso range', function (done) {
    // geo from x0, iso-like range
    testContour('glContourIso', {
      url: 'oahu-dense.json',
      range: 'iso'
    }, done);
  });
});
