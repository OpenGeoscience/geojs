$(function () {
  'use strict';

  // Example from http://bl.ocks.org/mbostock/3884955
  var margin = {top: 20, right: 60, bottom: 30, left: 30},
      width = 710 - margin.left - margin.right,
      height = 410 - margin.top - margin.bottom;

  var parseDate = d3.timeParse('%Y%m%d');

  var x = d3.scaleTime()
        .range([0, width]);

  var y = d3.scaleLinear()
        .range([height, 0]);

  var color = d3.scaleOrdinal(d3.schemeCategory10);

  var xAxis = d3.axisBottom(x)
        .tickFormat(d3.timeFormat('%b'));

  var yAxis = d3.axisLeft(y);

  var line = d3.line()
        .curve(d3.curveBasis)
        .x(function (d) { return x(d.date); })
        .y(function (d) { return y(d.temperature); });

  var svg = d3.select('#svg-container').append('svg')
        .attr('width', 710 + margin.right + margin.left)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  d3.tsv('../../data/temperature_data.tsv').then(function (data) {
    color.domain(Object.keys(data[0]).filter(function (key) { return key !== 'date'; }));

    data.forEach(function (d) {
      d.date = parseDate(d.date);
    });

    var cities = color.domain().map(function (name) {
      return {
        name: name,
        values: data.map(function (d) {
          return {date: d.date, temperature: +d[name]};
        })
      };
    });

    x.domain(d3.extent(data, function (d) { return d.date; }));

    y.domain([
      d3.min(cities, function (c) { return d3.min(c.values, function (v) { return v.temperature; }); }),
      d3.max(cities, function (c) { return d3.max(c.values, function (v) { return v.temperature; }); })
    ]);

    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

    svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Temperature (ºF)');

    var city = svg.selectAll('.city')
          .data(cities)
          .enter().append('g')
          .attr('class', 'city');

    city.append('path')
      .attr('class', 'line')
      .attr('d', function (d) { return line(d.values); })
      .style('stroke', function (d) { return color(d.name); });

    city.append('text')
      .datum(function (d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
      .attr('transform', function (d) { return 'translate(' + x(d.value.date) + ',' + y(d.value.temperature) + ')'; })
      .attr('x', 3)
      .attr('dy', '.35em')
      .text(function (d) { return d.name; });
  });
});
