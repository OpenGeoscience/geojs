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
  /// TODO
  /// Currently we make assumption that incoming feature is in 4326
  /// which may not be true.

  'use strict';

  if (!feature) {
    console.log('[warning] Invalid (null) feature');
    return;
  }

  if (feature.gcs() === destGcs) {
    return;
  }

  if (!(feature instanceof geo.pointFeature)) {
    throw "Supports only point feature";
  }

  var noOfComponents = null, count = null, inPos = null, outPos = null,
      projPoint = null, srcGcs = feature.gcs(), i, inplace = inplace || false,
      source = new proj4.Proj(srcGcs), dest = new proj4.Proj(destGcs),
      lat;

  source = new proj4.Proj(srcGcs);
  dest = new proj4.Proj(destGcs);

  if (feature instanceof geo.pointFeature) {
    inPos = feature.positions();
    count = inPos.length

    if (!(inPos instanceof Array)) {
      throw "Supports Array of 2D and 3D points";
    }

    noOfComponents = (count % 2 === 0 ? 2 :
                       (count % 3 === 0 ? 3 : null));

    if (noOfComponents !== 2 && noOfComponents !== 3) {
      throw "Transform points require points in 2D or 3D";
    }

    for (i = 0; i < count; i += noOfComponents) {
      if (inplace) {
        outPos = inPos;
      } else {
        outPos = [];
        outPos.length = inPos.length;
      }

      /// Y goes from 0 (top edge is 85.0511 °N) to 2zoom − 1
      /// (bottom edge is 85.0511 °S) in a Mercator projection.
      lat = inPos[i + 1];
      if (lat > 85.0511) {
            lat = 85.0511;
        }
        if (lat < -85.0511) {
            lat = -85.0511;
        }
      outPos[i + 1] = geo.mercator.lat2y(lat);
    }

    feature.positions(outPos);
    feature.gcs(destGcs);
    return outPos;
  }

  return null;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Transform a feature to destination GCS
 */
//////////////////////////////////////////////////////////////////////////////
geo.geoTransform.transformFeature = function(destGcs, feature, inplace) {
  'use strict';

  if (!feature) {
    console.log('[warning] Invalid (null) feature');
    return;
  }

  if (feature.gcs() === destGcs) {
    return;
  }

  if (!(feature instanceof geo.pointFeature)) {
    throw "Supports only point feature";
  }

  var noOfComponents = null, count = null, inPos = null, outPos = null,
      projPoint = null, srcGcs = feature.gcs(), i, inplace = inplace || false,
      source = new proj4.Proj(srcGcs), dest = new proj4.Proj(destGcs);

  source = new proj4.Proj(srcGcs);
  dest = new proj4.Proj(destGcs);

  if (feature instanceof geo.pointFeature) {
    inPos = feature.positions();
    count = inPos.length

    if (!(inPos instanceof Array)) {
      throw "Supports Array of 2D and 3D points";
    }

    noOfComponents = (count % 2 === 0 ? 2 :
                       (count % 3 === 0 ? 3 : null));

    if (noOfComponents !== 2 && noOfComponents !== 3) {
      throw "Transform points require points in 2D or 3D";
    }

    for (i = 0; i < count; i += noOfComponents) {
      if (noOfComponents === 2) {
        projPoint = new proj4.Point(inPos[i], inPos[i + 1], 0.0);
      } else {
        projPoint = new proj4.Point(inPos[i], inPos[i + 1], inPos[i + 2]);
      }

      proj4.transform(source, dest, projPoint);

      if (inplace) {
        outPos = inPos;
      } else {
        outPos = [];
        outPos.length = inPos.length;
      }

      if (noOfComponents === 2) {
        outPos[i] =  projPoint.x;
        outPos[i + 1] = projPoint.y;
      } else {
        outPos[i] = projPoint.x;
        outPos[i + 1] = projPoint.y;
        outPos[i + 2] = projPoint.z;
      }
    }

    feature.positions(outPos);
    feature.gcs(destGcs);
    return outPos;
  }

  return null;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Transform geometric data of a layer from source projection to destination
 * projection.
 */
//////////////////////////////////////////////////////////////////////////////
geo.geoTransform.transformLayer = function(destGcs, layer, baseLayer) {
  'use strict';

  var features, count, i;

  if (!layer) {
    throw "Requires valid layer for tranformation";
  }

  if (!baseLayer) {
    throw "Requires baseLayer used by the map";
  }

  if (layer === baseLayer) {
    return;
  }

  if (layer instanceof geo.featureLayer) {
    features = layer.features();
    count = features.length;
    i = 0;

    for (i = 0; i < count; ++i) {
      if (destGcs === "EPSG:3857" && baseLayer instanceof geo.osmLayer) {
        geo.geoTransform.osmTransformFeature(
          destGcs, features[i], true);
      } else {
        geo.geoTransform.transformFeature(
          destGcs, features[i], true);
      }
    }

    layer.gcs(destGcs);
  } else {
    throw "Only feature layer transformation is supported";
  }
};
