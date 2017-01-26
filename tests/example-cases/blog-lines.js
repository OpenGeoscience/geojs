var $ = require('jquery');

describe('blog-lines example', function () {
  var imageTest = require('../image-test');
  var base$;

  beforeAll(function () {
    imageTest.prepareIframeTest();
  });

  it('basic', function (done) {
    $('#map').attr('src', '/examples/blog-lines/index.html?mode=select');
    imageTest.imageTest('exampleBlogLines', '#map', 0.0015, done, null, 1000, 2);
  }, 10000);
  it('round line cap', function (done) {
    $('#map')[0].contentWindow.scrollTo(0, 130);
    base$ = $('iframe#map')[0].contentWindow.jQuery;
    base$('#feature').val('linecap-round').trigger('change');
    imageTest.imageTest('exampleBlogLinesRoundCap', '#map', 0.0015, done, null, 1000, 2, '.mapboxgl-canvas');
  }, 20000);
  it('10,000 lines in geojs', function (done) {
    $('#map').attr('src', '/examples/blog-lines/index.html?renderer=vgl&data=roads&lines=10000&x=-73.7593015&y=42.8496799&zoom=13&strokeOpacity=1&strokeWidth=2&antialiasing=2&referenceLines=false');
    imageTest.imageTest('exampleBlogLines10k', '#map', 0.0015, done, null, 1000, 2);
  }, 10000);
});
