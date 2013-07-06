vglModule.groupMapper = function() {
  if (!(this instanceof vglModule.groupMapper)) {
    return new vglModule.groupMapper();
  }
  vglModule.mapper.call(this);

  /** @private */
  var m_createMappersTimestamp = vglModule.timestamp();

  /** @private */
  var m_mappers = [];

  /** @private */
  var m_geomDataArray = [];

  /**
   * Return stored geometry data if any
   *
   * @param index optional
   */
  this.geometryData = function(index) {
    if (index !== undefined && index < m_geomDataArray.length ) {
      return m_geomDataArray[index];
    } else {
      if (m_geomDataArray.length > 0) {
        return m_geomDataArray[0];
      } else {
        return null;
      }
    }
  };

  /**
   * Connect mapper to its geometry data
   *
   * @param geom {vglModule.geomData}
   */
  this.setGeometryData = function(geom) {
    if (m_geomDataArray.length == 1) {
      if (m_geomDataArray[0] === geom) {
        return;
      }
    }
    m_geomDataArray = [];
    m_geomDataArray.push(geom);
    this.modified();
  };

  /**
   * Return stored geometry data array if any
   */
  this.geometryDataArray = function() {
    return m_geomDataArray;
  };

  /**
   * Connect mapper to its geometry data
   *
   * @param geoms {Array}
   */
  this.setGeometryDataArray = function(geoms) {
    if (geoms instanceof Array) {
      if (m_geomDataArray != geoms) {
        m_geomDataArray = [];
        m_geomDataArray = geoms;
        this.modified();
        return true;
      }
    } else {
      console.log('[error] Requies array of geometry data');
    }

    return false;
  };

  /**
   * Compute bounds of the data
   */
  this.computeBounds = function() {
    if (m_geomDataArray === null || m_geomDataArray === undefined) {
      this.resetBounds();
      return;
    }

    var computeBoundsTimestamp = this.computeBoundsTimestamp(),
        boundsDirtyTimestamp = this.boundsDirtyTimestamp(),
        m_bounds = this.bounds(),
        geomBounds = null

    if (boundsDirtyTimestamp.getMTime() > computeBoundsTimestamp.getMTime()) {

      for (var i = 0; i < m_geomDataArray.length; ++i) {
        geomBounds = m_geomDataArray[i].bounds();

        if (m_bounds[0] > geomBounds[0]) {
          m_bounds[0] = geomBounds[0];
        }
        if (m_bounds[1] < geomBounds[1]) {
          m_bounds[1] = geomBounds[1];
        }
        if (m_bounds[2] > geomBounds[2]) {
          m_bounds[2] = geomBounds[2];
        }
        if (m_bounds[3] < geomBounds[3]) {
          m_bounds[3] = geomBounds[3];
        }
        if (m_bounds[4] > geomBounds[4]) {
          m_bounds[4] = geomBounds[4];
        }
        if (m_bounds[5] < geomBounds[5]) {
          m_bounds[5] = geomBounds[5];
        }
      }

      this.modified();
      computeBoundsTimestamp.modified();
    }
  };

  /**
   * Render the mapper
   */
  this.render = function(renderState) {
    if (this.getMTime() > m_createMappersTimestamp.getMTime()) {
      // @note Hoping that it will release the graphics resources
      m_mappers = [];

      for (var i = 0; i < m_geomDataArray.length; ++i) {
        m_mappers.push(vglModule.mapper());
        m_mappers[i].setGeometryData(m_geomDataArray[i]);
      }
        m_createMappersTimestamp.modified();
    }

    for (var i = 0; i < m_mappers.length; ++i) {
      m_mappers[i].render(renderState);
    }
  };

  return this;
};

inherit(vglModule.groupMapper, vglModule.mapper);
