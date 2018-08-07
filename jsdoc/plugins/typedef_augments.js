/**
 * Define a jsdoc plugin to update typedefs that use augments.
 */
exports.handlers = {
  /**
   * Modify typedefs that use augments (extends).  Add the base typedef's
   * properties to the augmented typedefs.
   */
  parseComplete: function (e) {
    var typedefs = {},
        augmentedTypedefs = {},
        numAugmented = 0;
    /* Make a dictionary of all known typedefs and a dictionary of augmented
     * typedefs */
    e.doclets.forEach(function (doclet) {
      if (doclet.kind === 'typedef') {
        typedefs[doclet.longname] = doclet;
        if (doclet.augments && doclet.augments.length) {
          augmentedTypedefs[doclet.longname] = doclet;
        }
      }
    });
    while (Object.keys(augmentedTypedefs).length !== numAugmented) {
      numAugmented = Object.keys(augmentedTypedefs).length;
      Object.keys(augmentedTypedefs).forEach(function (name) {
        var doclet = augmentedTypedefs[name];
        /* If this typedef is augmented by an augmented typedef, skip it for
         * now.  Ignore self references */
        if (doclet.augments.some(function (augmentName) {
          return augmentName !== name && augmentedTypedefs[augmentName];
        })) {
          return;
        }
        /* Ensure we have properties */
        doclet.properties = doclet.properties || [];
        /* Make a dictionary so we don't clobber known properties. */
        var properties = {};
        doclet.properties.forEach(function (prop) {
          properties[prop.name] = prop;
        });
        /* For each augment base, add its properties if we don't already have
         * them.  If the typedef augments two other typedefs that each have a
         * property of the same name, the last listed will be shown (done by
         * reversing the augments list). */
        doclet.augments.slice().reverse().forEach(function (augmentName) {
          if (augmentName !== name && typedefs[augmentName] && typedefs[augmentName].properties) {
            typedefs[augmentName].properties.forEach(function (prop) {
              if (!properties[prop.name]) {
                /* Make a copy so we don't mutate the original property. */
                prop = Object.assign(prop);
                /* Add a value that a rendering template could use to show that
                 * the property was inherted from a parent.  Since that in turn
                 * could have been inherited, preserve a known value. */
                prop.inherited = prop.inherited || augmentName;
                /* Add the property to the typedef and to the list of known
                 * properties. */
                doclet.properties.push(prop);
                properties[prop.name] = prop;
              }
            });
          }
        });
        /* We've finished processing this typedef, so remove it from the
         * augmented list. */
        delete augmentedTypedefs[name];
      });
    }
  }
};
