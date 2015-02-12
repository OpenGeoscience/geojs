/**
 *  Including this file will load all geojs sources as individual files.
 */
(function () {
  var sources, srcRoot, script, attr = '';

  sources = JSON.parse(
    '["src/core/init.js","src/core/version.js","src/vgl/init.js","src/vgl/GL.js","src/vgl/timestamp.js","src/vgl/object.js","src/vgl/event.js","src/vgl/boundingObject.js","src/vgl/node.js","src/vgl/groupNode.js","src/vgl/actor.js","src/vgl/freezeObject.js","src/vgl/defaultValue.js","src/vgl/geojsonReader.js","src/vgl/data.js","src/vgl/geomData.js","src/vgl/mapper.js","src/vgl/groupMapper.js","src/vgl/materialAttribute.js","src/vgl/blend.js","src/vgl/material.js","src/vgl/renderer.js","src/vgl/renderWindow.js","src/vgl/camera.js","src/vgl/interactorStyle.js","src/vgl/trackballInteractorStyle.js","src/vgl/pvwInteractorStyle.js","src/vgl/viewer.js","src/vgl/shader.js","src/vgl/shaderProgram.js","src/vgl/texture.js","src/vgl/uniform.js","src/vgl/vertexAttribute.js","src/vgl/source.js","src/vgl/planeSource.js","src/vgl/pointSource.js","src/vgl/lineSource.js","src/vgl/utils.js","src/vgl/picker.js","src/vgl/shapefileReader.js","src/vgl/vtkReader.js","src/vgl/DataBuffers.js","src/util/init.js","src/util/wigglemaps.js","src/core/object.js","src/core/sceneObject.js","src/core/timestamp.js","src/core/ellipsoid.js","src/core/mercator.js","src/core/latlng.js","src/core/layer.js","src/core/featureLayer.js","src/core/event.js","src/core/mapInteractor.js","src/core/clock.js","src/core/fileReader.js","src/core/jsonReader.js","src/core/map.js","src/core/feature.js","src/core/pointFeature.js","src/core/lineFeature.js","src/core/pathFeature.js","src/core/polygonFeature.js","src/core/planeFeature.js","src/core/vectorFeature.js","src/core/geomFeature.js","src/core/graphFeature.js","src/core/transform.js","src/core/renderer.js","src/core/osmLayer.js","src/gl/init.js","src/gl/renderer.js","src/gl/lineFeature.js","src/gl/pointFeature.js","src/gl/geomFeature.js","src/gl/planeFeature.js","src/gl/polygonFeature.js","src/gl/vglRenderer.js","src/d3/init.js","src/d3/object.js","src/d3/pointFeature.js","src/d3/lineFeature.js","src/d3/pathFeature.js","src/d3/graphFeature.js","src/d3/planeFeature.js","src/d3/vectorFeature.js","src/d3/d3Renderer.js","src/ui/init.js","src/ui/uiLayer.js","src/ui/widget.js","src/ui/sliderWidget.js","src/ui/legendWidget.js","src/plugin/jquery-plugin.js"]'
  );

  srcRoot = '/';


  // Get the currently executing script tag.
  script = document.getElementsByTagName('script');
  script = script[script.length - 1];

  // Pop data cover attribute if present
  if (script.attributes.getNamedItem('data-cover')) {
    script.attributes.removeNamedItem('data-cover');
    attr = 'data-cover';
  }

  document.write('<script src="' + srcRoot + 'built/geo.ext.min.js" type="text/javascript" charset="UTF8"></script>');
  sources.forEach(function (src) {
    document.write(
      '<script src="' +
      srcRoot + src +
      '"' +
      attr +
      '></script>'
    );
  });
}());
