/* global describe, it, beforeEach, afterEach, expect, $, geo */

describe('mapInteractor', function () {
  'use strict';

  beforeEach(function () {
    // create a new div
    $('body').append('<div id="mapNode1" class="mapNode"></div>');
    $('body').append('<div id="mapNode2" class="mapNode"></div>');
  });

  afterEach(function () {
    // delete the div
    $('.mapNode').remove();
  });

  it('Test initialization with given node.', function () {
    var map = geo.object();
    map.node = function () { return $('#mapNode1'); };

    var interactor = geo.mapInteractor({ map: map });

    expect(interactor.map()).toBe(map);

    interactor.destroy();

    expect(interactor.map()).toEqual(false);
  });
});
