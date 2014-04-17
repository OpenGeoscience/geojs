//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geo, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vgl, proj4, document*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Transform geometric data of a feature from source projection to destination
 * projection.
 */
//////////////////////////////////////////////////////////////////////////////
geo.geoTransform = {};

//////////////////////////////////////////////////////////////////////////////
/**
 * Custom transform for a feature used for OpenStreetMap
 */
//////////////////////////////////////////////////////////////////////////////
geo.geoTransform.osmTransformFeature = function(destGcs, feature) {
  'use strict';

  if (!feature) {
    console.log('[warning] Invalid (null) feature');
    return;
  }

  if (feature.gcs() === destGcs) {
    return;
  }

  var geometryDataArray = [],
      noOfGeoms = 0,
      index = 0,
      geometryData = null,
      posSourceData = null,
      data = null,
      noOfComponents = null,
      stride = null,
      offset = null,
      sizeOfDataType = null,
      count = null,
      i = 0,
      ib = 0,
      jb = 0,
      lat = null,
      inPos = [],
      projPoint = null,
      vertexPos = null,
      srcGcs = feature.gcs(),
      source = new proj4.Proj(srcGcs),
      dest = new proj4.Proj(destGcs);

  if (feature.mapper() instanceof vgl.groupMapper) {
    geometryDataArray = feature.mapper().geometryDataArray();
  } else {
    geometryDataArray.push(feature.mapper().geometryData());
  }

  noOfGeoms = geometryDataArray.length;

  for (index = 0; index < noOfGeoms; ++index) {
    geometryData = geometryDataArray[index];
    posSourceData = geometryData.sourceData(
      vgl.vertexAttributeKeys.Position);
    data = posSourceData.data();
    noOfComponents = posSourceData.attributeNumberOfComponents(
      vgl.vertexAttributeKeys.Position);
    stride = posSourceData.attributeStride(
      vgl.vertexAttributeKeys.Position);
    offset = posSourceData.attributeOffset(
      vgl.vertexAttributeKeys.Position);
    sizeOfDataType = posSourceData.sizeOfAttributeDataType(
      vgl.vertexAttributeKeys.Position);
    count = data.length / noOfComponents;

    source = new proj4.Proj(srcGcs);
    dest = new proj4.Proj(destGcs);

    if (noOfComponents < 2 || noOfComponents > 3) {
      console.log('[error] Geotransform requires 2d or 3d points.');
      console.log('[error] Geotransform got ', noOfComponents);
      return;
    }

    inPos.length = 3;

    // We need to operate on arrays
    stride /= sizeOfDataType;
    offset /= sizeOfDataType;

    for (i = 0; i < count; ++i) {
      vertexPos = i * stride + offset;
      lat = data[vertexPos + 1];
      // Y goes from 0 (top edge is 85.0511 °N) to 2zoom − 1 (bottom edge is 85.0511 °S)
      // in a Mercator projection
      if (lat > 85.0511) {
            lat = 85.0511;
        }
        if (lat < -85.0511) {
            lat = -85.0511;
        }
      data[vertexPos + 1] = geo.mercator.lat2y(lat);
    }
  }

  // Update the features gcs field
  feature.setGcs(destGcs);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Transform a feature to destination GCS
 */
//////////////////////////////////////////////////////////////////////////////
geo.geoTransform.transformFeature = function(destGcs, feature) {
  'use strict';

  if (!feature) {
    console.log('[warning] Invalid (null) feature');
    return;
  }

  if (feature.gcs() === destGcs) {
    return;
  }

  var geometryDataArray = [],
      noOfGeoms = 0,
      index = 0,
      geometryData = null,
      posSourceData = null,
      data = null,
      noOfComponents = null,
      stride = null,
      offset = null,
      sizeOfDataType = null,
      count = null,
      i = 0,
      ib = 0,
      jb = 0,
      value = null,
      inPos = [],
      projPoint = null,
      vertexPos = null,
      srcGcs = feature.gcs(),
      source = new proj4.Proj(srcGcs),
      dest = new proj4.Proj(destGcs);

  if (feature.mapper() instanceof vgl.groupMapper) {
    geometryDataArray = feature.mapper().geometryDataArray();
  } else {
    geometryDataArray.push(feature.mapper().geometryData());
  }

  noOfGeoms = geometryDataArray.length;

  for (index = 0; index < noOfGeoms; ++index) {
    geometryData = geometryDataArray[index];
    posSourceData = geometryData.sourceData(
      vgl.vertexAttributeKeys.Position);
    data = posSourceData.data();
    noOfComponents = posSourceData.attributeNumberOfComponents(
      vgl.vertexAttributeKeys.Position);
    stride = posSourceData.attributeStride(
      vgl.vertexAttributeKeys.Position);
    offset = posSourceData.attributeOffset(
      vgl.vertexAttributeKeys.Position);
    sizeOfDataType = posSourceData.sizeOfAttributeDataType(
      vgl.vertexAttributeKeys.Position);
    count = data.length;

    source = new proj4.Proj(srcGcs);
    dest = new proj4.Proj(destGcs);

    if (noOfComponents < 2 || noOfComponents > 3) {
      console.log('[error] Geotransform requires 2d or 3d points.');
      console.log('[error] Geotransform got ', noOfComponents);
      return;
    }

    inPos.length = 3;

    // We need to operate on arrays
    stride /= sizeOfDataType;
    offset /= sizeOfDataType;

    for (i = 0; i < count; ++i) {
      vertexPos = i * stride + offset;

      if (noOfComponents === 2) {
        inPos[0] = data[vertexPos];
        inPos[1] = data[vertexPos + 1];
        inPos[2] = 0.0;
      } else {
        inPos[0] = data[vertexPos];
        inPos[1] = data[vertexPos + 1];
        inPos[2] = data[vertexPos + 2];
      }

      projPoint = new proj4.Point(inPos[0], inPos[1], inPos[2]);
      proj4.transform(source, dest, projPoint);

      if (noOfComponents === 2) {
        data[vertexPos] =  projPoint.x;
        data[vertexPos + 1] = projPoint.y;
      } else {
        data[vertexPos] = projPoint.x;
        data[vertexPos + 1] = projPoint.y;
        data[vertexPos + 2] = projPoint.z;
      }
    }
  }

  // Update the features gcs field
  feature.setGcs(destGcs);
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Transform geometric data of a layer from source projection to destination
 * projection.
 */
//////////////////////////////////////////////////////////////////////////////
geo.geoTransform.transformLayer = function(destGcs, layer) {
  'use strict';

  if (!layer) {
    console.log('[warning] Invalid (null) layer');
    return;
  }

  var features = layer.features(),
      count = features.length,
      i = 0;
  for (i = 0; i < count; ++i) {
    // TODO Ignoring src and destination projections
    geo.geoTransform.osmTransformFeature(
      destGcs, features[i]);
  }
};
