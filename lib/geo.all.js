function geojsLoadDependencies() {
  if (typeof (jQuery) === "undefined") {
    document.write('<script src="http://opengeoscience.github.io/geojs/lib/jquery-1.9.1.js"></script>');
  }

  if (typeof (glMatrix) === "undefined") {
    document.write('<script src="http://opengeoscience.github.io/geojs/lib/gl-matrix.js"></script>');
  }

  if (typeof (d3) === "undefined") {
    document.write('<script src="http://opengeoscience.github.io/geojs/lib/d3.v3.min.js"></script>');
  }

  if (typeof (Proj4js) === "undefined") {
    document.write('<script src="http://opengeoscience.github.io/geojs/lib/proj4.js"></script>');
  }  

  if (typeof (vgl) === "undefined") {
    document.write('<script src="http://opengeoscience.github.io/geojs/lib/vgl.js"></script>');
  }

  if (typeof (geo) === "undefined") {
    document.write('<script src="http://opengeoscience.github.io/geojs/lib/geo.js"></script>');
  }
}
