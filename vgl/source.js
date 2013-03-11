//////////////////////////////////////////////////////////////////////////////
//
// source class
//
//////////////////////////////////////////////////////////////////////////////
vglModule.source = function() {

  if (!(this instanceof vglModule.source)) {
    return new vglModule.source();
  }

  vglModule.object.call(this);

  /**
   * Virtual function to create a source instance
   *
   */
  this.create = function() {
  };

  return this;
};

inherit(vglModule.source, vglModule.object);
