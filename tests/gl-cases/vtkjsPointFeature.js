var $ = require('jquery');
var createMap = require('../test-utils').createMap;
var destroyMap = require('../test-utils').destroyMap;
var waitForIt = require('../test-utils').waitForIt;

/* This is a basic integration test of geo.gvtkjs.pointFeature. */
describe('geo.vtkjs.pointFeature', function () {
  var testPoints = [
    {x: 20, y: 10}, {x: 25, y: 10}, {x: 30, y: 10}, {x: 35, y: 12},
    {x: 32, y: 15}, {x: 30, y: 20}, {x: 35, y: 22}, {x: 32, y: 25},
    {x: 30, y: 30}, {x: 35, y: 32}, {x: 32, y: 35}, {x: 30, y: 30},
    {x: 40, y: 20, radius: 10}, {x: 42, y: 20, radius: 5},
    {x: 44, y: 20, radius: 2}, {x: 46, y: 20, radius: 2},
    {x: 50, y: 10}, {x: 50, y: 10}, {x: 60, y: 10}
  ];

  var map, layer, point, calledRadius;
  it('basic usage', function () {
    map = createMap();
    layer = map.createLayer('feature', {renderer: 'vtkjs'});
    point = layer.createFeature('point', {
      style: {
        strokeWidth: 2,
        radius: function (d) {
          calledRadius = true;
          return d.radius ? d.radius : 5;
        }
      }
    }).data(testPoints);
    sinon.spy(point, '_update');
    point.draw();
    expect(point._update.calledOnce).toBe(true);
    point._update.restore();
    expect($('#map div canvas').length).toBe(1);
  });
  waitForIt('points to be generated', function () {
    return calledRadius;
  });
  it('exit', function () {
    destroyMap();
    expect(true).toBe(true);
  });
});
