// Run after the DOM loads
$(function () {
  'use strict';

  var map, layer, feature, ui, save, infoData = null, canvas;

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
    if (p >= 980 && p <= 994) {
      return 1;
    }
    return 0;
  }

  function makeInfoBox(data) {
    if (data) {
      infoData = data;
    } else {
      data = infoData;
    }
    if (!data) {
      return;
    }

    canvas = d3.select(ui.canvas()).select('svg.dynamic-content')
      .attr('width', $(window).width())
      .attr('height', $(window).height());

    canvas.selectAll('.app-info-box').remove();
    var width = 300, height = 600;
    var mapWidth = map.node().width();
    var mapHeight = map.node().height();

    var group = canvas.append('g').attr('class', 'app-info-box');

    group.attr(
      'transform',
      'translate(' + [mapWidth - width - 35, mapHeight - height + 10] + ')'
    );

    var name = data.name.toLowerCase();
    var year = new Date(data.time[0]).getFullYear();
    name = name[0].toUpperCase() + name.slice(1);

    group.append('rect')
      .attr('class', 'app-background')
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('y', '-3.3em')
      .attr('width', width + 20)
      .attr('height', '2em');

    group.append('text')
      .attr('x', width / 2)
      .attr('y', '-2em')
      .attr('text-anchor', 'middle')
      .text('Hurricane ' + name + ' of ' + year)
      .style('font', '20px');

    function makePlot(d) {
      var group = d3.select(this);
      var t, f, i;

      if (d === 0) {
        i = 'wind';
        t = 'Wind speed';
        f = function (d, j) { return data[i][j]; };
      } else if (d === 1) {
        i = 'pressure';
        t = 'Surface pressure';
        f = function (d, j) { return data[i][j]; };
      } else if (d === 2) {
        i = 'pressure';
        t = 'Category';
        f = function (d, j) { return category(data[i][j]); };
      }

      group.attr('transform', 'translate(0,' + (d * height / 3) + ')');

      group.append('rect')
        .attr('class', 'app-background')
        .attr('rx', 5)
        .attr('ry', 5)
        .attr('width', width + 20)
        .attr('height', (height - 70) / 3);

      data.time = data.time.map(function (t) { return new Date(t.valueOf()); });
      var x = d3.time.scale().nice(4)
        .domain(d3.extent(data.time))
        .range([50, width]);
      var y = d3.scale.linear().nice(5)
        .domain(d3.extent(data.time, f))
        .range([height / 3 - 50, 36]);

      var xAxis = d3.svg.axis()
        .scale(x)
        .ticks(4)
        .orient('bottom');

      var yAxis = d3.svg.axis()
        .scale(y)
        .ticks(5)
        .orient('left');

      group.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + y.range()[0] + ')')
        .call(xAxis);

      group.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + x.range()[0] + ')')
        .call(yAxis);

      var line = d3.svg.line()
        .x(function (d) { return x(d); })
        .y(function (d, j) { return y(f(d, j)); });

      group.append('path')
        .attr('class', 'plot-line')
        .attr('d', line(data.time));

      group.append('text')
        .attr('x', width / 2 + 10)
        .attr('y', '1em')
        .attr('text-anchor', 'middle')
        .text(t);
    }

    group.selectAll('.app-plot').data(d3.range(3)).enter()
      .append('g')
        .attr('class', 'app-plot')
        .each(makePlot);

    return data;
  }

  function makeHistogram(data) {
    var margin = {top: 45, right: 10, left: 10, bottom: 30};
    var mapHeight = map.node().height() - 15;
    var width = 300;
    var height = 100;

    canvas = d3.select(ui.canvas()).select('svg.dynamic-content')
      .attr('width', $(window).width())
      .attr('height', $(window).height());

    canvas.selectAll('.app-histogram').remove();
    var group = canvas.append('g').attr('class', 'app-histogram');

    var x = d3.scale.linear()
      .domain([-0.5, 5.5])
      .range([15 + margin.left, 15 + margin.left + width]);

    var cats = [];
    data.forEach(function (d) {
      d.pressure.forEach(function (p) {
        cats.push(category(p));
      });
    });

    var hist = d3.layout.histogram()
      .bins(d3.range(7))(cats);

    var y = d3.scale.linear()
      .domain([0, d3.max(hist, function (d) { return d.y; })])
      .range([mapHeight - margin.bottom, mapHeight - height - margin.bottom]);

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient('bottom')
      .tickValues(d3.range(6))
      .tickFormat(d3.format('.0f'));

    group.append('rect')
      .attr('class', 'app-background')
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('x', x.range()[0] - margin.left)
      .attr('y', y.range()[1] - margin.top)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.bottom + margin.top);

    var bar = group.selectAll('.bar')
        .data(hist)
      .enter().append('g')
        .attr('class', 'bar')
        .attr('transform', function (d) {
          return 'translate(' + [x(d.x - 0.5), 0] + ')';
        });

    bar.append('rect')
      .attr('x', 1)
      .attr('y', function (d) { return y(d.y); })
      .attr('width', x(1) - x(0) - 2)
      .attr('height', function (d) {
        return y(0) - y(d.y);
      })
      .style('fill', function (d) {
        return cscale(d.x);
      });

    bar.append('text')
      .attr('dy', '0.75em')
      .attr('y', function (d) {
        return y(d.y) - 18;
      })
      .attr('x', (x(1 + hist[0].dx) - x(1)) / 2)
      .attr('text-anchor', 'middle')
      .text(function (d) {
        return d.y;
      });

    group.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(' + [0, y(0)] + ')')
      .call(xAxis);

    group.append('text')
      .attr('x', x(2.5))
      .attr('y', y.range()[1] - margin.top)
      .attr('dy', '1em')
      .attr('text-anchor', 'middle')
      .text('All observations');
  }

  function draw(data) {
    if (data) {
      save = data;
    } else {
      data = save;
    }
    data = data.filter(function (d) {
      if (any(d.pressure, function (d) { return d <= 0; })) {
        return false;
      }

      if (all(d.pressure, function (d) { return category(d) === 0; })) {
        return false;
      }
      return d.basin === 'North Atlantic';
    });

    makeHistogram(data);

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
        'strokeWidth': function (d, i, l, pos) {
          if (data[pos].hover) {
            return 5;
          }
          return 1.5;
        },
        'strokeOpacity': function (d, i, l, pos) {
          if (data[pos].hover) {
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
        makeInfoBox(evt.data);
        this.modified();
        feature.draw();
      });
    feature.draw();
  }

  // Create a map object
  map = geo.map({
    node: '#map',
    center: {
      x: -50,
      y: 30
    },
    zoom: 4
  });

  // Add the default osm layer
  map.createLayer('osm');

  // Create a feature layer to draw on.
  layer = map.createLayer('feature', {features: [geo.lineFeature.capabilities.multicolor]});

  // Create a line feature
  feature = layer.createFeature('line', {selectionAPI: true});

  // Create a legend
  ui = map.createLayer('ui');
  ui.createWidget('legend', {position: {right: 20, top: 10}})
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

  canvas = d3.select(ui.canvas()).append('svg')
    .attr('class', 'dynamic-content');

  // Load the data
  $.ajax({
    url: '../../data/hurricanes.json',
    success: draw
  });

  $(window).resize(function () {
    draw();
    makeInfoBox();
  });
});
