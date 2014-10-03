/*global it, describe, expect*/
describe("geojsonReader", function () {
  "use strict";

  var obj, map, width = 800, height = 600, layer;

  it("Setup map", function () {
    map = geo.map({node: "#map", center: [0, 0], zoom: 3});
    layer = map.createLayer("feature");

    map.resize(0, 0, width, height);

    obj = {
      "features": [
        {
          "geometry": {
            "coordinates": [
              102.0,
              0.5
            ],
            "type": "Point"
          },
          "properties": {
            "color": [1, 0, 0],
            "size": [10]
          },
          "type": "Feature"
        },
        {
          "geometry": {
            "coordinates": [
              [
                102.0,
                0.0
              ],
              [
                103.0,
                1.0
              ],
              [
                104.0,
                0.0
              ],
              [
                105.0,
                1.0
              ]
            ],
            "type": "LineString"
          },
          "properties": {
            "color": [0, 1, 0],
            "width": [3]
          },
          "type": "Feature"
        },
        {
          "geometry": {
            "coordinates": [
              [
                10.0,
                0.5
              ],
              [
                10.0,
                -0.5
              ]
            ],
            "type": "MultiPoint"
          },
          "properties": {
            "color": [0, 0, 1],
            "size": [7]
          },
          "type": "Feature"
        },
      ],
      "type": "FeatureCollection"
    };
  });
  it("read from object", function (done) {
    var reader = geo.createFileReader("jsonReader", {"layer": layer});

    expect(reader.canRead(obj)).toBe(true);
    reader.read(obj, function (features) {
      expect(features.length === 3).toBe(true);
      done();
    });
  });

});
