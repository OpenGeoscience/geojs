var timegap = 3600,
    url = 'https://opensky-network.org/api/states/all',
    flights = {};

// This is an enum for referencing the state data from The OpenSky Network.
var rr = {
  icao24: 0,
  callsign: 1,
  country: 2,
  timePosition: 3,
  lastContact: 4,
  longitude: 5,
  latitude: 6,
  geoAltitude: 7,
  onGround: 8,
  velocity: 9,
  trueTrack: 10,
  verticalRate: 11,
  sensors: 12,
  baroAltitude: 13,
  squawk: 14,
  spi: 15,
  positionSource: 16
};

/**
 * The worker is started when it receives a message.
 *
 * @param {object} evt The event with posted data for the worker.
 * @param {object} evt.data Data for the worker.
 * @param {number} [evt.data.interval=30000] The polling duration in ms.
 * @param {number} [evt.data.keep=3600000] The duration of data to keep in
 *   memory in ms.  0 for infinite.
 */
onmessage = function (evt) {
  var interval = evt.data.interval || 30000,
      keep = evt.data.keep,
      starttime = Date.now();

  /**
   * Fetch data from the source url, process it if successful, and schedule
   * anotehr data collection when done or errored.
   */
  function fetchData() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function () {
      var status = xhr.status;
      if (status === 200) {
        try {
          process(xhr.response);
        } catch (err) {
          console.log(err);
        }
        wait();
      } else {
        wait();
      }
    };
    xhr.onerror = wait;
    xhr.send();
  }

  /**
   * Wait until the next collection time then fecth more data.
   */
  function wait() {
    var nexttime = starttime,
        delay = nexttime - Date.now();
    while (delay < 1) {
      nexttime += interval;
      delay = nexttime - Date.now();
    }
    starttime = nexttime;
    setTimeout(fetchData, delay);
  }

  /**
   * Process data from the source.
   *
   * @param {object} data The parsed JSON data from the source.
   */
  function process(data) {
    // If we don't have a valid time, don't process this.
    if (!data.time) {
      return;
    }
    // If we should only keep data for a specified duration, delete older data.
    if (keep) {
      // Round our cutoff time to avoid jitter.
      var cutoff = data.time - (Math.ceil(keep / interval) + 0.5) * interval / 1000;
      Object.keys(flights).forEach(function (id) {
        while (flights[id].time[0] < cutoff) {
          ['time', 'lon', 'lat', 'z', 'v', 'dir', 'vz'].forEach(function (key) {
            flights[id][key].shift();
          });
          if (!flights[id].time.length) {
            delete flights[id];
            return;
          }
        }
      });
    }
    // Process each aircraft state.
    var id, state = {}, last;
    data.states.forEach(function (record, idx) {
      // Only process the data if passes some basic checks.
      if (!record.length) {
        return;
      }
      if (!record[rr.icao24] || !record[rr.callsign] ||
          !record[rr.timePosition] || !record[rr.lastContact] ||
          record[rr.longitude] === null || record[rr.latitude] === null ||
          record[rr.geoAltitude] === null || record[rr.onGround] ||
          record[rr.velocity] === null || record[rr.velocity] < 0 ||
          record[rr.velocity] > 360 || record[rr.trueTrack] === null ||
          record[rr.verticalRate] === null ||
          Math.abs(record[rr.verticalRate]) > 200) {
        return;
      }
      id = record[rr.icao24];
      state.time = data.time;
      state.lon = record[rr.longitude];
      state.lat = record[rr.latitude];
      state.z = record[rr.geoAltitude];
      state.v = record[rr.velocity];
      state.dir = record[rr.trueTrack];
      state.vz = record[rr.verticalRate];
      if (flights[id]) {
        last = flights[id].time.length - 1;
        // If the current state is later than the most recent recorded state,
        // ignore it.
        if (state.time <= flights[id].time[last]) {
          return;
        }
        // If we haven't seen this aircraft in a long time or it has jumped a
        // large distance, make it a separate track.
        if (Math.abs(state.time - flights[id].time[last]) > timegap ||
            Math.abs(state.z - flights[id].z[last] > 200 ||
            ((state.lat - flights[id].lat[last]) ** 2 +
             (state.lon - flights[id].lon[last]) ** 2) ** 0.5 > 0.5)) {
          if (last) {
            flights[id + '_' + flights[id].time[last]] = flights[id];
          }
          delete flights[id];
        }
      }
      // Store data in arrays to reduce memory use.
      if (!flights[id]) {
        flights[id] = {time: [], lon: [], lat: [], z: [], v: [], dir: [], vz: []};
      }
      ['time', 'lon', 'lat', 'z', 'v', 'dir', 'vz'].forEach(function (key) {
        flights[id][key].push(state[key]);
      });
    });
    // Ouput any aircraft that where the track has two or more points
    var output = [], ranges = {};
    for (id in flights) {
      if (flights[id].time.length > 1) {
        output.push(flights[id]);
      }
    }
    if (!output.length) {
      return;
    }
    // Compute the ranges in the data.  It is better to do it in the worker
    // than the main script, as this is non-blocking.
    ['time', 'z', 'v', 'vz'].forEach(function (key) {
      ranges[key] = {min: output[0][key][0], max: output[0][key][0]};
      output.forEach(function (line) {
        for (var i = 0; i < line[key].length; i += 1) {
          if (line[key][i] < ranges[key].min) {
            ranges[key].min = line[key][i];
          }
          if (line[key][i] > ranges[key].max) {
            ranges[key].max = line[key][i];
          }
        }
      });
    });
    output.ranges = ranges;
    // Send the results to the main script.
    postMessage(output);
  }

  // start a data collection immediately.
  fetchData();
};
