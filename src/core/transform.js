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
geo.transform = {};

//////////////////////////////////////////////////////////////////////////////
/**
 * Custom transform for a feature used for OpenStreetMap
 */
//////////////////////////////////////////////////////////////////////////////
geo.transform.osmTransformFeature = function(destGcs, feature, inplace) {
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

  if (!(feature instanceof geo.pointFeature ||
        feature instanceof geo.lineFeature)) {
    throw "Supports only point or line feature";
  }

  var noOfComponents = null, pointOffset = 0, count = null,
      inPos = null, outPos = null, srcGcs = feature.gcs(), i,
      inplace = inplace || false, projSrcGcs = new proj4.Proj(srcGcs),
      projDestGcs = new proj4.Proj(destGcs), xCoord, yCoord;

  if (feature instanceof geo.pointFeature ||
      feature instanceof geo.lineFeature) {

    ///  If source GCS is not in 4326, transform it first into 4326
    /// before we transform it for OSM.
    if (srcGcs !== "EPSG:4326") {
      geo.transform.transformFeature("EPSG:4326", feature, true);
    }

    inPos = feature.positions();
    count = inPos.length

    if (!(inPos instanceof Array)) {
      throw "Supports Array of 2D and 3D points";
    }

    if (inPos.length > 0 && inPos[0] instanceof geo.latlng) {
      noOfComponents = 2;
      pointOffset = 1;
    } else {
      noOfComponents = (count % 2 === 0 ? 2 :
                       (count % 3 === 0 ? 3 : null));
      pointOffset = noOfComponents;
    }

    if (noOfComponents !== 2 && noOfComponents !== 3) {
      throw "Transform points require points in 2D or 3D";
    }

    if (inplace) {
        outPos = inPos;
      } else {
        outPos = inPos.slice(0);
      }

    for (i = 0; i < count; i += pointOffset) {

      /// Y goes from 0 (top edge is 85.0511 °N) to 2zoom − 1
      /// (bottom edge is 85.0511 °S) in a Mercator projection.
      if (inPos[i] instanceof geo.latlng) {
        yCoord = inPos[i].lat();
      } else {
        yCoord = inPos[i + 1];
      }

      if (yCoord > 85.0511) {
        yCoord = 85.0511;
      }
      if (yCoord < -85.0511) {
        yCoord = -85.0511;
      }
      if (inPos[i] instanceof geo.latlng) {
        outPos[i] = geo.latlng(geo.mercator.lat2y(yCoord) , outPos[i].lng())
      } else {
        outPos[i + 1] = geo.mercator.lat2y(yCoord);
      }
    }

    if (inplace) {
      feature.positions(outPos);
      feature.gcs(destGcs);
    }
    return outPos;
  }

  return null;
};

//////////////////////////////////////////////////////////////////////////////
/**
 * Transform a feature to destination GCS
 */
//////////////////////////////////////////////////////////////////////////////
geo.transform.transformFeature = function(destGcs, feature, inplace) {
  'use strict';

  if (!feature) {
    throw 'Invalid (null) feature';
  }

  if (!(feature instanceof geo.pointFeature ||
        feature instanceof geo.lineFeature)) {
    throw "Supports only point or line feature";
  }

  if (feature.gcs() === destGcs) {
    return feature.positions();
  }

  if (destGcs === "EPSG:3857") {
    return geo.transform.osmTransformFeature(destGcs, feature, inplace);
  }

  var noOfComponents = null, pointOffset = 0, count = null, inPos = null,
      outPos = null, projPoint = null, srcGcs = feature.gcs(), i,
      inplace = inplace || false, projSrcGcs = new proj4.Proj(srcGcs),
      projDestGcs = new proj4.Proj(destGcs);

  if (feature instanceof geo.pointFeature ||
      feature instanceof geo.lineFeature) {
    inPos = feature.positions();
    count = inPos.length

    if (!(inPos instanceof Array)) {
      throw "Supports Array of 2D and 3D points";
    }

    if (inPos.length > 0 && inPos[0] instanceof geo.latlng) {
      noOfComponents = 2;
      pointOffset = 1;
    } else {
      noOfComponents = (count % 2 === 0 ? 2 :
                       (count % 3 === 0 ? 3 : null));
      pointOffset = noOfComponents;
    }

    if (noOfComponents !== 2 && noOfComponents !== 3) {
      throw "Transform points require points in 2D or 3D";
    }

    if (inplace) {
        outPos = inPos;
      } else {
        outPos = [];
        outPos.length = inPos.length;
      }

    for (i = 0; i < count; i += pointOffset) {
      if (noOfComponents === 2) {
        projPoint = new proj4.Point(inPos[i], inPos[i + 1], 0.0);
      } else {
        projPoint = new proj4.Point(inPos[i], inPos[i + 1], inPos[i + 2]);
      }

      proj4.transform(projSrcGcs, projDestGcs, projPoint);

      if (noOfComponents === 2) {
        outPos[i] =  projPoint.x;
        outPos[i + 1] = projPoint.y;
      } else {
        outPos[i] = projPoint.x;
        outPos[i + 1] = projPoint.y;
        outPos[i + 2] = projPoint.z;
      }
    }

    if (inplace) {
      feature.positions(outPos);
      feature.gcs(destGcs);
    }

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
geo.transform.transformLayer = function(destGcs, layer, baseLayer) {
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
        geo.transform.osmTransformFeature(
          destGcs, features[i], true);
      } else {
        geo.transform.transformFeature(
          destGcs, features[i], true);
      }
    }

    layer.gcs(destGcs);
  } else {
    throw "Only feature layer transformation is supported";
  }
};
