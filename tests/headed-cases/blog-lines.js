var $ = require('jquery');

describe('blog-lines example', function () {
  var imageTest = require('../image-test');
  var base$, watchNum = 0, finished, expected;

  beforeAll(function () {
    imageTest.prepareIframeTest();
  });

  /* Check if all of the visible maps in the test window have some content.
   * This relies on the structure and internal functions of the example.
   *
   * @param {function} callback: function to call when the page appears ready.
   */
  function ready(callback, second) {
    var missing;
    var cw = $('iframe#map')[0].contentWindow;
    var base$ = cw.jQuery;
    if (second !== 'second') {
      watchNum += 1;
      finished = [];
      expected = 0;
    }
    if (base$) {
      var entries = base$('#main_list>span>.entry>a');
      missing = $.makeArray(entries).some(function (entry) {
        if (base$(entry).children('div').data('data-geojs-map')) {
          if (base$(entry).attr('watchNum') !== '' + watchNum) {
            base$(entry).attr('watchNum', '' + watchNum);
            expected += 1;
            base$(entry).children('div').data('data-geojs-map').onIdle(function () {
              finished.push(entry);
            });
          }
        }
        return cw.elementInViewport(entry) && !base$(entry).children('div').children().length;
      }) || !entries.length;
    }
    if (!base$ || missing || finished.length < expected) {
      window.setTimeout(function () { ready(callback, 'second'); }, 100);
    } else {
      callback();
    }
  }

  it('basic', function (done) {
    $('#map').attr('src', '/examples/blog-lines/index.html?mode=select');
    imageTest.imageTest('exampleBlogLines', '#map', 0.0015, done, ready, 500, 2, '.leaflet-pane');
  }, 10000);
  it('round line cap', function (done) {
    $('#map')[0].contentWindow.scrollTo(0, 130);
    base$ = $('iframe#map')[0].contentWindow.jQuery;
    base$('#feature').val('linecap-round').trigger('change');
    imageTest.imageTest('exampleBlogLinesRoundCap', '#map', 0.0015, done, ready, 500, 2, '.mapboxgl-canvas');
  }, 20000);
  it('10,000 lines in geojs', function (done) {
    // remove previous contents to ensure we detect new contents
    base$ = $('iframe#map')[0].contentWindow.jQuery;
    base$('.geojs-map.ready').remove();
    $('#map').attr('src', '/examples/blog-lines/index.html?renderer=vgl&data=roads&lines=10000&x=-73.7593015&y=42.8496799&zoom=13&strokeOpacity=1&strokeWidth=2&antialiasing=2&referenceLines=false');
    // this permits a large delta to pass on CI.  It visually is rendered
    // correctly, though with seemingly different aliasing choices by the
    // renderer
    imageTest.imageTest('exampleBlogLines10k', '#map', 0.04, done, null, 1000, 2, '.geojs-map.ready');
  }, 10000);
});
