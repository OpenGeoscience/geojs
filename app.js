/*========================================================================
  VGL --- VTK WebGL Rendering Toolkit

  Copyright 2013 Kitware, Inc.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 ========================================================================*/

// Disable console log
// console.log = function() {}
///////////////////////////////////////////////////////////////////////////////
//
// main program
//
///////////////////////////////////////////////////////////////////////////////
function main() {

  var mapOptions = {
    zoom : 1,
    center : ogs.geo.latlng(30.0, 70.0)
  };

  var myMap = ogs.geo.map(document.getElementById("glcanvas"), mapOptions);
  var planeLayer = ogs.geo.featureLayer({
    "opacity" : 1,
    "showAttribution" : 1,
    "visible" : 1
  }, ogs.geo.planeFeature(ogs.geo.latlng(-90.0, 0.0), ogs.geo.latlng(90.0,
                                                                     180.0)));
  myMap.addLayer(planeLayer);

  // Read city geo-coded data
  var table = [];
  var citieslatlon = [];
  var colors = [];
  $.ajax({
    type : "GET",
    url : "./data/cities.csv",
    dataType : "text",
    success : function(data) {
      table = processCSVData(data);
      if (table.length > 0) {
        var i;
        for (i = 0; i < table.length; ++i) {
          if (table[i][2] != undefined) {
            var lat = table[i][2];
            lat = lat.replace(/(^\s+|\s+$|^\"|\"$)/g, '');
            lat = parseFloat(lat);

            var lon = table[i][3];
            lon = lon.replace(/(^\s+|\s+$|^\"|\"$)/g, '');
            lon = parseFloat(lon);
            citieslatlon.push(lon, lat, 0.0);
            colors.push(1.0, 1.0, 153.0 / 255.0);
          }
        }

        var pointLayer = ogs.geo.featureLayer({
          "opacity" : 1,
          "showAttribution" : 1,
          "visible" : 1
        }, ogs.geo.pointSpritesFeature('/data/assets/spark.png', citieslatlon,
                                       colors));

        myMap.addLayer(pointLayer);
      }
    }
  });

  // Listen for slider slidechange event
  $('#slider-vertical').slider().bind('slide', function(event, ui) {
    planeLayer.setOpacity(ui.value);
    myMap.redraw();
  });

  (function() {
    var canvas = document.getElementById('glcanvas');

    // Resize the canvas to fill browser window dynamically
    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 0.85;
      updateAndDraw(canvas.width, canvas.height);
    }
    resizeCanvas();

    function updateAndDraw(width, height) {
      myMap.resize(width, height);
      myMap.redraw();
    }
  })();
}

function processCSVData(csvdata) {
  var table = [];
  var lines = csvdata.split(/\r\n|\n/);

  for ( var i = 0; i < lines.length; i++) {
    var row = lines[i].split(',');
    table.push(row);
  }
  return table;
}
