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
          this[decodeURIComponent(n[0])] = decodeURIComponent(n[1]);
        }
        return this;
      }.bind({}))[0];
    return query;
  }
};

window.utils = exampleUtils;
