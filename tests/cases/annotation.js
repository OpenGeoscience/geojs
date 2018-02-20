/* Test geo.annotation */

describe('geo.annotation', function () {
  'use strict';

  var $ = require('jquery');
  var geo = require('../test-utils').geo;
  var createMap = require('../test-utils').createMap;
  var destroyMap = require('../test-utils').destroyMap;
  var mockVGLRenderer = geo.util.mockVGLRenderer;
  var restoreVGLRenderer = geo.util.restoreVGLRenderer;

  beforeEach(function () {
    mockVGLRenderer();
  });

  afterEach(function () {
    destroyMap();
    restoreVGLRenderer();
  });

  /**
   * Create an annotation with a set of points based on screen coordinates.
   * The returned annotation has a property _handles which references the
   * generated edit handles.
   *
   * @param {geo.map} map The map to use.
   * @param {geo.annotationLayer} layer The annotation layer.
   * @param {geo.screenPosition[]} pts The vertices of the annotation.
   * @returns {geo.annotation}
   */
  function createEditableAnnotation(map, layer, pts) {
    var ann = geo.annotation.annotation('test', {layer: layer, style: {}}),
        features = [];
    ann._coordinates = function (coor) {
      return ann.options.call(ann, 'vertices', coor);
    };
    ann._coordinates(map.displayToGcs(pts, null));
    ann._addEditHandles(features, ann._coordinates());
    ann._handles = features[geo.annotation._editHandleFeatureLevel].point;
    return ann;
  }

  /**
   * Create an event that can be passed to edit handle functions with mouse
   * movement.  This translates screen coordinates to appropriate mapgcs
   * values.
   *
   * @param {geo.map} map The map to use.
   * @param {geo.screenPosition} start Where the mouse started its drag.
   * @param {geo.screenPosition} end Where the mouse is currently located.
   * @returns {object} an object that can be used as a edit handle event.
   */
  function editHandleEvent(map, start, end) {
    return {
      mouse: {mapgcs: map.displayToGcs(end, null)},
      state: {origin: {mapgcs: map.displayToGcs(start, null)}},
      buttonsDown: {},
      time: new Date().getTime()
    };
  }

  describe('geo.annotation.annotation', function () {
    var map, layer, stateEvent = 0, lastStateEvent;
    it('create', function () {
      var ann = geo.annotation.annotation('test');
      expect(ann instanceof geo.annotation.annotation);
      /* test defaults from various functions */
      expect(ann.type()).toBe('test');
      expect(ann.state()).toBe(geo.annotation.state.done);
      expect(ann.id()).toBeGreaterThan(0);
      expect(ann.name()).toBe('Test ' + ann.id());
      expect(ann.label()).toBe('Test ' + ann.id());
      expect(ann.label(undefined, true)).toBe(null);
      expect(ann.description()).toBe(undefined);
      expect(ann.layer()).toBe(undefined);
      expect(ann.features()).toEqual([]);
      expect(ann.coordinates()).toEqual([]);
      expect(ann.actions()).toEqual([]);
      expect(ann.actions(geo.annotation.state.edit).length).toEqual(2);
      expect(ann.processAction()).toBe(undefined);
      expect(ann.processEditAction()).toBe(undefined);
      expect(ann.mouseClick()).toBe(undefined);
      expect(ann.mouseClickEdit()).toBe(undefined);
      expect(ann.mouseMove()).toBe(undefined);
      expect(ann._coordinates()).toEqual([]);
      expect(ann.geojson()).toBe(undefined);
      map = createMap();
      layer = map.createLayer('annotation', {
        annotations: geo.listAnnotations()
      });
      var params = {
        layer: layer,
        name: 'Annotation',
        state: geo.annotation.state.create
      };
      ann = geo.annotation.annotation('test2', params);
      expect(ann.type()).toBe('test2');
      expect(ann.state()).toBe(geo.annotation.state.create);
      expect(ann.id()).toBeGreaterThan(0);
      expect(ann.name()).toBe('Annotation');
      expect(ann.layer()).toBe(layer);
      expect(ann.coordinates()).toEqual([]);

      // check that reusing an annotationId throws a warning
      sinon.stub(console, 'warn', function () {});
      params.annotationId = 10;
      ann = geo.annotation.annotation('test2', params);
      layer.addAnnotation(ann);
      expect(console.warn.calledOnce).toBe(false);
      geo.annotation.annotation('test2', params);
      expect(console.warn.calledOnce).toBe(true);
      console.warn.restore();
    });
    it('_exit', function () {
      var ann = geo.annotation.annotation('test');
      expect(ann._exit()).toBe(undefined);
    });
    it('name', function () {
      var ann = geo.annotation.annotation('test');
      expect(ann.name()).toBe('Test ' + ann.id());
      expect(ann.name('New Name')).toBe(ann);
      expect(ann.name()).toBe('New Name');
      expect(ann.name('')).toBe(ann);
      expect(ann.name()).toBe('New Name');
    });
    it('label', function () {
      var ann = geo.annotation.annotation('test');
      expect(ann.label()).toBe('Test ' + ann.id());
      expect(ann.label(undefined, true)).toBe(null);
      expect(ann.label('New Label')).toBe(ann);
      expect(ann.label()).toBe('New Label');
      expect(ann.label('')).toBe(ann);
      expect(ann.label()).toBe('');
      expect(ann.label(null)).toBe(ann);
      expect(ann.label()).toBe('Test ' + ann.id());
      expect(ann.label(undefined, true)).toBe(null);
    });
    it('description', function () {
      var ann = geo.annotation.annotation('test');
      expect(ann.description()).toBe(undefined);
      expect(ann.description('New Description')).toBe(ann);
      expect(ann.description()).toBe('New Description');
      expect(ann.description('')).toBe(ann);
      expect(ann.description()).toBe('');
    });
    it('layer', function () {
      var ann = geo.annotation.annotation('test');
      expect(ann.layer()).toBe(undefined);
      expect(ann.layer(layer)).toBe(ann);
      expect(ann.layer()).toBe(layer);
    });
    it('state', function () {
      var ann = geo.annotation.annotation('test', {layer: layer});
      map.geoOn(geo.event.annotation.state, function (evt) {
        stateEvent += 1;
        lastStateEvent = evt;
      });
      expect(ann.state()).toBe(geo.annotation.state.done);
      expect(ann.state(geo.annotation.state.create)).toBe(ann);
      expect(stateEvent).toBe(1);
      expect(lastStateEvent.annotation).toBe(ann);
      expect(ann.state()).toBe(geo.annotation.state.create);
      expect(ann.state(geo.annotation.state.create)).toBe(ann);
      expect(stateEvent).toBe(1);
      expect(ann.state(geo.annotation.state.done)).toBe(ann);
      expect(stateEvent).toBe(2);
      expect(ann.state()).toBe(geo.annotation.state.done);
    });
    it('options', function () {
      var ann = geo.annotation.annotation('test', {layer: layer, testopt: 30});
      expect(ann.options().testopt).toBe(30);
      expect(ann.options('testopt')).toBe(30);
      expect(ann.options('testopt', 40)).toBe(ann);
      expect(ann.options().testopt).toBe(40);
      expect(ann.options({testopt: 30})).toBe(ann);
      expect(ann.options().testopt).toBe(30);
      /* name, label, description, and coordinates are handled specially */
      ann.options('name', 'newname');
      expect(ann.options().name).toBe(undefined);
      expect(ann.name()).toBe('newname');
      ann.options('label', 'newlabel');
      expect(ann.options().label).toBe(undefined);
      expect(ann.label()).toBe('newlabel');
      ann.options('description', 'newdescription');
      expect(ann.options().description).toBe(undefined);
      expect(ann.description()).toBe('newdescription');
      var coord = null, testval = [[1, 2], [3, 4]];
      ann._coordinates = function (arg) {
        if (arg !== undefined) {
          coord = arg;
          return ann;
        }
        return coord;
      };
      expect(ann._coordinates()).toBe(null);
      ann.options('coordinates', testval);
      expect(ann.options().coordinates).toBe(undefined);
      expect(ann._coordinates()).toBe(testval);
    });
    it('style and editStyle', function () {
      var ann = geo.annotation.annotation('test', {
        layer: layer, style: {testopt: 30}, editStyle: {testopt: 50}});
      expect(ann.options('style').testopt).toBe(30);
      expect(ann.style().testopt).toBe(30);
      expect(ann.style('testopt')).toBe(30);
      expect(ann.style('testopt', 40)).toBe(ann);
      expect(ann.style().testopt).toBe(40);
      expect(ann.style({testopt: 30})).toBe(ann);
      expect(ann.style().testopt).toBe(30);
      expect(ann.options('editStyle').testopt).toBe(50);
      expect(ann.editStyle().testopt).toBe(50);
      expect(ann.editStyle('testopt')).toBe(50);
      expect(ann.editStyle('testopt', 60)).toBe(ann);
      expect(ann.editStyle().testopt).toBe(60);
      expect(ann.editStyle({testopt: 50})).toBe(ann);
      expect(ann.editStyle().testopt).toBe(50);
    });
    it('coordinates', function () {
      var ann = geo.annotation.annotation('test', {layer: layer});
      var coord = [{x: 10, y: 30}, {x: 20, y: 25}];
      ann._coordinates = function () {
        return coord;
      };
      expect(ann.coordinates().length).toBe(2);
      expect(ann.coordinates(null)[0].x).toBeCloseTo(10);
      expect(ann.coordinates()[0].x).not.toBeCloseTo(10);
    });
    it('modified', function () {
      var ann = geo.annotation.annotation('test', {layer: layer});
      var buildTime = layer.getMTime();
      ann.modified();
      expect(layer.getMTime()).toBeGreaterThan(buildTime);
    });
    it('draw', function () {
      var oldDraw = layer.draw, drawCalled = 0;
      layer.draw = function () {
        drawCalled += 1;
      };
      var ann = geo.annotation.annotation('test', {layer: layer});
      ann.draw();
      expect(drawCalled).toBe(1);
      layer.draw = oldDraw;
    });
    it('geojson', function () {
      var ann = geo.annotation.annotation('test', {
        layer: layer,
        style: {fillColor: 'red'},
        labelStyle: {color: 'blue', textStrokeColor: 'rgba(0, 255, 0, 0.5)'},
        label: 'testLabel',
        description: 'testDescription',
        name: 'testAnnotation'
      });
      expect(ann.geojson()).toBe(undefined);
      ann._coordinates = function () {
        return geo.transform.transformCoordinates(map.ingcs(), map.gcs(), [
          -73.757222, 42.849776]);
      };
      ann._geojsonCoordinates = function (gcs) {
        return this.coordinates(gcs);
      };
      ann._geojsonGeometryType = function () {
        return 'Point';
      };
      var geojson = ann.geojson();
      expect(geojson.type).toBe('Feature');
      expect(geojson.geometry.type).toBe('Point');
      expect(geojson.geometry.coordinates.length).toBe(2);
      expect(geojson.geometry.coordinates[1]).toBeCloseTo(42.849775);
      expect(geojson.properties.name).toBe('testAnnotation');
      expect(geojson.properties.fillColor).toBe('#ff0000');
      expect(geojson.properties.description).toBe('testDescription');
      expect(geojson.properties.label).toBe('testLabel');
      expect(geojson.properties.labelColor).toBe('#0000ff');
      expect(geojson.properties.labelTextStrokeColor).toBe('#00ff0080');
      expect(geojson.properties.showLabel).toBe(undefined);
      expect(geojson.crs).toBe(undefined);
      geojson = ann.geojson('EPSG:3857');
      expect(geojson.geometry.coordinates[1]).toBeCloseTo(5289134.103576);
      expect(geojson.crs).toBe(undefined);
      geojson = ann.geojson('EPSG:3857', true);
      expect(geojson.crs.properties.name).toBe('EPSG:3857');
      geojson = ann.geojson(undefined, true);
      expect(geojson.crs.properties.name).toBe('EPSG:4326');
      ann.options('showLabel', false);
      geojson = ann.geojson(undefined, true);
      expect(geojson.properties.showLabel).toBe(false);
    });
    it('_labelPosition', function () {
      var ann = geo.annotation.annotation('test', {
        layer: layer,
        name: 'testAnnotation'
      });
      ann._coordinates = function () {
      };
      expect(ann._labelPosition()).toBe(undefined);
      ann._coordinates = function () {
        return [{x: 1, y: 2}];
      };
      expect(ann._labelPosition()).toEqual({x: 1, y: 2});
      ann._coordinates = function () {
        return [{x: 1, y: 2}, {x: 3, y: 5}, {x: 8, y: 11}];
      };
      var pos = ann._labelPosition();
      expect(pos.x).toBeCloseTo(4.447);
      expect(pos.y).toBeCloseTo(6.539);
    });
    it('_rotateHandlePosition', function () {
      var pos;
      var ann = geo.annotation.annotation('test', {layer: layer});
      expect(ann._rotateHandlePosition()).toBe(undefined);
      ann._coordinates = function () {
        return [{x: 1, y: 2}];
      };
      pos = ann._rotateHandlePosition();
      expect(pos.x).toBeCloseTo(1);
      expect(pos.y).toBeCloseTo(2);
      pos = ann._rotateHandlePosition(10);
      expect(pos.x).toBeCloseTo(97840, 0);
      expect(pos.y).toBeCloseTo(2);
      pos = ann._rotateHandlePosition(10, -Math.PI / 4);
      expect(pos.x).toBeCloseTo(69184, 0);
      expect(pos.y).toBeCloseTo(-69181, 0);
      ann._coordinates = function () {
        return [{x: 1, y: 2}, {x: 3, y: 5}, {x: 8, y: 11}];
      };
      pos = ann._rotateHandlePosition();
      expect(pos.x).toBeCloseTo(10.15, 2);
      expect(pos.y).toBeCloseTo(6.54, 2);
      pos = ann._rotateHandlePosition(10);
      expect(pos.x).toBeCloseTo(97850, 0);
      expect(pos.y).toBeCloseTo(6.54, 2);
      pos = ann._rotateHandlePosition(10, -Math.PI / 4);
      expect(pos.x).toBeCloseTo(69191, 0);
      expect(pos.y).toBeCloseTo(-69180, 0);
    });
    it('labelRecord', function () {
      var ann = geo.annotation.annotation('test', {
        layer: layer,
        name: 'testAnnotation'
      });
      ann._coordinates = function () {
      };
      expect(ann.labelRecord()).toBe(undefined);
      ann._coordinates = function () {
        return [{x: 1, y: 2}];
      };
      expect(ann.labelRecord().text).toBe('testAnnotation');
      expect(ann.labelRecord().position).toEqual({x: 1, y: 2});
      expect(ann.labelRecord().style).toBe(undefined);
      ann.options('labelStyle', {opacity: 0.8});
      expect(ann.labelRecord().style.opacity).toBe(0.8);
      ann.options('showLabel', false);
      expect(ann.labelRecord()).toBe(undefined);
    });
    it('styleForState', function () {
      var testStyles = {
        style: {strokeWidth: 1},
        createStyle: {strokeWidth: 2, fill: false},
        editStyle: {strokeWidth: 3, strokeOpacity: 0.5},
        highlightStyle: {strokeWidth: 4, fillOpacity: 0.5}
      };
      var ann = geo.annotation.annotation('test', testStyles);
      expect(ann.styleForState()).toEqual(testStyles.style);
      expect(ann.styleForState()).toEqual(ann.styleForState(geo.annotation.state.done));
      expect(ann.styleForState(geo.annotation.state.done)).toEqual(testStyles.style);
      // create extends edit, so it is special
      expect(ann.styleForState(geo.annotation.state.create)).toEqual({
        strokeWidth: 2, fill: false, strokeOpacity: 0.5
      });
      expect(ann.styleForState(geo.annotation.state.edit)).toEqual(testStyles.editStyle);
      expect(ann.styleForState(geo.annotation.state.highlight)).toEqual(testStyles.highlightStyle);
      ann.state(geo.annotation.state.create);
      expect(ann.styleForState()).toEqual(ann.styleForState(geo.annotation.state.create));
    });
    it('_addEditHandles', function () {
      var ann = geo.annotation.annotation('test', {layer: layer}),
          features = [], handles;
      ann._coordinates = function () {
        return [{x: 1, y: 2}, {x: 3, y: 5}, {x: 8, y: 11}];
      };
      expect(ann._addEditHandles(features, ann._coordinates(), {edge: false, center: false, rotate: false, resize: false})).toBe(undefined);
      // just vertices
      handles = features[geo.annotation._editHandleFeatureLevel].point;
      expect(handles.length).toBe(3);
      // all handles
      handles.splice(0, handles.length);
      ann._addEditHandles(features, ann._coordinates());
      expect(handles.length).toBe(9);
      expect(handles.map(function (h) { return h.type; })).toEqual([
        'vertex', 'edge', 'vertex', 'edge', 'vertex', 'edge', 'center', 'rotate', 'resize']);
      expect(handles.map(function (h) { return h.index; })).toEqual([
        0, 0, 1, 1, 2, 2, undefined, undefined, undefined]);
      expect(handles.map(function (h) { return h.selected; })).toEqual([
        undefined, undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined]);
      // add handles with an edge selected
      handles.splice(0, handles.length);
      ann._editHandle = {handle: {selected: true, type: 'edge', index: 1}};
      ann._addEditHandles(features, ann._coordinates());
      expect(handles.map(function (h) { return h.selected; })).toEqual([
        undefined, undefined, undefined, true, undefined, undefined,
        undefined, undefined, undefined]);
      // all handles but edges
      handles.splice(0, handles.length);
      ann._addEditHandles(features, ann._coordinates(), {edge: false});
      expect(handles.length).toBe(6);
      expect(handles.map(function (h) { return h.type; })).toEqual([
        'vertex', 'vertex', 'vertex', 'center', 'rotate', 'resize']);
      expect(handles.map(function (h) { return h.index; })).toEqual([
        0, 1, 2, undefined, undefined, undefined]);
      // vertices and center
      handles.splice(0, handles.length);
      ann._addEditHandles(features, ann._coordinates(), {edge: false, resize: false, rotate: false});
      expect(handles.length).toBe(4);
      expect(handles[3].type).toBe('center');
      // vertices and rotate
      handles.splice(0, handles.length);
      ann._addEditHandles(features, ann._coordinates(), {edge: false, center: false, resize: false});
      expect(handles.length).toBe(4);
      expect(handles[3].type).toBe('rotate');
      expect(ann._editHandle.amountRotated).toBe(0);
      // vertices and resize
      handles.splice(0, handles.length);
      ann._addEditHandles(features, ann._coordinates(), {edge: false, center: false, rotate: false});
      expect(handles.length).toBe(4);
      expect(handles[3].type).toBe('resize');
      // style can override
      ann.editHandleStyle('handles', {vertex: false, rotate: false});
      handles.splice(0, handles.length);
      ann._addEditHandles(features, ann._coordinates());
      expect(handles.length).toBe(5);
    });
    it('selectEditHandle', function () {
      var ann = geo.annotation.annotation('test', {layer: layer}),
          features = [], handles;
      ann._coordinates = function () {
        return [{x: 1, y: 2}, {x: 3, y: 5}, {x: 8, y: 11}];
      };
      ann._addEditHandles(features, ann._coordinates());
      handles = features[geo.annotation._editHandleFeatureLevel].point;
      expect(ann.selectEditHandle(handles[0], true)).toBe(ann);
      expect(ann._editHandle.handle).toBe(handles[0]);
      expect(handles[0].selected).toBe(true);
      expect(ann.selectEditHandle(handles[0], false)).toBe(ann);
      expect(handles[0].selected).toBe(false);
      expect(ann.selectEditHandle(handles[1], true)).toBe(ann);
      expect(ann.selectEditHandle(handles[2], true)).toBe(ann);
      expect(handles[1].selected).toBe(false);
      expect(handles[2].selected).toBe(true);
    });
    // processEditAction gets tested as well
    it('_processEditActionCenter', function () {
      var pts = [{x: 10, y: 20}, {x: 30, y: 50}, {x: 80, y: 110}],
          ann = createEditableAnnotation(map, layer, pts),
          handles = ann._handles,
          evt, check;
      expect(ann.selectEditHandle(handles[6], true)).toBe(ann);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 60});
      expect(ann.processEditAction(evt)).toBe(false);
      expect(ann._processEditActionCenter(evt)).toBe(false);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 63});
      expect(ann.processEditAction(evt)).toBe(true);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 65});
      expect(ann._processEditActionCenter(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[1].x).toBeCloseTo(30);
      expect(check[1].y).toBeCloseTo(55);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 42, y: 68});
      expect(ann._processEditActionCenter(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[1].x).toBeCloseTo(32);
      expect(check[1].y).toBeCloseTo(58);
    });
    it('_processEditActionRotate', function () {
      var pts = [{x: 10, y: 20}, {x: 30, y: 50}, {x: 80, y: 110}],
          ann = createEditableAnnotation(map, layer, pts),
          handles = ann._handles,
          evt, check;
      expect(ann.selectEditHandle(handles[7], true)).toBe(ann);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 60});
      expect(ann.processEditAction(evt)).toBe(false);
      expect(ann._processEditActionRotate(evt)).toBe(false);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 63});
      expect(ann.processEditAction(evt)).toBe(true);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 65});
      expect(ann._processEditActionRotate(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[1].x).toBeCloseTo(30.66);
      expect(check[1].y).toBeCloseTo(49.41);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 42, y: 68});
      expect(ann._processEditActionRotate(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[1].x).toBeCloseTo(30.76);
      expect(check[1].y).toBeCloseTo(49.32);
    });
    it('_processEditActionResize', function () {
      var pts = [{x: 10, y: 20}, {x: 30, y: 50}, {x: 80, y: 110}],
          ann = createEditableAnnotation(map, layer, pts),
          handles = ann._handles,
          evt, check;
      expect(ann.selectEditHandle(handles[8], true)).toBe(ann);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 60});
      expect(ann.processEditAction(evt)).toBe(false);
      expect(ann._processEditActionResize(evt)).toBe(false);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 63});
      expect(ann.processEditAction(evt)).toBe(true);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 65});
      expect(ann._processEditActionResize(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[1].x).toBeCloseTo(29.09);
      expect(check[1].y).toBeCloseTo(49.03);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 42, y: 68});
      expect(ann._processEditActionResize(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[1].x).toBeCloseTo(28.19);
      expect(check[1].y).toBeCloseTo(48.07);
    });
    it('_processEditActionEdge', function () {
      var pts = [{x: 10, y: 20}, {x: 30, y: 50}, {x: 80, y: 110}],
          ann = createEditableAnnotation(map, layer, pts),
          handles = ann._handles,
          evt;
      expect(ann.selectEditHandle(handles[3], true)).toBe(ann);
      expect(ann._editHandle.handle.type).toBe('edge');
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 60});
      expect(ann._processEditActionEdge(evt)).toBe(true);
      expect(ann._coordinates().length).toBe(4);
      expect(ann._editHandle.handle.type).toBe('vertex');
      ann = createEditableAnnotation(map, layer, pts);
      handles = ann._handles;
      expect(ann.selectEditHandle(handles[3], true)).toBe(ann);
      expect(ann.processEditAction(evt)).toBe(true);
    });
    it('_processEditActionVertex', function () {
      var pts = [{x: 10, y: 20}, {x: 30, y: 50}, {x: 32, y: 50}, {x: 80, y: 110}],
          ann = createEditableAnnotation(map, layer, pts),
          handles = ann._handles,
          evt, check;
      expect(ann.selectEditHandle(handles[2], true)).toBe(ann);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 60});
      expect(ann.processEditAction(evt)).toBe(false);
      expect(ann._processEditActionVertex(evt)).toBe(false);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 41, y: 63});
      expect(ann.processEditAction(evt)).toBe(true);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 41, y: 60});
      expect(ann._processEditActionVertex(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[1].x).toBeCloseTo(31);
      expect(check[1].y).toBeCloseTo(50);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 20, y: 31});
      expect(ann._processEditActionVertex(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check.length).toBe(4);
      expect(check[1].x).toBeCloseTo(10);
      expect(check[1].y).toBeCloseTo(20);
      evt.event = geo.event.actionup;
      expect(ann._processEditActionVertex(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check.length).toBe(3);
      // reset to where we started
      ann = createEditableAnnotation(map, layer, pts);
      handles = ann._handles;
      expect(ann.selectEditHandle(handles[6], true)).toBe(ann);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: -30, y: -29});
      expect(ann._processEditActionVertex(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[3].x).toBeCloseTo(10);
      expect(check[3].y).toBeCloseTo(20);
      expect(ann._processEditActionVertex(evt, false)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[3].x).toBeCloseTo(10);
      expect(check[3].y).toBeCloseTo(21);
      expect(ann._processEditActionVertex(evt, true)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[3].x).toBeCloseTo(10);
      expect(check[3].y).toBeCloseTo(20);
      evt.event = geo.event.actionup;
      expect(ann._processEditActionVertex(evt, true)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check.length).toBe(3);
    });
    it('defaultEditHandleStyle functions', function () {
      var pts = [{x: 10, y: 20}, {x: 30, y: 50}, {x: 80, y: 110}],
          ann = createEditableAnnotation(map, layer, pts),
          handles = ann._handles;
      ann.selectEditHandle(handles[0], true);
      expect(handles[0].style.fillColor(handles[0])).not.toEqual(handles[1].style.fillColor(handles[1]));
      expect(handles[2].style.fillColor(handles[2])).toEqual(handles[1].style.fillColor(handles[1]));
      expect(handles[0].style.fillOpacity(handles[0])).not.toEqual(handles[1].style.fillOpacity(handles[1]));
      expect(handles[0].style.radius(handles[0])).not.toEqual(handles[1].style.radius(handles[1]));
      expect(handles[0].style.strokeWidth(handles[0])).not.toEqual(handles[1].style.strokeWidth(handles[1]));
    });
  });

  describe('geo.annotation.rectangleAnnotation', function () {
    var corners = [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: 1}],
        corners2 = [{x: 2, y: 0}, {x: 3, y: 0}, {x: 3, y: 1}, {x: 2, y: 1}];
    it('create', function () {
      var ann = geo.annotation.rectangleAnnotation();
      expect(ann instanceof geo.annotation.rectangleAnnotation);
      expect(ann.type()).toBe('rectangle');
    });
    it('features', function () {
      var map = createMap();
      var layer = map.createLayer('annotation', {
        annotations: ['rectangle']
      });
      var ann = geo.annotation.rectangleAnnotation({layer: layer, corners: corners});
      var features = ann.features();
      expect(features.length).toBe(1);
      expect(features[0].polygon.polygon).toEqual(corners);
      expect(features[0].polygon.style.fillOpacity).toBe(0.25);
      expect(features[0].polygon.style.fillColor.g).toBe(1);
      expect(features[0].polygon.style.polygon({polygon: 'a'})).toBe('a');
      ann.state(geo.annotation.state.edit);
      features = ann.features();
      expect(features.length).toBe(4);
      ann.state(geo.annotation.state.create);
      features = ann.features();
      expect(features.length).toBe(1);
      expect(features[0].polygon.polygon).toEqual(corners);
      expect(features[0].polygon.style.fillOpacity).toBe(0.25);
      expect(features[0].polygon.style.fillColor.g).toBe(0.3);
      expect(features[0].polygon.style.polygon({polygon: 'a'})).toBe('a');
      ann.options('corners', []);
      features = ann.features();
      expect(features.length).toBe(0);
    });
    it('actions', function () {
      var ann = geo.annotation.rectangleAnnotation({corners: corners});
      var actions = ann.actions();
      expect(actions.length).toBe(0);
      actions = ann.actions(geo.annotation.state.create);
      expect(actions.length).toBe(1);
      expect(actions[0].name).toEqual('rectangle create');
      ann.state(geo.annotation.state.create);
      actions = ann.actions();
      expect(actions.length).toBe(1);
      expect(actions[0].name).toEqual('rectangle create');
      actions = ann.actions(geo.annotation.state.done);
      expect(actions.length).toBe(0);
    });
    it('processAction', function () {
      var map = createMap();
      var layer = map.createLayer('annotation', {
        annotations: ['rectangle']
      });
      var ann = geo.annotation.rectangleAnnotation({layer: layer, corners: corners});
      expect(ann.processAction({state: null})).toBe(undefined);
      ann.state(geo.annotation.state.create);
      var evt = {
        event: geo.event.actionmove,
        state: {action: geo.geo_action.annotation_rectangle},
        lowerLeft: {x: 10, y: 65},
        upperRight: {x: 90, y: 5}
      };
      expect(ann.processAction(evt)).not.toBe('done');
      expect(ann.state()).toBe(geo.annotation.state.create);
      evt.event = geo.event.actionselection;
      expect(ann.processAction(evt)).toBe('done');
      expect(ann.state()).toBe(geo.annotation.state.done);
      var coor = ann.coordinates();
      expect(coor[0].x).toBeCloseTo(-27.246);
      expect(coor[0].y).toBeCloseTo(10.055);
      expect(coor[2].x).toBeCloseTo(-20.215);
      expect(coor[2].y).toBeCloseTo(15.199);
      // a zero-area rectangle should be asked to be removed.
      ann = geo.annotation.rectangleAnnotation({layer: layer, corners: corners});
      ann.state(geo.annotation.state.create);
      evt = {
        event: geo.event.actionselection,
        state: {action: geo.geo_action.annotation_rectangle},
        lowerLeft: {x: 10, y: 65},
        upperRight: {x: 90, y: 65}
      };
      expect(ann.processAction(evt)).toBe('remove');
    });
    it('_coordinates', function () {
      var ann = geo.annotation.rectangleAnnotation({corners: corners});
      expect(ann._coordinates()).toEqual(corners);
      ann._coordinates(corners2);
      expect(ann._coordinates()).toEqual(corners2);
    });
    it('_geojsonCoordinates', function () {
      var ann = geo.annotation.rectangleAnnotation();
      expect(ann._geojsonCoordinates()).toBe(undefined);
      ann._coordinates(corners);
      var coor = ann._geojsonCoordinates();
      expect(coor[0].length).toBe(5);
    });
    it('_geojsonGeometryType', function () {
      var ann = geo.annotation.rectangleAnnotation();
      expect(ann._geojsonGeometryType()).toBe('Polygon');
    });
    it('geojson', function () {
      var ann = geo.annotation.rectangleAnnotation({corners: corners});
      var geojson = ann.geojson();
      expect(geojson.type).toBe('Feature');
      expect(geojson.geometry.type).toBe('Polygon');
      expect(geojson.geometry.coordinates.length).toBe(1);
      expect(geojson.geometry.coordinates[0].length).toBe(5);
      expect(geojson.geometry.coordinates[0][2][1]).toBeCloseTo(1);
    });
    it('mouseMove', function () {
      var map = createMap();
      var layer = map.createLayer('annotation', {
        annotations: ['rectangle']
      });
      var ann = geo.annotation.rectangleAnnotation({layer: layer, corners: corners});
      expect(ann.mouseMove({mapgcs: {x: 6, y: 4}})).toBe(undefined);
      expect(ann.options('corners')).toEqual(corners);
      ann.state(geo.annotation.state.create);
      expect(ann.mouseMove({mapgcs: {x: 6, y: 4}})).toBe(true);
      expect(ann.options('corners')).not.toEqual(corners);
    });
    it('mouseClick', function () {
      var map = createMap();
      var layer = map.createLayer('annotation', {
        annotations: ['rectangle']
      });
      var ann = geo.annotation.rectangleAnnotation({layer: layer});
      var time = new Date().getTime();
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: {x: 10, y: 20},
        mapgcs: map.displayToGcs({x: 10, y: 20}, null)
      })).toBe(undefined);
      ann.state(geo.annotation.state.create);
      expect(ann.mouseClick({
        buttonsDown: {middle: true},
        time: time,
        map: corners[0],
        mapgcs: map.displayToGcs(corners[0], null)
      })).toBe(undefined);
      expect(ann.mouseClick({
        buttonsDown: {right: true},
        time: time,
        map: corners[0],
        mapgcs: map.displayToGcs(corners[0], null)
      })).toBe(undefined);
      expect(ann.options('corners').length).toBe(0);
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: corners[0],
        mapgcs: map.displayToGcs(corners[0], null)
      })).toBe(true);
      expect(ann.options('corners').length).toBe(4);
      ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: corners[2],
        mapgcs: map.displayToGcs(corners[2], null)
      });
      expect(ann.options('corners').length).toBe(4);
      expect(ann.state()).toBe(geo.annotation.state.done);
      // a zero-area rectangle should be asked to be removed.
      ann = geo.annotation.rectangleAnnotation({layer: layer});
      ann.state(geo.annotation.state.create);
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: corners[0],
        mapgcs: map.displayToGcs(corners[0], null)
      })).toBe(true);
      expect(ann.options('corners').length).toBe(4);
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: corners[1],
        mapgcs: map.displayToGcs(corners[1], null)
      })).toBe('remove');
    });
    it('processEditAction', function () {
      var pts = [{x: 10, y: 15}, {x: 40, y: 15}, {x: 40, y: 25}, {x: 10, y: 25}],
          pts2 = [{x: 20, y: 15}, {x: 60, y: 45}, {x: 75, y: 65}, {x: 5, y: 35}],
          pts3 = [{x: 20, y: 15}, {x: 20, y: 15}, {x: 20, y: 15}, {x: 20, y: 15}],
          pts4 = [{x: 20, y: 15}, {x: 20, y: 15}, {x: 40, y: 25}, {x: 40, y: 25}],
          pts5 = [{x: 20, y: 15}, {x: 40, y: 25}, {x: 40, y: 25}, {x: 20, y: 15}],
          map = createMap(),
          layer = map.createLayer('annotation', {annotations: ['rectangle']}),
          ann = geo.annotation.rectangleAnnotation({
            layer: layer,
            corners: map.displayToGcs(pts, null),
            state: geo.annotation.state.edit
          }),
          features = ann.features(),
          handles = features[geo.annotation._editHandleFeatureLevel].point,
          evt, check;
      // select a vertex
      ann.selectEditHandle(handles[2], true);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 42, y: 65});
      expect(ann.processEditAction(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[0].x).toBeCloseTo(10);
      expect(check[0].y).toBeCloseTo(20);
      expect(check[1].x).toBeCloseTo(42);
      expect(check[1].y).toBeCloseTo(20);
      expect(check[2].x).toBeCloseTo(42);
      expect(check[2].y).toBeCloseTo(25);
      expect(check[3].x).toBeCloseTo(10);
      expect(check[3].y).toBeCloseTo(25);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 60});
      expect(ann.processEditAction(evt)).toBe(true);
      // select an edge
      ann.selectEditHandle(handles[3], true);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 42, y: 65});
      expect(ann.processEditAction(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[0].x).toBeCloseTo(10);
      expect(check[0].y).toBeCloseTo(15);
      expect(check[1].x).toBeCloseTo(42);
      expect(check[1].y).toBeCloseTo(15);
      expect(check[2].x).toBeCloseTo(42);
      expect(check[2].y).toBeCloseTo(25);
      expect(check[3].x).toBeCloseTo(10);
      expect(check[3].y).toBeCloseTo(25);
      // test with a rotated rectangle
      ann._coordinates(map.displayToGcs(pts2, null));
      // select a vertex
      ann.selectEditHandle(handles[2], true);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 46, y: 68});
      expect(ann.processEditAction(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[0].x).toBeCloseTo(26);
      expect(check[0].y).toBeCloseTo(23);
      expect(check[1].x).toBeCloseTo(66);
      expect(check[1].y).toBeCloseTo(53);
      expect(check[2].x).toBeCloseTo(82.97);
      expect(check[2].y).toBeCloseTo(68.41);
      expect(check[3].x).toBeCloseTo(5);
      expect(check[3].y).toBeCloseTo(35);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 60});
      expect(ann.processEditAction(evt)).toBe(true);
      // select an edge
      ann.selectEditHandle(handles[3], true);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 46, y: 68});
      expect(ann.processEditAction(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[0].x).toBeCloseTo(20);
      expect(check[0].y).toBeCloseTo(15);
      expect(check[1].x).toBeCloseTo(67.97);
      expect(check[1].y).toBeCloseTo(48.41);
      expect(check[2].x).toBeCloseTo(82.97);
      expect(check[2].y).toBeCloseTo(68.41);
      expect(check[3].x).toBeCloseTo(5);
      expect(check[3].y).toBeCloseTo(35);
      // test that super class method is called
      ann.selectEditHandle(handles[8], true);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 63});
      expect(ann.processEditAction(evt)).toBe(true);
      // test degenerate rectangles
      ann._coordinates(map.displayToGcs(pts3, null));
      ann.selectEditHandle(handles[2], true);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 46, y: 68});
      expect(ann.processEditAction(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[0].x).toBeCloseTo(20);
      expect(check[0].y).toBeCloseTo(23);
      expect(check[1].x).toBeCloseTo(26);
      expect(check[1].y).toBeCloseTo(23);
      expect(check[2].x).toBeCloseTo(26);
      expect(check[2].y).toBeCloseTo(15);
      ann._coordinates(map.displayToGcs(pts4, null));
      ann.selectEditHandle(handles[2], true);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 46, y: 68});
      expect(ann.processEditAction(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[0].x).toBeCloseTo(28);
      expect(check[0].y).toBeCloseTo(19);
      expect(check[1].x).toBeCloseTo(26);
      expect(check[1].y).toBeCloseTo(23);
      expect(check[2].x).toBeCloseTo(38);
      expect(check[2].y).toBeCloseTo(29);
      ann._coordinates(map.displayToGcs(pts5, null));
      ann.selectEditHandle(handles[2], true);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 46, y: 68});
      expect(ann.processEditAction(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[0].x).toBeCloseTo(18);
      expect(check[0].y).toBeCloseTo(19);
      expect(check[1].x).toBeCloseTo(46);
      expect(check[1].y).toBeCloseTo(33);
      expect(check[2].x).toBeCloseTo(48);
      expect(check[2].y).toBeCloseTo(29);
    });
  });

  describe('geo.annotation.polygonAnnotation', function () {
    var vertices = [{x: 30, y: 0}, {x: 50, y: 0}, {x: 40, y: 20}, {x: 30, y: 10}];
    var vertices2 = [{x: 30, y: 10}, {x: 50, y: 10}, {x: 40, y: 30}];
    it('create', function () {
      var ann = geo.annotation.polygonAnnotation();
      expect(ann instanceof geo.annotation.polygonAnnotation);
      expect(ann.type()).toBe('polygon');
    });
    it('features', function () {
      var map = createMap();
      var layer = map.createLayer('annotation', {
        annotations: ['polygon']
      });
      var ann = geo.annotation.polygonAnnotation({layer: layer, vertices: vertices});
      var features = ann.features();
      expect(features.length).toBe(1);
      expect(features[0].polygon.polygon).toEqual(vertices);
      expect(features[0].polygon.style.fillOpacity).toBe(0.25);
      expect(features[0].polygon.style.fillColor.g).toBe(1);
      expect(features[0].polygon.style.polygon({polygon: 'a'})).toBe('a');
      ann.state(geo.annotation.state.edit);
      features = ann.features();
      expect(features.length).toBe(4);
      ann.state(geo.annotation.state.create);
      features = ann.features();
      expect(features.length).toBe(3);
      expect(features[0]).toBe(undefined);
      expect(features[1].polygon.polygon).toEqual(vertices);
      expect(features[1].polygon.style.fillOpacity).toBe(0.25);
      expect(features[1].polygon.style.fillColor.g).toBe(0.3);
      expect(features[1].polygon.style.polygon({polygon: 'a'})).toBe('a');
      expect(features[2].line.line).toEqual(vertices);
      expect(features[2].line.style.fillOpacity).toBe(0.25);
      expect(features[2].line.style.fillColor.g).toBe(0.3);
      ann.options('vertices', [{x: 3, y: 0}, {x: 5, y: 0}]);
      features = ann.features();
      expect(features.length).toBe(3);
      expect(features[0]).toBe(undefined);
      expect(features[1]).toBe(undefined);
      expect(features[2].line.line.length).toBe(2);
    });
    it('_coordinates', function () {
      var ann = geo.annotation.polygonAnnotation({vertices: vertices});
      expect(ann._coordinates()).toEqual(vertices);
      ann._coordinates(vertices2);
      expect(ann._coordinates()).toEqual(vertices2);
    });
    it('_geojsonCoordinates', function () {
      var ann = geo.annotation.polygonAnnotation();
      expect(ann._geojsonCoordinates()).toBe(undefined);
      ann._coordinates(vertices2);
      var coor = ann._geojsonCoordinates();
      expect(coor[0].length).toBe(4);
    });
    it('_geojsonGeometryType', function () {
      var ann = geo.annotation.polygonAnnotation();
      expect(ann._geojsonGeometryType()).toBe('Polygon');
    });
    it('geojson', function () {
      var ann = geo.annotation.polygonAnnotation({vertices: vertices2});
      var geojson = ann.geojson();
      expect(geojson.type).toBe('Feature');
      expect(geojson.geometry.type).toBe('Polygon');
      expect(geojson.geometry.coordinates.length).toBe(1);
      expect(geojson.geometry.coordinates[0].length).toBe(4);
      expect(geojson.geometry.coordinates[0][2][1]).toBeCloseTo(30);
    });
    it('mouseMove', function () {
      var ann = geo.annotation.polygonAnnotation({vertices: vertices});
      expect(ann.mouseMove({mapgcs: {x: 6, y: 4}})).toBe(undefined);
      expect(ann.options('vertices')).toEqual(vertices);
      ann.state(geo.annotation.state.create);
      expect(ann.mouseMove({mapgcs: {x: 6, y: 4}})).toBe(true);
      expect(ann.options('vertices')).not.toEqual(vertices);
    });
    it('mouseClick', function () {
      var map = createMap();
      var layer = map.createLayer('annotation', {
        annotations: ['polygon']
      });
      var ann = geo.annotation.polygonAnnotation({layer: layer});
      var time = new Date().getTime();
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: {x: 10, y: 20},
        mapgcs: map.displayToGcs({x: 10, y: 20}, null)
      })).toBe(undefined);
      ann.state(geo.annotation.state.create);
      expect(ann.mouseClick({
        buttonsDown: {middle: true},
        time: time,
        map: vertices[0],
        mapgcs: map.displayToGcs(vertices[0], null)
      })).toBe(undefined);
      expect(ann.options('vertices').length).toBe(0);
      expect(ann.mouseClick({
        buttonsDown: {right: true},
        time: time,
        map: vertices[0],
        mapgcs: map.displayToGcs(vertices[0], null)
      })).toBe(undefined);
      expect(ann.options('vertices').length).toBe(0);
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: vertices[0],
        mapgcs: map.displayToGcs(vertices[0], null)
      })).toBe(true);
      expect(ann.options('vertices').length).toBe(2);
      ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: vertices[1],
        mapgcs: map.displayToGcs(vertices[1], null)
      });
      expect(ann.options('vertices').length).toBe(3);
      ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: vertices[2],
        mapgcs: map.displayToGcs(vertices[2], null)
      });
      expect(ann.options('vertices').length).toBe(4);
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: {x: vertices[0].x + 1, y: vertices[0].y},
        mapgcs: map.displayToGcs({x: vertices[0].x + 1, y: vertices[0].y}, null)
      })).toBe('done');
      expect(ann.options('vertices').length).toBe(3);
      expect(ann.state()).toBe(geo.annotation.state.done);
    });
  });

  describe('geo.annotation.pointAnnotation', function () {
    var point = {x: 30, y: 25};
    var point2 = {x: 50, y: 35};

    it('create', function () {
      var ann = geo.annotation.pointAnnotation();
      expect(ann instanceof geo.annotation.pointAnnotation);
      expect(ann.type()).toBe('point');
    });
    it('features', function () {
      var ann = geo.annotation.pointAnnotation({position: point});
      var features = ann.features();
      expect(features.length).toBe(1);
      expect(features[0].point.x).toEqual(point.x);
      expect(features[0].point.style.radius).toBe(10);
      ann.state(geo.annotation.state.edit);
      features = ann.features();
      expect(features.length).toBe(4);
      ann.state(geo.annotation.state.create);
      features = ann.features();
      expect(features.length).toBe(0);
    });
    it('_coordinates', function () {
      var ann = geo.annotation.pointAnnotation({position: point});
      expect(ann._coordinates()).toEqual([point]);
      ann._coordinates([point2]);
      expect(ann._coordinates()).toEqual([point2]);
      ann.state(geo.annotation.state.create);
      expect(ann._coordinates()).toEqual([]);
    });
    it('_geojsonStyles', function () {
      var ann = geo.annotation.pointAnnotation();
      expect(ann._geojsonStyles().length).toBe(9);
    });
    it('_geojsonCoordinates', function () {
      var ann = geo.annotation.pointAnnotation();
      expect(ann._geojsonCoordinates()).toBe(undefined);
      ann._coordinates([point]);
      var coor = ann._geojsonCoordinates();
      expect(coor.length).toBe(2);
    });
    it('_geojsonGeometryType', function () {
      var ann = geo.annotation.pointAnnotation();
      expect(ann._geojsonGeometryType()).toBe('Point');
    });
    it('geojson', function () {
      var ann = geo.annotation.pointAnnotation({position: point});
      var geojson = ann.geojson();
      expect(geojson.type).toBe('Feature');
      expect(geojson.geometry.type).toBe('Point');
      expect(geojson.geometry.coordinates.length).toBe(2);
      expect(geojson.geometry.coordinates[1]).toBeCloseTo(25);
    });
    it('mouseClick', function () {
      var ann = geo.annotation.pointAnnotation();
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        map: {x: 10, y: 20},
        mapgcs: {x: 10, y: 20}
      })).toBe(undefined);
      expect(ann.options('position')).toBe(undefined);
      ann.state(geo.annotation.state.create);
      expect(ann.mouseClick({
        buttonsDown: {right: true},
        map: {x: 10, y: 20},
        mapgcs: {x: 10, y: 20}
      })).toBe(undefined);
      expect(ann.options('position')).toBe(undefined);
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        map: {x: 10, y: 20},
        mapgcs: {x: 10, y: 20}
      })).toBe('done');
      expect(ann.options('position')).toEqual({x: 10, y: 20});
      expect(ann.state()).toBe(geo.annotation.state.done);
    });
    it('scaled radius', function () {
      var map = createMap();
      var layer = map.createLayer('annotation', {
        annotations: ['point']
      });
      var ann = geo.annotation.pointAnnotation({
        position: point, layer: layer, style: {scaled: true}});
      var features = ann.features();
      expect(features.length).toBe(1);
      expect(features[0].point.x).toEqual(point.x);
      expect(features[0].point.style.radius()).toBe(10);
      map.zoom(3);
      features = ann.features();
      expect(features[0].point.style.radius()).toBe(5);
      ann.options().style.radius = function () {
        return map.zoom() > 6.5 ? 4 : 10;
      };
      map.zoom(6);
      features = ann.features();
      expect(features[0].point.style.radius()).toBe(40);
      map.zoom(7);
      features = ann.features();
      expect(features[0].point.style.radius()).toBe(32);
    });
  });

  describe('geo.annotation.lineAnnotation', function () {
    var vertices = [{x: 30, y: 0}, {x: 50, y: 0}, {x: 40, y: 20}, {x: 30, y: 10}];
    var vertices2 = [{x: 30, y: 10}, {x: 50, y: 10}, {x: 40, y: 30}];
    it('create', function () {
      var ann = geo.annotation.lineAnnotation();
      expect(ann instanceof geo.annotation.lineAnnotation);
      expect(ann.type()).toBe('line');
    });
    it('features', function () {
      var map = createMap();
      var layer = map.createLayer('annotation', {
        annotations: ['line']
      });
      var ann = geo.annotation.lineAnnotation({layer: layer, vertices: vertices});
      var features = ann.features();
      expect(features.length).toBe(1);
      expect(features[0].line.line).toEqual(vertices);
      expect(features[0].line.style.strokeOpacity).toBe(1);
      expect(features[0].line.style.strokeColor.b).toBe(0);
      expect(features[0].line.style.line().length).toBe(vertices.length);
      expect(features[0].line.style.position(0, 1)).toEqual(vertices[1]);
      ann.state(geo.annotation.state.edit);
      features = ann.features();
      expect(features.length).toBe(4);
      ann.state(geo.annotation.state.create);
      features = ann.features();
      expect(features.length).toBe(1);
      expect(features[0].line.line).toEqual(vertices);
      expect(features[0].line.style.strokeOpacity).toBe(1);
      expect(features[0].line.style.strokeColor.b).toBe(1);
      expect(features[0].line.style.line().length).toBe(vertices.length);
      expect(features[0].line.style.position(0, 1)).toEqual(vertices[1]);
      ann.options('vertices', [{x: 3, y: 0}, {x: 5, y: 0}]);
      features = ann.features();
      expect(features.length).toBe(1);
      expect(features[0].line.line.length).toBe(2);
    });
    it('_coordinates', function () {
      var ann = geo.annotation.lineAnnotation({vertices: vertices});
      expect(ann._coordinates()).toEqual(vertices);
      ann._coordinates(vertices2);
      expect(ann._coordinates()).toEqual(vertices2);
    });
    it('_geojsonCoordinates', function () {
      var ann = geo.annotation.lineAnnotation();
      expect(ann._geojsonCoordinates()).toBe(undefined);
      ann._coordinates(vertices2);
      var coor = ann._geojsonCoordinates();
      expect(coor.length).toBe(3);
    });
    it('_geojsonGeometryType', function () {
      var ann = geo.annotation.lineAnnotation();
      expect(ann._geojsonGeometryType()).toBe('LineString');
    });
    it('geojson', function () {
      var ann = geo.annotation.lineAnnotation({vertices: vertices2});
      var geojson = ann.geojson();
      expect(geojson.type).toBe('Feature');
      expect(geojson.geometry.type).toBe('LineString');
      expect(geojson.geometry.coordinates.length).toBe(3);
      expect(geojson.geometry.coordinates[2][1]).toBeCloseTo(30);
    });
    it('mouseMove', function () {
      var ann = geo.annotation.lineAnnotation({vertices: vertices});
      expect(ann.mouseMove({mapgcs: {x: 6, y: 4}})).toBe(undefined);
      expect(ann.options('vertices')).toEqual(vertices);
      ann.state(geo.annotation.state.create);
      expect(ann.mouseMove({mapgcs: {x: 6, y: 4}})).toBe(true);
      expect(ann.options('vertices')).not.toEqual(vertices);
    });
    it('mouseClick', function () {
      var map = createMap();
      var layer = map.createLayer('annotation', {
        annotations: ['line']
      });
      var ann = geo.annotation.lineAnnotation({layer: layer});
      var time = new Date().getTime();
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: {x: 10, y: 20},
        mapgcs: map.displayToGcs({x: 10, y: 20}, null)
      })).toBe(undefined);
      ann.state(geo.annotation.state.create);
      expect(ann.mouseClick({
        buttonsDown: {middle: true},
        time: time,
        map: vertices[0],
        mapgcs: map.displayToGcs(vertices[0], null)
      })).toBe(undefined);
      expect(ann.options('vertices').length).toBe(0);
      expect(ann.mouseClick({
        buttonsDown: {right: true},
        time: time,
        map: vertices[0],
        mapgcs: map.displayToGcs(vertices[0], null)
      })).toBe(undefined);
      expect(ann.options('vertices').length).toBe(0);
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: vertices[0],
        mapgcs: map.displayToGcs(vertices[0], null)
      })).toBe(true);
      expect(ann.options('vertices').length).toBe(2);
      ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: vertices[1],
        mapgcs: map.displayToGcs(vertices[1], null)
      });
      expect(ann.options('vertices').length).toBe(3);
      ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: vertices[2],
        mapgcs: map.displayToGcs(vertices[2], null)
      });
      expect(ann.options('vertices').length).toBe(4);
      expect(ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: {x: vertices[0].x + 1, y: vertices[0].y},
        mapgcs: map.displayToGcs({x: vertices[0].x + 1, y: vertices[0].y}, null)
      })).toBe('done');
      expect(ann.options('vertices').length).toBe(3);
      expect(ann.state()).toBe(geo.annotation.state.done);

      // test double click
      ann.state(geo.annotation.state.create);
      ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: vertices[2],
        mapgcs: map.displayToGcs(vertices[2], null)
      });
      expect(ann.options('vertices').length).toBe(4);
      ann.mouseClick({
        buttonsDown: {left: true},
        time: time,
        map: vertices[2],
        mapgcs: map.displayToGcs(vertices[2], null)
      });
      expect(ann.options('vertices').length).toBe(3);
      expect(ann.state()).toBe(geo.annotation.state.done);

      // test right-click with only one fixed vertex
      ann.state(geo.annotation.state.create);
      ann.options('vertices', [{x: 3, y: 0}, {x: 5, y: 0}]);
      expect(ann.mouseClick({
        buttonsDown: {right: true},
        time: time,
        map: vertices[0],
        mapgcs: map.displayToGcs(vertices[0], null)
      })).toBe('remove');
    });
    it('actions', function () {
      var ann = geo.annotation.lineAnnotation({vertices: vertices});
      var actions = ann.actions();
      expect(actions.length).toBe(0);
      actions = ann.actions(geo.annotation.state.create);
      expect(actions.length).toBe(2);
      expect(actions[0].name).toEqual('line create');
      ann.state(geo.annotation.state.create);
      actions = ann.actions();
      expect(actions.length).toBe(2);
      expect(actions[0].name).toEqual('line create');
      actions = ann.actions(geo.annotation.state.done);
      expect(actions.length).toBe(0);
    });
    it('processAction', function () {
      var map = createMap();
      var layer = map.createLayer('annotation', {
        annotations: ['line']
      });
      var ann = geo.annotation.lineAnnotation({layer: layer, vertices: vertices});
      expect(ann.processAction({state: null})).toBe(undefined);
      ann.options('vertices', []);
      ann.state(geo.annotation.state.create);
      var evt = {
        state: {action: geo.geo_action.annotation_line},
        mouse: {
          map: vertices[0],
          mapgcs: map.displayToGcs(vertices[0], null)
        }
      };
      expect(ann.processAction(evt)).toBe(true);
      expect(ann.options('vertices').length).toBe(2);
      evt = {
        state: {action: geo.geo_action.annotation_line},
        mouse: {
          map: vertices[1],
          mapgcs: map.displayToGcs(vertices[1], null)
        }
      };
      expect(ann.processAction(evt)).toBe(true);
      expect(ann.options('vertices').length).toBe(3);
      expect(ann.processAction(evt)).not.toBe(true);
      expect(ann.options('vertices').length).toBe(3);
      // add a point that will be colinear with the next one
      var halfway = {
        x: (vertices[1].x + vertices[2].x) / 2,
        y: (vertices[1].y + vertices[2].y) / 2
      };
      evt = {
        state: {action: geo.geo_action.annotation_line},
        mouse: {
          map: halfway,
          mapgcs: map.displayToGcs(halfway, null)
        }
      };
      expect(ann.processAction(evt)).toBe(true);
      expect(ann.options('vertices').length).toBe(4);
      evt = {
        state: {action: geo.geo_action.annotation_line},
        mouse: {
          map: vertices[2],
          mapgcs: map.displayToGcs(vertices[2], null)
        }
      };
      // a new colinear point will replace the previous point, so we still have
      // the same point count
      expect(ann.processAction(evt)).toBe(true);
      expect(ann.options('vertices').length).toBe(4);
    });
    it('processEditAction', function () {
      var map = createMap(),
          layer = map.createLayer('annotation', {annotations: ['line']}),
          ann = geo.annotation.lineAnnotation({
            layer: layer,
            vertices: map.displayToGcs(vertices, null),
            state: geo.annotation.state.edit
          }),
          features = ann.features(),
          handles = features[geo.annotation._editHandleFeatureLevel].point,
          evt, check;
      // select a vertex and close the line
      ann.selectEditHandle(handles[6], true);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 51});
      evt.event = geo.event.actionup;
      expect(ann.processEditAction(evt)).toBe(true);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check.length).toBe(3);
      expect(ann.style('closed')).toBe(true);
      // test that super class method is called
      features = ann.features();
      handles = features[geo.annotation._editHandleFeatureLevel].point;
      ann.selectEditHandle(handles[6], true);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 63});
      expect(ann.processEditAction(evt)).toBe(true);
    });
    it('mouseClickEdit', function () {
      var map = createMap(),
          layer = map.createLayer('annotation', {annotations: ['line']}),
          ann = geo.annotation.lineAnnotation({
            layer: layer,
            vertices: map.displayToGcs(vertices, null),
            state: geo.annotation.state.edit,
            style: {closed: true}
          }),
          features = ann.features(),
          handles = features[geo.annotation._editHandleFeatureLevel].point,
          evt, check;
      // select a vertex -- this will do nothing
      ann.selectEditHandle(handles[2], true);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 60});
      evt.buttonsDown.left = true;
      expect(ann.mouseClickEdit(evt)).toBe(undefined);
      expect(ann.mouseClickEdit(evt)).toBe(undefined);
      // now use
      ann.selectEditHandle(handles[1], true);
      evt = editHandleEvent(map, {x: 40, y: 60}, {x: 40, y: 60});
      // with no button down specified, the event does nothing
      expect(ann.mouseClickEdit(evt)).toBe(undefined);
      evt.buttonsDown.left = true;
      // the first click does nothing
      expect(ann.mouseClickEdit(evt)).toBe(undefined);
      evt.time += 20000;
      // the second click does nothing if there is too much delay
      expect(ann.mouseClickEdit(evt)).toBe(undefined);
      // but will split if there is less delay
      expect(ann.mouseClickEdit(evt)).toBe(true);
      expect(ann.style('closed')).toBe(false);
      check = map.gcsToDisplay(ann._coordinates(), null);
      expect(check[0].x).toBeCloseTo(50);
      expect(check[0].y).toBeCloseTo(0);
      // we can't break an already open line
      ann.selectEditHandle(handles[1], true);
      expect(ann.mouseClickEdit(evt)).toBe(undefined);
      expect(ann.mouseClickEdit(evt)).toBe(undefined);
    });
  });

  describe('annotation registry', function () {
    var newshapeCount = 0;
    it('listAnnotations', function () {
      var list = geo.listAnnotations();
      expect($.inArray('rectangle', list) >= 0).toBe(true);
      expect($.inArray('polygon', list) >= 0).toBe(true);
      expect($.inArray('point', list) >= 0).toBe(true);
      expect($.inArray('line', list) >= 0).toBe(true);
      expect($.inArray('unknown', list) >= 0).toBe(false);
    });
    it('registerAnnotation', function () {
      var func = function () { newshapeCount += 1; return 'newshape return'; };
      sinon.stub(console, 'warn', function () {});
      expect($.inArray('newshape', geo.listAnnotations()) >= 0).toBe(false);
      expect(geo.registerAnnotation('newshape', func)).toBe(undefined);
      expect($.inArray('newshape', geo.listAnnotations()) >= 0).toBe(true);
      expect(console.warn.calledOnce).toBe(false);
      expect(geo.registerAnnotation('newshape', func).func).toBe(func);
      expect(console.warn.calledOnce).toBe(true);
      expect($.inArray('newshape', geo.listAnnotations()) >= 0).toBe(true);
      console.warn.restore();
    });
    it('createAnnotation', function () {
      sinon.stub(console, 'warn', function () {});
      expect(geo.createAnnotation('unknown')).toBe(undefined);
      expect(console.warn.calledOnce).toBe(true);
      console.warn.restore();
      expect(newshapeCount).toBe(0);
      expect(geo.createAnnotation('newshape')).toBe('newshape return');
      expect(newshapeCount).toBe(1);
    });
    it('featuresForAnnotations', function () {
      var features = geo.featuresForAnnotations(['polygon']);
      expect($.inArray('polygon', features) >= 0).toBe(true);
      expect($.inArray('line.basic', features) >= 0).toBe(true);
      expect($.inArray('point', features) >= 0).toBe(false);
      features = geo.featuresForAnnotations({polygon: true});
      expect($.inArray('polygon', features) >= 0).toBe(true);
      expect($.inArray('line.basic', features) >= 0).toBe(true);
      expect($.inArray('point', features) >= 0).toBe(false);
      features = geo.featuresForAnnotations({polygon: [geo.annotation.state.done]});
      expect($.inArray('polygon', features) >= 0).toBe(true);
      expect($.inArray('line.basic', features) >= 0).toBe(false);
      expect($.inArray('point', features) >= 0).toBe(false);
      features = geo.featuresForAnnotations({polygon: [geo.annotation.state.done, geo.annotation.state.create]});
      expect($.inArray('polygon', features) >= 0).toBe(true);
      expect($.inArray('line.basic', features) >= 0).toBe(true);
      expect($.inArray('point', features) >= 0).toBe(false);
      features = geo.featuresForAnnotations(['polygon', 'point']);
      expect($.inArray('polygon', features) >= 0).toBe(true);
      expect($.inArray('line.basic', features) >= 0).toBe(true);
      expect($.inArray('point', features) >= 0).toBe(true);
      features = geo.featuresForAnnotations(['polygon', 'unknown']);
      expect($.inArray('polygon', features) >= 0).toBe(true);
      expect($.inArray('line.basic', features) >= 0).toBe(true);
      expect($.inArray('point', features) >= 0).toBe(false);
    });
    it('rendererForAnnotations', function () {
      sinon.stub(console, 'warn', function () {});
      expect(geo.rendererForAnnotations(['polygon'])).toBe('vgl');
      expect(console.warn.calledOnce).toBe(false);
      expect(geo.rendererForAnnotations(['point'])).toBe('vgl');
      geo.gl.vglRenderer.supported = function () { return false; };
      expect(geo.rendererForAnnotations(['polygon'])).toBe(false);
      expect(console.warn.calledOnce).toBe(true);
      expect(geo.rendererForAnnotations(['point'])).toBe('d3');
      console.warn.restore();
    });
  });
});
