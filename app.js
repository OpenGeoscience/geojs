// Disable console log
// console.log = function() {}

/**
 * Main program
 */
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
    url : "/data/assets/cities.csv",
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

        // Load image to be used for drawing dots
        var image = new Image();
        image.src = '/data/assets/spark.png';
        image.onload = function() {
          var pointLayer = ogs.geo.featureLayer({
            "opacity" : 1,
            "showAttribution" : 1,
            "visible" : 1
          }, ogs.geo.pointSpritesFeature(image, citieslatlon, colors));

          myMap.addLayer(pointLayer);
        };
      }
    }
  });

  // Listen for slider slidechange event
  $('#slider-vertical').slider().bind('slide', function(event, ui) {
    planeLayer.setOpacity(ui.value);
    myMap.redraw();
  });

  $('#slider-vertical').on('mousedown', function(e) {
    e.stopPropagation();
    return false;
  });

  (function() {
    var canvas = document.getElementById('glcanvas');

    // Resize the canvas to fill browser window dynamically
    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
