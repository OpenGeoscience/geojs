
vglModule.data = function() {

  if (!(this instanceof vglModule.data)) {
    return new vglModule.data();
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return data type. Should be implemented by a derived class
   */
   ////////////////////////////////////////////////////////////////////////////
  this.type = function() {
  }
};

vglModule.data.raster = 0;
vglModule.data.point = 1;
vglModule.data.lineString = 2;
vglModule.data.polygon = 3;
vglModule.data.geometry = 10;