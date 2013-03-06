var ogs = ogs || {};

ogs.namespace = function(ns_string) {
  var parts = ns_string.split('.'), parent = ogs, i;

  // strip redundant leading global
  if (parts[0] === "ogs") {
    parts = parts.slice(1);
  }
  for (i = 0; i < parts.length; i += 1) {
    // create a property if it doesn't exist
    if (typeof parent[parts[i]] === "undefined") {
      parent[parts[i]] = {};
    }
    parent = parent[parts[i]];
  }
  return parent;
};

//////////////////////////////////////////////////////////////////////////////
///
/// Globals
///
//////////////////////////////////////////////////////////////////////////////

gl = 0;

//////////////////////////////////////////////////////////////////////////////
///
/// Initialize WegGL
///
//////////////////////////////////////////////////////////////////////////////

function initWebGL(canvas) {
  // Initialize the global variable gl to null.
  gl = null;

  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  }
  catch (e) {
  }

  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}