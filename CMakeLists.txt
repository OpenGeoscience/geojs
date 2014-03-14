cmake_minimum_required(VERSION 2.8.8)

project(geojs)

set(MINIFY ON CACHE BOOL "Minify the JavaScript files prior to concatenating.")
set(MANGLE ON CACHE BOOL "When minifying, also mangle non-public symbol names.")
set(GEOJS_DATA_DIR "" CACHE PATH  "Path to directory containing data for testing.")
set(GEOJS_BASELINE_DIR "" CACHE PATH "Path to directory containing baseline images for testing.")
set(BUILD_TESTING OFF CACHE BOOL "Enable testing")

# Uglify and concatenate the library js files.
if(NOT ${MINIFY})
    set(MINIFY_FLAG "-b")
endif()

if(${MINIFY} AND ${MANGLE})
    set(MANGLE_FLAG "-m")
endif()


list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake")

# Find JSLint.
find_package(JSLint)

# Find UglifyJS.
find_package(UglifyJS)

set(_source_files
  core/init.js
  core/object.js
  core/sceneObject.js
  core/timestamp.js
  core/ellipsoid.js
  core/mercator.js
  core/latlng.js
  core/layer.js
  core/featureLayer.js
  core/featureCollection.js
  core/layerSource.js
  core/archiveLayerSource.js
  core/event.js
  core/time.js
  core/map.js
  core/feature.js
  core/pointFeature.js
  core/lineFeature.js
  core/polygonFeature.js
  core/planeFeature.js
  core/geomFeature.js
  core/geoTransform.js
  core/data.js
  core/renderer.js
  gl/init.js
  gl/renderer.js
  gl/pointFeature.js
  gl/geomFeature.js
  gl/pointFeature.js
  gl/planeFeature.js
  gl/simpleRenderer.js
  d3/init.js
  d3/pointFeature.js
  d3/d3Renderer.js
  ui/init.js
  ui/gis.js
  srv/init.js
  srv/webSocket.js
  wfl/init.js
  wfl/utils.js
  wfl/workflow.js
  wfl/module.js
  wfl/connection.js
  wfl/port.js
  wfl/registry.js
  wfl/inputModule.js
  wfl/outputPort.js
  wfl/inputPort.js
  wfl/layerSource.js
  wfl/editor.js
  wfl/style.js
  wfl/staticWorkflows.js
)

set(_exclude_js_lint
  wfl/registry.js
  wfl/staticWorkflows.js
)

# GeoJS requires a deployment directory
if (NOT DEFINED GEOJS_DEPLOY_DIR)
  set(GEOJS_DEPLOY_DIR "${CMAKE_CURRENT_BINARY_DIR}/deploy"
      CACHE PATH "PATH to deployment directory" FORCE)
endif()

# Create deploy directory if it does not exists
if(NOT DEFINED "${GEOJS_DEPLOY_LIB_DIR}")
  set(GEOJS_DEPLOY_LIB_DIR "${GEOJS_DEPLOY_DIR}/web/lib")
  add_custom_command(OUTPUT "${GEOJS_DEPLOY_LIB_DIR}"
    COMMAND ${CMAKE_COMMAND} -E make_directory "${GEOJS_DEPLOY_LIB_DIR}"
  )
  add_custom_target(geojs_pre_deploy ALL DEPENDS ${GEOJS_DEPLOY_LIB_DIR})
endif()

set(VGL_DEPLOY_DIR "${GEOJS_DEPLOY_DIR}")
set(VGL_DEPLOY_LIB_DIR "${GEOJS_DEPLOY_LIB_DIR}")

set(_min_js_file ${GEOJS_DEPLOY_LIB_DIR}/geojs.min.js)

macro(list_contains var value)
  set(${var})
  foreach(value2 ${ARGN})
    if(${value} STREQUAL ${value2})
      set(${var} TRUE)
    endif(${value} STREQUAL ${value2})
  endforeach(value2)
endmacro(list_contains)

set(_js_lint_files)
set(_js_uglify_files)
foreach(d ${_source_files})
  list_contains(contains d ${_exclude_js_lint})
  if(NOT contains)
      set(_js_lint_files ${_js_lint_files} ${CMAKE_CURRENT_SOURCE_DIR}/src/${d})
  endif()
  set(_js_uglify_files ${_js_uglify_files} ${CMAKE_CURRENT_SOURCE_DIR}/src/${d})
endforeach()

if (UglifyJS_EXECUTABLE)
  add_custom_command(
    OUTPUT ${_min_js_file}
    COMMAND ${UglifyJS_EXECUTABLE} -o ${_min_js_file} ${_js_uglify_files}
            ${MINIFY_FLAG} ${MANGLE_FLAG}
    DEPENDS ${GEOJS_DEPLOY_LIB_DIR} ${_js_uglify_files}
  )
else()
  # Use custom command to call CMake script to cat files together
  add_custom_command(
    OUTPUT ${_min_js_file}
    COMMAND ${CMAKE_COMMAND} -DCAT_OUTPUT_FILE=${_min_js_file}
            # Note the quotes so we get the ; included
            "-DCAT_FILES=${_js_uglify_files}"
            -P ${CMAKE_CURRENT_SOURCE_DIR}/cmake/cat.cmake
    DEPENDS ${GEOJS_DEPLOY_LIB_DIR} ${_js_uglify_files}
    VERBATIM
  )
endif()

# Build project
add_custom_target(${PROJECT_NAME} ALL DEPENDS ${_min_js_file})
add_dependencies(${PROJECT_NAME} geojs_pre_deploy)

# Testing
if (BUILD_TESTING)
  include(CTest)
  enable_testing()

  if(EXISTS "${GEOJS_DATA_DIR}" AND IS_DIRECTORY "${GEOJS_DATA_DIR}")
    message("[info] GeoJS data directory is set to ${GEOJS_DATA_DIR}")
    set(VGL_DATA_DIR "${GEOJS_DATA_DIR}")
  else()
    message(FATAL_ERROR "GeoJS testing requires valid data directory")
  endif()

  if(EXISTS "${GEOJS_BASELINE_DIR}" AND IS_DIRECTORY "${GEOJS_BASELINE_DIR}")
    message("[info] GeoJS baseline directory is set to ${GEOJS_BASELINE_DIR}")
    set(VGL_BASELINE_DIR "${GEOJS_BASELINE_DIR}")
  else()
    message(FATAL_ERROR "GeoJS testing requires valid baseline directory")
  endif()

  add_custom_command(
    OUTPUT "${GEOJS_DEPLOY_DIR}/testing"
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/testing
            "${GEOJS_DEPLOY_DIR}/testing"
  )
  add_custom_target(geojs_testing ALL DEPENDS "${GEOJS_DEPLOY_DIR}/testing")
  add_dependencies(${PROJECT_NAME} geojs_testing)

  # GUI testing (requires python)
  find_package(PythonInterp REQUIRED)
endif()

add_subdirectory(vgl)
add_dependencies(vgl geojs_pre_deploy)

# JSLint tests.
foreach(f ${_js_lint_files})
    add_test(jslint-${f} ${JSLint_EXECUTABLE} ${f})
endforeach()
