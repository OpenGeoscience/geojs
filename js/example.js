var exampleUtils = {
  /* Decode query components into a dictionary of values.
   *
   * @returns {object}: the query parameters as a dictionary.
   */
  getQuery: function () {
    var query = document.location.search.replace(/(^\?)/, '').split(
      '&').map(function (n) {
        n = n.split('=');
        if (n[0]) {
          this[decodeURIComponent(n[0].replace(/\+/g, '%20'))] = decodeURIComponent(n[1].replace(/\+/g, '%20'));
        }
        return this;
      }.bind({}))[0];
    return query;
  },

  /* Encode a dictionary of parameters to the query string, setting the window
   * location and history.  This will also remove undefined values from the
   * set properites of params.
   *
   * @param {object} params: the query parameters as a dictionary.
   */
  setQuery: function (params) {
    $.each(params, function (key, value) {
      if (value === undefined) {
        delete params[key];
      }
    });
    var newurl = window.location.protocol + '//' + window.location.host +
        window.location.pathname + '?' + $.param(params);
    window.history.replaceState(params, '', newurl);
  }
};

window.utils = exampleUtils;

/* Add a function to take a screenshot.  Show the screenshot so that a user can
 * click on it to save it or right-click to copy it. */
$(function () {
    $('a.screenshot').on('click', function (e) {
        e.preventDefault();
        $(this).hide();
        $('.screenshot-loading').show();
        // Use the geojs internal jQuery to get the map instance
        var map = geo.jQuery('#map').data('data-geojs-map');
        map.screenshot({wait:'idle'}).then(function (res) {
            $('.screenshot-result img').attr({src: res});
            $('.screenshot-result a').attr({href: res});
            $('a.screenshot').show();
            $('.screenshot-loading').hide();
            $('.screenshot-modal').modal('show');
        });
    });
    $('a.screenshot').keypress(function (evt) {
        if (evt.which === 13) {
            $('a.screenshot').click();
            return false;
        }
    });
});
