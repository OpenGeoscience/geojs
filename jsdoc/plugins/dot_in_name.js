/**
 * Allow doclet names to include a dot.  The text '_DOT_' is replaced by a dot
 * in the documentation.
 */
var dotToken = '_DOT_';

exports.handlers = {
  processingComplete: function (e) {
    e.doclets.forEach(function (doclet) {
      if (doclet.name.indexOf(dotToken) >= 0) {
        doclet.name = doclet.name.replace(new RegExp(dotToken, 'g'), '.');
      }
    });
  }
};
