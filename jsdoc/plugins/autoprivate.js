/* jshint node: true */

'use strict';

exports.handlers = {
  newDoclet: function (e) {
    if (e.doclet && e.doclet.name) {
      if (e.doclet.name[0] === '_') {
        e.doclet.access = 'private';
      }
    }
  }
};
