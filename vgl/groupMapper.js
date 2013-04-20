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
    // if (m_geomData === null || m_geomData === undefined) {
    //   this.resetBounds();
    //   return;
    // }

    // var computeBoundsTimestamp = this.computeBoundsTimestamp();
    // var boundsDirtyTimestamp = this.boundsDirtyTimestamp();

    // if (boundsDirtyTimestamp.getMTime() > computeBoundsTimestamp.getMTime()) {
    //   // @todo Finish this
    //   // var geomBounds = m_geomData.bounds();

    //   // this.setBounds(geomBounds[0], geomBounds[1], geomBounds[2],
    //   //   geomBounds[3], geomBounds[4], geomBounds[5]) ;

    //   computeBoundsTimestamp.modified();
    // }
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
