var $ = require('jquery');

describe('lines example', function () {
  var imageTest = require('../image-test');
  var base$;

  beforeAll(function () {
    imageTest.prepareIframeTest();
  });

  it('basic', function (done) {
    // use a local url for the map for the test
    $('#map').attr('src', '/examples/lines/index.html?url=/data/tiles/{z}/{x}/{y}.png');
    imageTest.imageTest('exampleLines', '#map', 0.0015, done, null, 0, 2, '#map.ready');
  }, 10000);
  it('more lines', function (done) {
    base$ = $('iframe#map')[0].contentWindow.jQuery;
    base$('#lines').val(100000).trigger('change');
    window.setTimeout(function () {
      imageTest.imageTest('exampleLines100k', '#map', 0.0015, done, null, 0, 2, '#map.ready[segments="100000"]');
    }, 100);
  }, 10000);
  it('thin preset', function (done) {
    base$('button.preset').eq(1).trigger('click');
    window.setTimeout(function () {
      imageTest.imageTest('exampleLinesThin', '#map', 0.0015, done, null, 0, 2, '#map.ready');
    }, 100);
  }, 10000);
});
