/*global describe, it, expect, geo*/
describe('geo.util.clustering', function () {
  'use strict';

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
  });
});
