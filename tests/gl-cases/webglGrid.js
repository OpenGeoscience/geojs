var $ = require('jquery');

describe('webglGrid', function () {
  var imageTest = require('../image-test');
  var common = require('../test-common');

  var myMap;

  beforeEach(function () {
    imageTest.prepareImageTest();
  });

  afterEach(function () {
    myMap.exit();
  });

  /** Test grids
   *
   * @param {string} imageName: name used for the image test.
   * @param {object} opts: display options, including:
   *    url: the url to load.  Defaults to oahu.json.
   *    range: one of false, true, 'nonlinear', or 'iso'.  Default false.
   *    stepped: boolean, default true.
   * @param {function} done: function to call when the test is complete.
   */
  function testGrid(imageName, opts, done) {
    var mapOptions = {center: {x: -157.965, y: 21.482}, zoom: 10};
    myMap = common.createOsmMap(mapOptions, {}, true);

    var layer = myMap.createLayer('feature', {renderer: 'webgl'});
    var url = '/data/' + (opts.url || 'oahu-dense.json');
    $.getJSON(url, {format: 'json'}).done(function (data) {

      var grid = layer.createFeature('grid')
        .data(data.position || data.values)
        .style({
          opacity: 0.75,
          value: function (d) { return d > -9999 ? d : null; }
        })
        .grid({
          gridWidth: data.gridWidth + 1,
          gridHeight: data.gridHeight + 1,
          min: 0,
          x0: data.x0,
          y0: data.y0,
          dx: data.dx,
          dy: data.dy
        });
      if (opts.range) {
        grid
        .style({
          opacity: 1
        })
        .grid({
          minColor: 'blue',
          minOpacity: 0.5,
          maxColor: 'red',
          maxOpacity: 0.5
        });
        switch (opts.range) {
          case 'nonlinear':
            grid
            .grid({
              rangeValues: [0, 25, 50, 75, 100, 125, 250, 500, 750, 2000]
            });
            break;
          case 'iso':
            grid
            .grid({
              rangeValues: [100, 100, 200, 200, 300, 300, 400, 400, 500, 500],
              opacityRange: [1, 0, 1, 0, 1, 0, 1, 0, 1],
              minOpacity: 0,
              maxOpacity: 0
            });
            break;
          default:
            grid
            .grid({
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
        grid
        .grid({
          stepped: false
        });
      }
      myMap.draw();

      imageTest.imageTest(imageName, null, 0.0015, done, myMap.onIdle, 5000, 2);
    });
  }

  it('grids with options', function (done) {
    // geo from x0, specified min-max, set color range, smooth
    testGrid('webglGridOptions', {
      url: 'oahu-dense.json',
      range: true,
      stepped: false
    }, done);
  }, 30000);

  it('grids with nonlinear range', function (done) {
    // geo from x0, non-linear range
    testGrid('webglGridRange', {
      url: 'oahu-dense.json',
      range: 'nonlinear'
    }, done);
  }, 30000);

  it('grids with iso range', function (done) {
    // geo from x0, iso-like range
    testGrid('webglGridIso', {
      url: 'oahu-dense.json',
      range: 'iso'
    }, done);
  }, 30000);
});
