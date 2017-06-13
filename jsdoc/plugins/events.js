function fixEventName(event) {
  return event.replace('event:', '');
}

/**
 * Define a jsdoc plugin to replace the `longname` of
 * event doclets from `geo.event.event:pan` to `geo.event.pan`.
 */
exports.handlers = {
  /**
   * Replace the `longname` of all event doclets.
   */
  newDoclet: function (e) {
    var doclet = e.doclet;
    if (doclet.kind === 'event') {
      doclet.longname = fixEventName(doclet.longname);
    }
  },

  /**
   * Replace the displayed name of events to match the changed
   * doclet names.
   */
  parseComplete: function (e) {
    e.doclets.forEach(function (doclet) {
      if (doclet.fires) {
        doclet.fires = doclet.fires.map(fixEventName);
      }
      if (doclet.listens) {
        doclet.listens = doclet.listens.map(fixEventName);
      }
    });
  }
};
