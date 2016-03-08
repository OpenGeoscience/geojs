var globals = {
  d3: require('d3'),
  $: require('jquery'),
  jQuery: require('jquery'),
  mat4: require('gl-mat4'),
  vec2: require('gl-vec2'),
  vec3: require('gl-vec3'),
  vec4: require('gl-vec4'),
  proj4: require('proj4'),
  PNLTRI: require('pnltri')
};

var symbol;

// inject global variables
for (symbol in globals) {
  window[symbol] = globals[symbol];
}

module.exports = globals;
