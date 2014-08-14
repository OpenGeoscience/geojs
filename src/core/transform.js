//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
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
geo.transform.osmTransformFeature = function (destGcs, feature, inplace) {
  /// TODO
  /// Currently we make assumption that incoming feature is in 4326
  /// which may not be true.

  "use strict";

  if (!feature) {
    console.log("[warning] Invalid (null) feature");
    return;
  }

  if (feature.gcs() === destGcs) {
    return;
  }

  if (!(feature instanceof geo.pointFeature ||
        feature instanceof geo.lineFeature)) {
    throw "Supports only point or line feature";
  }

  var noOfComponents = null,
      pointOffset = 0,
      count = null,
      inPos = null,
      outPos = null,
      srcGcs = feature.gcs(),
      i,
      yCoord;

  inplace = !!inplace;
  if (feature instanceof geo.pointFeature ||
      feature instanceof geo.lineFeature) {

    ///  If source GCS is not in 4326, transform it first into 4326
    /// before we transform it for OSM.
    if (srcGcs !== "EPSG:4326") {
      geo.transform.transformFeature("EPSG:4326", feature, true);
    }

    inPos = feature.positions();
    count = inPos.length;

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
        outPos[i] = geo.latlng(geo.mercator.lat2y(yCoord), outPos[i].lng());
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
geo.transform.transformFeature = function (destGcs, feature, inplace) {
  "use strict";

  if (!feature) {
    throw "Invalid (null) feature";
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

  var noOfComponents = null,
      pointOffset = 0,
      count = null,
      inPos = null,
      outPos = null,
      projPoint = null,
      srcGcs = feature.gcs(),
      i,
      projSrcGcs = new proj4.Proj(srcGcs),
      projDestGcs = new proj4.Proj(destGcs);

  inplace = !!inplace;
  if (feature instanceof geo.pointFeature ||
      feature instanceof geo.lineFeature) {
    inPos = feature.positions();
    count = inPos.length;

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
geo.transform.transformLayer = function (destGcs, layer, baseLayer) {
  "use strict";

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

    for (i = 0; i < count; i += 1) {
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

//////////////////////////////////////////////////////////////////////////////
/**
 * Transform position coordinates from source projection to destination
 * projection.
 *
 * @param srcGcs GCS of the coordinates
 * @param destGcs Desired GCS of the transformed coordinates
 * @param coordinates
 * @return {Array | geo.latlng} Transformed coordinates
 */
//////////////////////////////////////////////////////////////////////////////
geo.transform.transformCoordinates = function (srcGcs, destGcs, coordinates) {
  "use strict";

  var i, count, offset, xCoord, yCoord, zCoord, xAcc,
      yAcc, zAcc, writer, output, projPoint,
      projSrcGcs = new proj4.Proj(srcGcs),
      projDestGcs = new proj4.Proj(destGcs);

  /// Default Z accessor
  zAcc = function () {
    return 0.0;
  };

  if (destGcs === srcGcs) {
    return coordinates;
  }

  /// TODO: Can we check for EPSG code?
  if (!destGcs || !srcGcs) {
    throw "Invalid source or destination GCS";
  }

  /// Helper methods
  function handleLatLngCoordinates() {
    if (coordinates[0] && coordinates[0] instanceof geo.latlng) {
      xAcc = function (index) {
        return coordinates[index].x();
      };
      yAcc = function (index) {
        return coordinates[index].y();
      };
      writer = function (index, x, y) {
        output[index] = geo.latlng(y, x);
      };
    } else {
      xAcc = function () {
        return coordinates.x();
      };
      yAcc = function () {
        return coordinates.y();
      };
      writer = function (index, x, y) {
        /// TODO Is there a better way to silent warning?
        index = index;
        output = geo.latlng(y, x);
      };
    }
  }

  /// Helper methods
  function handleArrayCoordinates() {
    if (coordinates[0] instanceof Array) {
      if (coordinates[0].length % 2 === 0) {
        xAcc = function (index) {
          return coordinates[index][0];
        };
        yAcc = function (index) {
          return coordinates[index][1];
        };
        writer = function (index, x, y) {
          output[index] = [x, y];
        };
      } else if (coordinates[0].length % 3 === 0) {
        xAcc = function (index) {
          return coordinates[index][0];
        };
        yAcc = function (index) {
          return coordinates[index][1];
        };
        zAcc = function (index) {
          return coordinates[index][2];
        };
        writer = function (index, x, y, z) {
          output[index] = [x, y, z];
        };
      }
    } else {
      if (coordinates.length % 2 === 0) {
        offset = 2;

        xAcc = function (index) {
          return coordinates[index * offset];
        };
        yAcc = function (index) {
          return coordinates[index * offset + 1];
        };
        writer = function (index, x, y) {
          output[index] = x;
          output[index + 1] = y;
        };
      } else if (coordinates.length % 3 === 0) {
        offset = 3;

        xAcc = function (index) {
          return coordinates[index * offset];
        };
        yAcc = function (index) {
          return coordinates[index * offset + 1];
        };
        zAcc = function (index) {
          return coordinates[index * offset + 2];
        };
        writer = function (index, x, y, z) {
          output[index] = x;
          output[index + 1] = y;
          output[index + 2] = z;
        };
      } else {
        throw "Invalid coordinates";
      }
    }
  }

  /// Helper methods
  function handleObjectCoordinates() {

    if (coordinates[0] &&
        "x" in coordinates[0] &&
        "y" in coordinates[0]) {
      xAcc = function (index) {
        return coordinates[index].x;
      };
      yAcc = function (index) {
        return coordinates[index].y;
      };

      if ("z" in coordinates[0]) {
        zAcc = function (index) {
          return coordinates[index].z;
        };
        writer = function (index, x, y, z) {
          output[i] = {x: x, y: y, z: z};
        };
      } else {
        writer = function (index, x, y) {
          output[index] = {x: x, y: y};
        };
      }
    } else if (coordinates &&
        "x" in coordinates && "y" in coordinates) {
      xAcc = function () {
        return coordinates.x;
      };
      yAcc = function () {
        return coordinates.y;
      };

      if ("z" in coordinates) {
        zAcc = function () {
          return coordinates.z;
        };
        writer = function (index, x, y, z) {
          output = {x: x, y: y, z: z};
        };
      } else {
        writer = function (index, x, y) {
          output = {x: x, y: y};
        };
      }
    } else {
      throw "Invalid coordinates";
    }
  }

  if (coordinates instanceof Array) {
    output = [];
    output.length = coordinates.length;
    count = coordinates.length;

    if (coordinates[0] instanceof Array ||
        coordinates[0] instanceof geo.latlng ||
        coordinates[0] instanceof Object) {
      offset = 1;

      if (coordinates[0] instanceof Array) {
        handleArrayCoordinates();
      } else if (coordinates[0] instanceof geo.latlng) {
        handleLatLngCoordinates();
      } else if (coordinates[0] instanceof Object) {
        handleObjectCoordinates();
      }
    } else {
      handleArrayCoordinates();
    }
  } else if (coordinates && coordinates instanceof Object) {
    count = 1;
    offset = 1;
    if (coordinates instanceof geo.latlng) {
      handleLatLngCoordinates();
    } else if (coordinates && "x" in coordinates && "y" in coordinates) {
      handleObjectCoordinates();
    } else {
      throw "Coordinates are not valid";
    }
  }

  if (destGcs === "EPSG:3857" && srcGcs === "EPSG:4326") {
    for (i = 0; i < count; i += offset) {
      /// Y goes from 0 (top edge is 85.0511 °N) to 2zoom − 1
      /// (bottom edge is 85.0511 °S) in a Mercator projection.
      xCoord = xAcc(i);
      yCoord = yAcc(i);
      zCoord = zAcc(i);

      if (yCoord > 85.0511) {
        yCoord = 85.0511;
      }
      if (yCoord < -85.0511) {
        yCoord = -85.0511;
      }

      writer(i, xCoord, geo.mercator.lat2y(yCoord), zCoord);
    }

    return output;
  } else {
    for (i = 0; i < count; i += offset) {
      projPoint = new proj4.Point(xAcc(i), yAcc(i), zAcc(i));
      proj4.transform(projSrcGcs, projDestGcs, projPoint);
      writer(i, projPoint[0].x, projPoint.y, projPoint.z);
      return output;
    }
  }
};
