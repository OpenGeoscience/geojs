var $ = require('jquery');

describe('lines example', function () {
  var imageTest = require('../image-test');
  var base$;

  beforeAll(function () {
    imageTest.prepareIframeTest();
  });

  it('basic', function (done) {
    // use an http url for the map so we can proxy it for the test
    $('#map').attr('src', '/examples/lines/index.html?url=http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    imageTest.imageTest('exampleLines', '#map', 0.0015, done, null, 0, 2, '#map.ready');
  }, 10000);
  it('more lines', function (done) {
    base$ = $('iframe#map')[0].contentWindow.jQuery;
    base$('#lines').val(100000).trigger('change');
    imageTest.imageTest('exampleLines100k', '#map', 0.0015, done, null, 0, 2, '#map.ready[segments="100000"]');
  }, 10000);
  it('thin preset', function (done) {
    base$('button.preset').eq(1).trigger('click');
    imageTest.imageTest('exampleLinesThin', '#map', 0.0015, done, null, 0, 2, '#map.ready');
  }, 10000);
});
