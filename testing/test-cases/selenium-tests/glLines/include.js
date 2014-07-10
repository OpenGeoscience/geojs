window.startTest = function(done) {
    $("#map").width("100%");
    $("#map").height("100%");

    var mapOptions = {
      node: '#map',
      zoom : 3,
      center : [38.8, -96.2]
    };

    var myMap = geo.map(mapOptions),
        table = [],
        citieslatlon = [],
        width, height;

    function resizeCanvas() {
      width = $('#map').width();
      height = $('#map').height();
      updateAndDraw(width, height);
    }
    resizeCanvas();

    function updateAndDraw(width, height) {
      myMap.resize(0, 0, width, height);
      myMap.draw();
    }

    table = [
          [ "NEW YORK","NY","40.757929","-73.985506"],
          [ "LOS ANGELES","CA","34.052187","-118.243425"],
          [ "DENVER","CO","39.755092","-104.988123"],
          [ "PORTLAND","OR","45.523104","-122.670132"],
          [ "HONOLULU","HI","21.291982","-157.821856"],
          [ "ANCHORAGE","AK","61.216583","-149.899597"],
          [ "DALLAS","TX","32.781078","-96.797111"],
          [ "SALT LAKE CITY","UT","40.771592","-111.888189"],
          [ "MIAMI","FL","25.774252","-80.190262"],
          [ "PHOENIX","AZ","33.448263","-112.073821"],
          [ "CHICAGO","IL","41.879535","-87.624333"],
          [ "WASHINGTON","DC","38.892091","-77.024055"],
          [ "SEATTLE","WA","47.620716","-122.347533"],
          [ "NEW ORLEANS","LA","30.042487","-90.025126"],
          [ "SAN FRANCISCO","CA","37.775196","-122.419204"],
          [ "ATLANTA","GA","33.754487","-84.389663"]
        ]

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
        }
      }
    }

    var mouseOverElement = 0;
    // Load image to be used for drawing dots
    var osm = myMap.createLayer('osm'),
        layer = myMap.createLayer('feature');

    var color = d3.scale.category10()
                  .domain(d3.range(10)),
                style = {
                    color: [1, 0, 0],
                    size: [5],
                    opacity: 0.5
                };
    var points = layer.createFeature('line', {bin: layer.bin()})
        .positions(citieslatlon)
        .style(style);

    resizeCanvas();
    myMap.draw();

    done();
};
