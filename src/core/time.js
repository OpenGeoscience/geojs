//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo
 */
//////////////////////////////////////////////////////////////////////////////

geo.time = {};

geo.time.incrementTime = function (time, unit, delta) {
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
  else if (unit === 'index') {
    time = time + delta;
  }

  return time;
};
