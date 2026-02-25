window.utils = require('./utils');

/* Add a function to take a screenshot.  Show the screenshot so that a user can
 * click on it to save it or right-click to copy it. */
$(function () {
  $('.gj-screenshot-link').on('click', function () {
    $('.gj-screenshot-result').hide();
    $('.gj-screenshot-waiting').show();
    var map = $('#map').data('data-geojs-map');
    map.screenshot({wait:'idle'}).then(function (res) {
      $('.gj-screenshot-waiting').hide();
      $('.gj-screenshot-result img').attr({src: res});
      $('.gj-screenshot-download').attr({href: res});
      $('.gj-screenshot-result').show();
      /* If you want to trigger an automatic download, enable this line (and,
       * perhaps, always hide the waiting and result elements).
      $('.gj-screenshot-download')[0].click();
       */
    });
  });
  $('.gj-screenshot-link').keypress(function (evt) {
    if (evt.which === 13) {
      $('.gj-screenshot-link').click();
      return false;
    }
  });
});
