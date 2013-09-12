//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.geo
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global geoModule, ogs, inherit, $, HTMLCanvasElement, Image*/
/*global vglModule, document*/
//////////////////////////////////////////////////////////////////////////////

geoModule.time = {};

geoModule.time.incrementTime = function (time, unit, delta) {
  'use strict';

  if (unit === 'days') {
    time.setDate(time.getDate() + delta);
  }
  else if (unit === 'months') {
    time.setMonth(time.getMonth() + delta);
  }
  else if (unit === 'years') {
    time.setYear(time.getYear() + delta);
  }

  return time;
};
