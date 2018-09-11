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
   * @param {object} params The query parameters as a dictionary.
   * @param {boolean} [updateHistory] If true, update the browser history.  If
   *    falsy, replace the history state.
   */
  setQuery: function (params, updateHistory) {
    $.each(params, function (key, value) {
      if (value === undefined) {
        delete params[key];
      }
    });
    var newurl = window.location.protocol + '//' + window.location.host +
        window.location.pathname + '?' + $.param(params);
    if (updateHistory) {
      window.history.pushState(params, '', newurl);
    } else {
      window.history.replaceState(params, '', newurl);
    }
  }
};

module.exports = exampleUtils;
