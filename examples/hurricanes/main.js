// Run after the DOM loads
$(function () {
  'use strict';

  var map, layer, feature;

  var cscale = d3.scale.ordinal()
    .range([
      '#7f7f7f',
      '#d62728',
      '#ff7f0e',
      '#bcbd22',
      '#9467bd',
      '#17becf'
    ])
    .domain([
      0,
      5,
      4,
      3,
      2,
      1
    ]);

  var start = new Date('1980-01-01');
  var drange = (new Date('2015-01-01') - start);

  function any(a, f) {
    var v = false;
    a.forEach(function (d) {
      v = v || f(d);
    });
    return v;
  }

  function all(a, f) {
    var v = true;
    a.forEach(function (d) {
      v = v && f(d);
    });
    return v;
  }

  function category(d) {
    var p = d;
    if (p <= 0) {
      return -1; // invalid data
    }
    if (p < 920) {
      return 5;
    }
    if (p <= 944) {
      return 4;
    }
    if (p <= 964) {
      return 3;
    }
    if (p <= 979) {
      return 2;
    }
    if (p <= 979) {
      return 1;
    }
    return 0;
  }

  function draw(data) {
    data = data.filter(function (d) {
      if (any(d.pressure, function (d) { return d <= 0; })) {
        return false;
      }

      if (all(d.pressure, function (d) { return category(d) === 0; })) {
        return false;
      }
      return d.basin === 'North Atlantic';
    });
    feature.data(data)
      .line(function (d) {
        return d3.range(d.time.length).map(function (i) {
          return {
            x: d.longitude[i],
            y: d.latitude[i],
            t: new Date(d.time[i]),
            w: d.wind[i],
            p: d.pressure[i],
            d: d.dist2land[i],
            c: category(d.pressure[i])
          };
        });
      })
      .position(function (d) {
        return d;
      })
      .style({
        'strokeColor': function (d) {
          return cscale(d.c);
        },
        'strokeWidth': function (d, i, l) {
          if (l.hover) {
            return 3;
          }
          return 1.5;
        },
        'strokeOpacity': function (d, i, l) {
          if (l.hover) {
            return 1;
          }
          if (d.c === 0) {
            return 0.25;
          }
          return 0.25 + 0.5 * (d.t - start) / drange;
        }
      })
      .geoOff(geo.event.feature.mouseover)
      .geoOff(geo.event.feature.mouseout)
      .geoOn(geo.event.feature.mouseover, function (evt) {
        if (!evt.top) { return; }
        data.forEach(function (d) {
          d.hover = false;
        });
        evt.data.hover = true;
        this.modified();
        map.draw();
      })
      .geoOn(geo.event.feature.mouseout, function (evt) {
        evt.data.hover = false;
        this.modified();
        map.draw();
      });
    map.draw();
  }

  // Create a map object
  map = geo.map({
    node: '#map',
    center: {
      x: 0,
      y: 0
    },
    zoom: 0
  });

  // Add the osm layer with a custom tile url
  map.createLayer(
    'osm',
    {
      baseUrl: 'http://otile1.mqcdn.com/tiles/1.0.0/map/'
    }
  );

  // Make the map resize with the browser window
  $(window).resize(function () {
    map.resize(0, 0, map.node().width(), map.node().height());
  });

  // Draw the map
  map.draw();

  // Create a feature layer to draw on
  layer = map.createLayer('feature');

  // Create a line feature
  feature = layer.createFeature('line', {selectionAPI: true});

  // Create a legend
  map.createLayer('ui').createWidget('legend')
    .categories([
      {
        name: 'Category 5',
        style: {
          strokeColor: cscale(5),
          strokeWidth: 3
        },
        type: 'line'
      },
      {
        name: 'Category 4',
        style: {
          strokeColor: cscale(4),
          strokeWidth: 3
        },
        type: 'line'
      },
      {
        name: 'Category 3',
        style: {
          strokeColor: cscale(3),
          strokeWidth: 3
        },
        type: 'line'
      },
      {
        name: 'Category 2',
        style: {
          strokeColor: cscale(2),
          strokeWidth: 3
        },
        type: 'line'
      },
      {
        name: 'Category 1',
        style: {
          strokeColor: cscale(1),
          strokeWidth: 3
        },
        type: 'line'
      },
      {
        name: 'Other',
        style: {
          strokeColor: cscale(0),
          strokeWidth: 3
        },
        type: 'line'
      }
    ]);

  // Load the data
  $.ajax({
    url: '/data/hurricanes.json',
    success: draw
  });
});
