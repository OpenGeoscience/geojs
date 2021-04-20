module.exports = Object.assign(
  require('./common'),
  /* These modules are merged to a common name space */
  require('./color'),
  require('./throttle'),
  require('./mockVGL'),
  /* These modules are added under separate names */
  {
    DistanceGrid: require('./distanceGrid'),
    ClusterGroup: require('./clustering'),
    mesh: require('./mesh')
  }
);
