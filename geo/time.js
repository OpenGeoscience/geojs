geoModule.time = {}

geoModule.time.incrementTime = function (time, unit, delta) {

  if (unit == 'days') {
    time.setDate(time.getDate() + delta);
  }
  else if (unit == 'months') {
    time.setMonth(time.getMonth() + delta);
  }
  else if (unit == 'years') {
    time.setYear(time.getYear() + delta);
  }

  return time;
}
