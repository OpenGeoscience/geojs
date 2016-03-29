describe('geo.util.clustering', function () {
  'use strict';

  var geo = require('../test-utils').geo;

  var ClusterGroup = geo.util.ClusterGroup;
  it('single point with defaults', function () {
    var cl = new ClusterGroup();
    cl.addPoint({x: 0, y: 0});
    expect(cl._topClusterLevel.count()).toBe(1);
    expect(cl._topClusterLevel._points.length).toBe(1);
  });
  it('three disjoint points', function () {
    var cl = new ClusterGroup();
    cl.addPoint({x: 0, y: 0});
    cl.addPoint({x: 50, y: 0});
    cl.addPoint({x: 0, y: 50});
    expect(cl._topClusterLevel.count()).toBe(3);
    expect(cl._topClusterLevel._points.length).toBe(3);
  });
  it('three clustered points', function () {
    var cl = new ClusterGroup();
    cl.addPoint({x: 0, y: 0});
    cl.addPoint({x: 1, y: 0});
    cl.addPoint({x: 0, y: 1});
    expect(cl._topClusterLevel.count()).toBe(3);
    expect(cl._topClusterLevel._points.length).toBe(0);

    // They shouldn't be clustered at the highest zoom level
    expect(cl.clusters(17).length).toBe(0);
    expect(cl.points(17).length).toBe(3);
  });
  it('three clusters', function () {
    var cl = new ClusterGroup();

    cl.addPoint({x: 0, y: 0});
    cl.addPoint({x: 1, y: 0});
    cl.addPoint({x: 0, y: 50});

    cl.addPoint({x: 50, y: 0});
    cl.addPoint({x: 0, y: 1});
    cl.addPoint({x: 50, y: 1});

    cl.addPoint({x: 1, y: 50});
    cl.addPoint({x: 51, y: 0});
    cl.addPoint({x: 0, y: 51});

    expect(cl._topClusterLevel.count()).toBe(9);
    expect(cl.clusters(0).length).toBe(3);
    expect(cl.points(0).length).toBe(0);

    expect(cl.clusters(17).length).toBe(0);
    expect(cl.points(17).length).toBe(9);
  });
  it('three cluster levels', function () {
    var cl = new ClusterGroup();

    cl.addPoint({x: 0, y: 0});
    cl.addPoint({x: 1, y: 0});

    cl.addPoint({x: 0, y: 0.1});
    cl.addPoint({x: 1, y: -0.1});

    cl.addPoint({x: 0.01, y: 0.11});
    cl.addPoint({x: 1.01, y: -0.105});

    expect(cl._topClusterLevel.count()).toBe(6);
    expect(cl.clusters(0).length).toBe(1);
    expect(cl.points(0).length).toBe(0);

    expect(cl.clusters(5).length).toBe(2);
    expect(cl.points(5).length).toBe(0);

    expect(cl.clusters(17).length).toBe(0);
    expect(cl.points(17).length).toBe(6);
  });
  it('point cluster tree', function () {
    var cl = new ClusterGroup();

    cl.addPoint({x: 0, y: 0});
    cl.addPoint({x: 50, y: 50});

    expect(cl.clusters(0).length).toBe(0);
    expect(cl.points(0).length).toBe(2);

    cl.addPoint({x: 1, y: 0});
    expect(cl.clusters(0).length).toBe(1);
    expect(cl.points(0).length).toBe(1);

    cl.addPoint({x: 1.1, y: 0.1});
    expect(cl.clusters(0).length).toBe(1);
    expect(cl.points(0).length).toBe(1);
    expect(cl.clusters(5).length).toBe(1);
    expect(cl.points(5).length).toBe(2);

    cl.addPoint({x: -50, y: 50});
    expect(cl.clusters(0).length).toBe(1);
    expect(cl.points(0).length).toBe(2);
    expect(cl.clusters(5).length).toBe(1);
    expect(cl.points(5).length).toBe(3);

    cl.addPoint({x: -50.001, y: 50});
    expect(cl.clusters(0).length).toBe(2);
    expect(cl.points(0).length).toBe(1);
    expect(cl.clusters(5).length).toBe(2);
    expect(cl.points(5).length).toBe(2);
    expect(cl.clusters(10).length).toBe(1);
    expect(cl.points(10).length).toBe(4);
    expect(cl.clusters(15).length).toBe(0);
    expect(cl.points(15).length).toBe(6);
  });
});
